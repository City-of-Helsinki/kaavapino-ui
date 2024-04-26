import { createStore, combineReducers, applyMiddleware } from 'redux'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import createSagaMiddleware from 'redux-saga'
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction'
import { createLogger } from 'redux-logger'
import { createBrowserHistory } from 'history'
import reducers from './reducers'
import sagas from './sagas'
import userManager from './utils/userManager'
import apiUtils from './utils/apiUtils'
import { userLoaded, userUnloaded } from './actions/authActions'
import { tokenLoaded } from './actions/apiActions'

export const history = createBrowserHistory()
const sagaMiddleware = createSagaMiddleware()

const createRootReducer = (history) =>
  combineReducers({
    router: connectRouter(history),
    ...reducers
  })

const middlewareArray = [routerMiddleware(history), sagaMiddleware]

if (process.env.NODE_ENV === 'development') {
  const logger = createLogger({
    collapsed: true
  })
  middlewareArray.push(logger)
}

const composeEnhancers = composeWithDevTools({})

const store = createStore(
  createRootReducer(history),
  composeEnhancers(applyMiddleware(...middlewareArray))
)

sagaMiddleware.run(sagas)


// Hack to prevent initial double loading of token
let skipNextRenew = false

const renewApiToken = async (accessToken) => {
  if (skipNextRenew) {
    skipNextRenew = false
    return
  }
  apiUtils.setToken(accessToken)
  const data = await apiUtils.get(process.env.REACT_APP_OPENID_ENDPOINT + '/api-tokens/')
  const apiToken = data[process.env.REACT_APP_OPENID_AUDIENCE]
  apiUtils.setToken(apiToken)
  store.dispatch(tokenLoaded(apiToken))
}

userManager.getUser().then(async (user) => {
  if (user && !user.expired) {
    store.dispatch(userLoaded(user))
    await renewApiToken(user.access_token)
    skipNextRenew = true
  } else {
    store.dispatch(userUnloaded())
  }
}).catch((e) => console.error(e))

userManager.events.addUserLoaded((user) => renewApiToken(user.access_token))
userManager.events.addUserUnloaded(() => store.dispatch(userUnloaded()))

export default store
