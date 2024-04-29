import { createStore, combineReducers, applyMiddleware } from 'redux'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import createSagaMiddleware from 'redux-saga'
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction'
import { createLogger } from 'redux-logger'
import { createBrowserHistory } from 'history'
import reducers from './reducers'
import sagas from './sagas'
import userManager from './utils/userManager'
import { userLoaded, userUnloaded } from './actions/authActions'
import { loadApiToken } from './actions/apiActions'

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


// Prevent initial double loading of token
let skipNextTokenLoad = false

userManager.getUser().then(async (user) => {
  if (user && !user.expired) {
    store.dispatch(userLoaded(user))
    store.dispatch(loadApiToken(user.access_token))
    skipNextTokenLoad = true
  } else {
    store.dispatch(userUnloaded())
  }
}).catch((e) => console.error(e))

userManager.events.addUserLoaded((user) => {
  if (skipNextTokenLoad) {
    skipNextTokenLoad = false
  }
  else {
    store.dispatch(loadApiToken(user.access_token))
  }
})
userManager.events.addUserUnloaded(() => store.dispatch(userUnloaded()))

export default store
