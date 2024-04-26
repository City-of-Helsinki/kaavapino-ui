import axios from 'axios'
import { takeLatest, put, all, call } from 'redux-saga/effects'
import { push } from 'connected-react-router'
import { actions as toastrActions } from 'react-redux-toastr'
import {
  ERROR,
  error,
  INIT_API_REQUEST,
  initApiRequestSuccessful,
  DOWNLOAD_FILE
} from '../actions/apiActions'
import apiUtils from '../utils/apiUtils'

export default function* apiSaga() {
  yield all([
    takeLatest(ERROR, handleErrorSaga),
    takeLatest(INIT_API_REQUEST, initApiRequestSaga),
    takeLatest(DOWNLOAD_FILE, downloadFileSaga)
  ])
}

function* handleErrorSaga({ payload }) {
  if (payload.response) {
    const { status } = payload.response
    if (status === 401) {
      yield put(push('/logout'))
    } else if (status === 403) {
      yield put(
        toastrActions.add({
          type: 'error',
          title: 'Virhe',
          message: 'Ei tarvittavia oikeuksia tähän toimintoon!'
        })
      )
    } else {
      if(payload?.config?.url === "/v1/attributes/unlock/" || payload?.config?.url === "/v1/attributes/lock/"){
        console.log("lock error")
      }
      else{
        yield put(
          toastrActions.add({ type: 'error', title: 'Virhe', message: status })
        )
      }
    }
  } else if (payload.custom) {
    yield put(
      toastrActions.add({ type: 'error', title: 'Virhe', message: payload.message })
    )
  }
}

/*
function* userFoundSaga({ payload }) {
  let token = null
  if (!process.env.REACT_APP_API_TOKEN) {
    const audience = process.env.REACT_APP_OPENID_AUDIENCE
    apiUtils.setToken(payload.access_token)
    const data = yield apiUtils.get(process.env.REACT_APP_OPENID_ENDPOINT + '/api-tokens/')
    token = data[audience]
  } else {
    token = process.env.REACT_APP_API_TOKEN
  }
  apiUtils.setToken(token)
  yield put(tokenLoaded(token))
  if (process.env.REACT_APP_API_TOKEN) {
    yield put(loginSuccessful())
  }
}
*/

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
      const url = window.URL.createObjectURL(new Blob([fileData]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (e) {
    yield put(error(e))
  }
}
