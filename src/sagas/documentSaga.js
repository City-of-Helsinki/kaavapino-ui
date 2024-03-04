import axios from 'axios'

import { takeLatest, put, call, all, delay } from 'redux-saga/effects'
import {
  FETCH_DOCUMENTS,
  fetchDocumentsSuccessful,
  DOWNLOAD_DOCUMENT,
  DOWNLOAD_DOCUMENT_PREVIEW,
  downloadDocumentDone
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
  const modifiedUrl = payload.file + '?immediate=true'
  yield put(downloadDocumentDone(false))
  toastr.info(
    payload.projectCard
      ? i18next.t('document-loading.project-card-title')
      : i18next.t('document-loading.wait-title'),
    payload.projectCard
      ? i18next.t('document-loading.project-card-content')
      : i18next.t('document-loading.document-content'),
    { closeOnToastrClick: false, timeOut:0, removeOnHover: false, removeOnHoverTimeOut: 0 }
  )
  try {
    res = yield call(axios.get, modifiedUrl, { responseType: 'blob' })

    currentTask = res && res.data ? res.data.detail : null

    if (!currentTask && res.status !== 200) {
      toastr.removeByType('info')
      toastr.error(
        payload.projectCard
          ? i18next.t('document-loading.project-card-title')
          : i18next.t('document-loading.error-title'),
        payload.projectCard
          ? i18next.t('document-loading.project-card-error')
          : i18next.t('document-loading.document-error')
      )

      isError = true
      yield put(downloadDocumentDone(true))
    } else {
      while ((!res || res.status === 202) && !isError && counter < MAX_COUNT) {
        if (res && res.status === 500) {
          isError = true
          toastr.removeByType('info')
          toastr.error(
            payload.projectCard
              ? i18next.t('document-loading.project-card-title')
              : i18next.t('document-loading.error-title'),
            payload.projectCard
              ? i18next.t('document-loading.project-card-error')
              : i18next.t('document-loading.document-error')
          )
          yield put(downloadDocumentDone(true))
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
      payload.projectCard
        ? i18next.t('document-loading.project-card-title')
        : i18next.t('document-loading.error-title'),
      payload.projectCard
        ? i18next.t('document-loading.project-card-error')
        : i18next.t('document-loading.document-error')
    )
    isError = true
    yield put(downloadDocumentDone(true))
  }

  toastr.removeByType('info')

  if (counter === MAX_COUNT) {
    toastr.error(
      payload.projectCard
        ? i18next.t('document-loading.project-card-title')
        : i18next.t('document-loading.error-title'),
      payload.projectCard
        ? i18next.t('document-loading.project-card-error')
        : i18next.t('document-loading.document-error')
    )
    yield put(downloadDocumentDone(true))
  }

  if (!isError && counter !== MAX_COUNT) {
    const fileData = res.data

    const contentDisposition = res.headers['content-disposition']
    const fileName = contentDisposition && contentDisposition.split('filename=')[1]
    if (fileData) {
      FileSaver.saveAs(fileData, fileName)

      toastr.success(
        payload.projectCard
          ? i18next.t('document-loading.project-card-title')
          : i18next.t('document-loading.ready-title'),
        payload.projectCard
          ? i18next.t('document-loading.project-card-loaded')
          : i18next.t('document-loading.document-loaded')
      )
      yield put(downloadDocumentDone(true))
    } else {
      toastr.error(
        payload.projectCard
          ? i18next.t('document-loading.project-card-title')
          : i18next.t('document-loading.error-title'),
        payload.projectCard
          ? i18next.t('document-loading.project-card-error')
          : i18next.t('document-loading.document-error')
      )
      yield put(downloadDocumentDone(true))
    }
  }
}

function* downloadDocumentPreviewSaga({ payload }) {
  let res
  let currentTask
  let isError = false

  let counter = 0
  const modifiedUrl = payload.file + '?preview=true&immediate=true'
  yield put(downloadDocumentDone(false))
  toastr.info(
    i18next.t('document-loading.wait-title'),
    i18next.t('document-loading.document-preview-content'),
    { closeOnToastrClick: false, timeOut:0, removeOnHover: false, removeOnHoverTimeOut: 0 }
  )

  try {
    res = yield call(axios.get, modifiedUrl, { responseType: 'blob' })
    currentTask = res && res.data ? res.data.detail : null

    if (!currentTask && res.status !== 200) {
      toastr.removeByType('info')
      toastr.error(
        i18next.t('document-loading.error-title'),
        i18next.t('document-loading.document-preview-error')
      )

      isError = true
      yield put(downloadDocumentDone(true))
    } else {
      while ((!res || res.status === 202) && !isError && counter < MAX_COUNT) {
        if (res && res.status === 500) {
          toastr.removeByType('info')
          toastr.error(
            i18next.t('document-loading.error-title'),
            i18next.t('document-loading.document-preview-error')
          )
          isError = true
          yield put(downloadDocumentDone(true))
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
      i18next.t('document-loading.error-title'),
      i18next.t('document-loading.document-preview-error')
    )
    isError = true
    yield put(downloadDocumentDone(true))
  }

  toastr.removeByType('info')

  if (counter === MAX_COUNT) {
    toastr.error(
      i18next.t('document-loading.error-title'),
      i18next.t('document-loading.document-preview-error')
    )
    yield put(downloadDocumentDone(true))
  }

  if (!isError && counter !== MAX_COUNT) {
    const fileData = res.data

    const contentDisposition = res.headers['content-disposition']
    const fileName = contentDisposition && contentDisposition.split('filename=')[1]
    if (fileData) {
      FileSaver.saveAs(fileData, fileName)

      toastr.success(
        i18next.t('document-loading.ready-title'),
        i18next.t('document-loading.document-preview-loaded')
      )
      yield put(downloadDocumentDone(true))
    } else {
      toastr.error(
        i18next.t('document-loading.error-title'),
        i18next.t('document-loading.document-preview-error')
      )
      yield put(downloadDocumentDone(true))
    }
  }
}
