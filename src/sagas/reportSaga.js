import { takeLatest, all, call, put, select, delay } from 'redux-saga/effects'
import {
  FETCH_REPORTS,
  fetchReportsSuccessful,
  DOWNLOAD_REPORT,
  DOWNLOAD_REPORT_REVIEW,
  downloadReportReviewSuccessful,
  downloadReportSuccessful,
  CANCEL_REPORT_PREVIEW_LOADING,
  CANCEL_REPORT_LOADING
} from '../actions/reportActions'
import { reportFormSelector } from '../selectors/formSelector'
import { error } from '../actions/apiActions'
import { reportApi } from '../utils/api'
import { toastr } from 'react-redux-toastr'
import i18next from 'i18next'
import { isArray } from 'lodash'
import FileSaver from 'file-saver'
import {
  reportPreviewLoadingSelector,
  reportLoadingSelector
} from '../selectors/reportSelector'

const MAX_COUNT = 100
const INTERVAL_MILLISECONDS = 4000

export default function* reportSaga() {
  yield all([
    takeLatest(FETCH_REPORTS, fetchReportsSaga),
    takeLatest(DOWNLOAD_REPORT, downloadReportSaga),
    takeLatest(DOWNLOAD_REPORT_REVIEW, downloadReportPreviewSaga),
    takeLatest(CANCEL_REPORT_PREVIEW_LOADING, cancelReportPreviewLoading),
    takeLatest(CANCEL_REPORT_LOADING, cancelReportLoading)
  ])
}
function* cancelReportLoading() {
  toastr.warning(
    i18next.t('reports.report-cancel-title'),
    i18next.t('reports.report-cancel'))

  yield put(downloadReportSuccessful(null))
}
function* cancelReportPreviewLoading() {
  toastr.warning(
    i18next.t('reports.report-preview-cancel-title'),
    i18next.t('reports.report-preview-cancel'))

  yield put(downloadReportReviewSuccessful(null))
}
function* fetchReportsSaga() {
  try {
    const reports = yield call(reportApi.get)
    yield put(fetchReportsSuccessful(reports))
  } catch (e) {
    yield put(error(e))
  }
}
function* downloadReportPreviewSaga({ payload }) {
  let res
  let currentTask
  let isError = false
  let counter = 0
  let reportPreviewLoading = true

  const form = yield select(reportFormSelector)

  let rest = form ? form.values : {}
  let filteredParams = {}

  const keys = rest ? Object.keys(rest) : []

  keys.forEach(key => {
    const value = rest[key]

    if (isArray(value)) {
      if (value.length > 0) {
        filteredParams[key] = value
      }
    } else {
      if (value) {
        filteredParams[key] = value
      }
    }
  })

  filteredParams = {
    ...filteredParams,
    preview: true
  }
  try {

    // At first API is called to get taskID
    res = yield call(
      reportApi.get,
      { path: { id: payload && payload.selectedReport }, query: { ...filteredParams } },
      ':id/',
      { responseType: 'json' },
      true
    )
    currentTask = res && res.data ? res.data.detail : null

    toastr.info(i18next.t('reports.wait-title'), i18next.t('reports.preview-content'))

    if (!currentTask) {
      toastr.removeByType('info')
      toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-preview'))
      yield put(downloadReportReviewSuccessful(null))
      isError = true
    } else {
      // Polling starts here.
      while (
        (!res || res.status === 202) &&
        !isError &&
        counter < MAX_COUNT &&
        reportPreviewLoading
      ) {

        // Check if report preview is still loading and not cancelled by user.
        reportPreviewLoading = yield select(reportPreviewLoadingSelector)

        if (res && res.status === 500) {
          isError = true
          break
        }

        res = yield call(
          reportApi.get,
          { path: { id: payload.selectedReport, task: currentTask } },
          ':id/?preview=true&task=:task',
          { responseType: 'json' },
          true
        )
        counter++

        yield delay(INTERVAL_MILLISECONDS)
      }
    }
  } catch (e) {
    isError = true
    toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-preview'))
    yield put(downloadReportReviewSuccessful(null))
  }

  // If tried enough but still no correct response. Failure.
  if (counter === MAX_COUNT) {
    toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-preview'))
    yield put(downloadReportReviewSuccessful(null))
  }

  // No error and maximum amount of trying is not yet complete. Success.
  if (!isError && counter !== MAX_COUNT) {

    // Not cancelled
    if (reportPreviewLoading) {
      toastr.success(
        i18next.t('reports.finished-title'),
        i18next.t('reports.report-preview-loaded')
      )
      yield put(downloadReportReviewSuccessful(res.data))
    }
  }
}

function* downloadReportSaga({ payload }) {
  let res
  let currentTask
  let isError = false

  let counter = 0
  let reportLoading = true

  const form = yield select(reportFormSelector)

  let filteredParams = {}

  const rest = form ? form.values : {}

  const keys = rest ? Object.keys(rest) : []

  keys.forEach(key => {
    const value = rest[key]

    if (isArray(value)) {
      if (value.length > 0) {
        filteredParams[key] = value
      }
    } else {
      if (value) {
        filteredParams[key] = value
      }
    }
  })

  toastr.info(i18next.t('reports.wait-title'), i18next.t('reports.content'))

  // At first API is called to get taskID
  try {
    res = yield call(
      reportApi.get,
      { path: { id: payload.selectedReport }, query: { ...filteredParams } },
      ':id/',
      { responseType: 'json' },
      true
    )
    currentTask = res && res.data ? res.data.detail : null

    if (!currentTask) {
      toastr.removeByType('info')
      toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-report'))
      isError = true
      yield put(downloadReportSuccessful())
    } else {
      // Looping starts here. Waiting for correct response.
      while (
        (!res || res.status === 202) &&
        !isError &&
        counter < MAX_COUNT &&
        reportLoading
      ) {
        // Check if report is still loading and not cancelled by user.
        reportLoading = yield select(reportLoadingSelector)

        if (res && res.status === 500) {
          isError = true
          break
        }

        res = yield call(
          reportApi.get,
          { path: { id: payload.selectedReport, task: currentTask } },
          ':id/?task=:task',
          { responseType: 'blob' },
          true
        )
        counter++

        yield delay(INTERVAL_MILLISECONDS)
      }
    }
  } catch (e) {
    toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-report'))
    isError = true
    yield put(downloadReportSuccessful())
  }

  toastr.removeByType('info')

  // Maximum amount is tried and still no correct response. Failure.
  if (counter === MAX_COUNT) {
    toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-report'))
    yield put(downloadReportSuccessful())
  }

  // No errors and not yet tried max amount. Success.
  if (!isError && counter !== MAX_COUNT) {

    // Not cancelled
    if (reportLoading) {
     
      const fileData = res.data

      const contentDisposition = res.headers['content-disposition']
      const fileName = contentDisposition && contentDisposition.split('filename=')[1]

      // File data is found from response. Success.
      if (fileData) {
        FileSaver.saveAs(fileData, fileName)

        toastr.success(
          i18next.t('reports.finished-title'),
          i18next.t('reports.report-loaded')
        )
        yield put(downloadReportSuccessful())
      } else {
        // FileData is not found. Failure.
        toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-report'))
        yield put(downloadReportSuccessful())
      }
    }
  }
}
