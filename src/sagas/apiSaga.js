import axios from 'axios'
import { takeLatest, put, all, call } from 'redux-saga/effects'
import { push } from 'connected-react-router'
import { actions as toastrActions } from 'react-redux-toastr'
import {
  ERROR,
  error,
  LOAD_API_TOKEN,
  loadApiToken,
  tokenLoaded,
  INIT_API_REQUEST,
  initApiRequestSuccessful,
  DOWNLOAD_FILE
} from '../actions/apiActions'
import { loginSuccessful } from '../actions/authActions'
import apiUtils from '../utils/apiUtils'
import userManager from '../utils/userManager'

export default function* apiSaga() {
  yield all([
    takeLatest(ERROR, handleErrorSaga),
    takeLatest(LOAD_API_TOKEN, loadApiTokenSaga),
    takeLatest(INIT_API_REQUEST, initApiRequestSaga),
    takeLatest(DOWNLOAD_FILE, downloadFileSaga)
  ])
}

function* recoverFromUnauthorizedSaga(forceSilentRenew = false) {
  try {
    const user = yield call([userManager, userManager.getUser])

    if (!forceSilentRenew && user && !user.expired) {
      yield put(loadApiToken(user.access_token))
      return true
    }

    const renewedUser = yield call([userManager, userManager.signinSilent])

    if (renewedUser?.access_token) {
      yield put(loadApiToken(renewedUser.access_token))
      return true
    }
  } catch (renewalError) {
    console.error('Unable to recover from unauthorized response', renewalError)
  }

  return false
}

function* handleErrorSaga({ payload }) {
  if (payload.response) {
    const { status } = payload.response
    if (status === 401) {
      const forceSilentRenew = payload?.config?.url?.includes('/protocol/openid-connect/token')
      const recovered = yield call(recoverFromUnauthorizedSaga, forceSilentRenew)

      if (!recovered) {
        yield put(push('/logout'))
      }
    } else if (status === 403) {
      yield put(
        toastrActions.add({
          type: 'error',
          title: 'Virhe',
          message: 'Ei tarvittavia oikeuksia tähän toimintoon!'
        })
      )
    } else if (payload?.config?.url === "/v1/attributes/unlock/" || payload?.config?.url === "/v1/attributes/lock/") {
        console.log("lock error")
      }
      else {
        yield put(
          toastrActions.add({ type: 'error', title: 'Virhe', message: status })
        )
      }
  } else if (payload.custom) {
    yield put(
      toastrActions.add({ type: 'error', title: 'Virhe', message: payload.message })
    )
  }
}

function* loadApiTokenSaga({ payload }) {
  let token = null
  if (process.env.REACT_APP_API_TOKEN) {
    token = process.env.REACT_APP_API_TOKEN
  } else {
    apiUtils.setToken(payload)
    const data = yield apiUtils.post(process.env.REACT_APP_OPENID_ENDPOINT + '/protocol/openid-connect/token',
      {
        'audience': process.env.REACT_APP_OPENID_AUDIENCE,
        'grant_type': 'urn:ietf:params:oauth:grant-type:uma-ticket',
        'permission': '#access'
      }, 
      {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      }, true)
    token = data['access_token']
  }
  apiUtils.setToken(token)
  yield put(tokenLoaded(token))
  if (process.env.REACT_APP_API_TOKEN) {
    yield put(loginSuccessful())
  }
}

function* initApiRequestSaga() {
  try {
    yield call(apiUtils.get, '/v1/')
    yield put(initApiRequestSuccessful())
  } catch (e) {
    yield put(error(e))
  }
}

function* downloadFileSaga({ payload: { src, name: fileName } }) {
  try {
    const res = yield call(axios.get, src, { responseType: 'blob' })
    const fileData = res.data
    if (fileData) {
      const url = globalThis.URL.createObjectURL(new Blob([fileData]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
  } catch (e) {
    yield put(error(e))
  }
}
