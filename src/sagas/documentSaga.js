import axios from 'axios'

import { takeLatest, put, call, all, delay } from 'redux-saga/effects'
import {
  FETCH_DOCUMENTS,
  fetchDocumentsSuccessful,
  DOWNLOAD_DOCUMENT,
  DOWNLOAD_DOCUMENT_PREVIEW
} from '../actions/documentActions'
import { error } from '../actions/apiActions'
import { documentsApi } from '../utils/api'
import { toastr } from 'react-redux-toastr'
import i18next from 'i18next'
import FileSaver from 'file-saver'

const MAX_COUNT = 100
const INTERVAL_MILLISECONDS = 2000

export default function* documentSaga() {
  yield all([
    takeLatest(FETCH_DOCUMENTS, fetchDocumentsSaga),
    takeLatest(DOWNLOAD_DOCUMENT, downloadDocumentSaga),
    takeLatest(DOWNLOAD_DOCUMENT_PREVIEW, downloadDocumentPreviewSaga)
  ])
}

function* fetchDocumentsSaga({ payload: projectId }) {
  try {
    const documents = yield call(documentsApi.get, { path: { id: projectId } })
    yield put(fetchDocumentsSuccessful(documents))
  } catch (e) {
    yield put(error(e))
  }
}

function* downloadDocumentSaga({ payload }) {
  let res
  let currentTask
  let isError = false

  let counter = 0

  toastr.info(
    i18next.t('document-loading.title'),
    i18next.t('document-loading.content', { name: payload.name }),
    { closeOnToastrClick: false }
  )
  try {
  res = yield call(axios.get, payload.file, { responseType: 'text' })

  currentTask = res && res.data ? res.data.detail : null

  if (!currentTask) {
    toastr.removeByType('info')
    toastr.error(
      i18next.t('document-loading.title'),
      i18next.t('document-loading.error', { name: payload.name })
    )

    isError = true
  } else {
    while ((!res || res.status === 202) && !isError && counter < MAX_COUNT) {
      if (res && res.status === 500) {
        isError = true
        toastr.removeByType('info')
        toastr.error(
          i18next.t('document-loading.title'),
          i18next.t('document-loading.error', { name: payload.name })
        )
        break
      }

     
        const includeTaskUrl = payload.file + `?task=${currentTask}`

        res = yield call(axios.get, includeTaskUrl, { responseType: 'blob' })

        counter++

        yield delay(INTERVAL_MILLISECONDS)
      } 
    }
  } catch (e) {
    toastr.error(
      i18next.t('document-loading.title'),
      i18next.t('document-loading.error', { name: payload.name })
    )
    isError = true
  }

  toastr.removeByType('info')

  if (counter === MAX_COUNT) {
    toastr.error(
      i18next.t('document-loading.title'),
      i18next.t('document-loading.error', { name: payload.name })
    )
  }

  if (!isError && counter !== MAX_COUNT) {
    const fileData = res.data

    const contentDisposition = res.headers['content-disposition']
    const fileName = contentDisposition && contentDisposition.split('filename=')[1]
    if (fileData) {
      FileSaver.saveAs(fileData, fileName)

      toastr.success(
        i18next.t('document-loading.title'),
        i18next.t('document-loading.document-loaded', { name: payload.name })
      )
    } else {
      toastr.error(
        i18next.t('document-loading.title'),
        i18next.t('document-loading.error', { name: payload.name })
      )
    }
  }
}

function* downloadDocumentPreviewSaga({ payload }) {
  let res
  let currentTask
  let isError = false

  let counter = 0
  const modifiedUrl = payload.file + '?preview=true'

  toastr.info(
    i18next.t('document-loading.preview-title'),
    i18next.t('document-loading.content', { name: payload.name }),
    { closeOnToastrClick: false }
  )

  try {
    res = yield call(axios.get, modifiedUrl, { responseType: 'text' })
    currentTask = res && res.data ? res.data.detail : null

    if (!currentTask) {
      toastr.removeByType('info')
      toastr.error(
        i18next.t('document-loading.preview-title'),
        i18next.t('document-loading.error', { name: payload.name })
      )

      isError = true
    } else {
      while ((!res || res.status === 202) && !isError && counter < MAX_COUNT) {
        if (res && res.status === 500) {
          toastr.removeByType('info')
          toastr.error(
            i18next.t('document-loading.preview-title'),
            i18next.t('document-loading.error', { name: payload.name })
          )
          isError = true
          break
        }

        const includeTaskUrl = modifiedUrl + `&task=${currentTask}`
        res = yield call(axios.get, includeTaskUrl, { responseType: 'blob' })

        counter++

        yield delay(INTERVAL_MILLISECONDS)
      }
    }
  } catch (e) {
    toastr.error(
      i18next.t('document-loading.preview-title'),
      i18next.t('document-loading.error', { name: payload.name })
    )
    isError = true
  }

  toastr.removeByType('info')

  if (counter === MAX_COUNT) {
    toastr.error(
      i18next.t('document-loading.preview-title'),
      i18next.t('document-loading.error', { name: payload.name })
    )
  }

  if (!isError && counter !== MAX_COUNT) {
    const fileData = res.data

    const contentDisposition = res.headers['content-disposition']
    const fileName = contentDisposition && contentDisposition.split('filename=')[1]
    if (fileData) {
      FileSaver.saveAs(fileData, fileName)

      toastr.success(
        i18next.t('document-loading.preview-title'),
        i18next.t('document-loading.document-loaded', { name: payload.name })
      )
    } else {
      toastr.error(
        i18next.t('document-loading.preview-title'),
        i18next.t('document-loading.error', { name: payload.name })
      )
    }
  }
}
