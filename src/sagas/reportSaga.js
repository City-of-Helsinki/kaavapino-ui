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

const statusToastProps = {
  showCloseButton: false,
  closeOnToastrClick: true
}

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
    i18next.t('reports.report-cancel'), statusToastProps)

  yield put(downloadReportSuccessful(null))
}
function* cancelReportPreviewLoading() {
  toastr.warning(
    i18next.t('reports.report-preview-cancel-title'),
    i18next.t('reports.report-preview-cancel'), statusToastProps)

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
  yield call(downloadReportSagaImpl, payload, true)
}

function* downloadReportSaga({ payload }) {
  yield call(downloadReportSagaImpl, payload, false)
}

function* downloadReportSagaImpl(payload, isPreview) {
  const infoToastContent = isPreview ? i18next.t('reports.preview-content') : i18next.t('reports.content')
  const errorToastContent = isPreview ? i18next.t('reports.error-preview') : i18next.t('reports.error-report')
  const successToastContent = isPreview ? i18next.t('reports.report-preview-loaded') : i18next.t('reports.report-loaded')

  const filteredParams = yield call(getReportQueryParams, isPreview)

  toastr.info(i18next.t('reports.wait-title'), infoToastContent, statusToastProps)

  let pollResult = { res: undefined, isError: false, counter: 0, reportLoading: true }

  try {
    const res = yield call(
      reportApi.get,
      { path: { id: payload?.selectedReport }, query: { ...filteredParams } },
      ':id/',
      { responseType: 'json' },
      true
    )
    const currentTask = res?.data?.detail ?? null

    if (!currentTask) {
      throw new Error('No task ID received')
    }

    pollResult = yield call(pollForReport, payload, currentTask, isPreview)
  } catch {
    pollResult.isError = true
  }

  toastr.removeByType('info')

  const { res, isError, counter, reportLoading } = pollResult

  if (isError || counter === MAX_COUNT || !res?.data) {
    toastr.error(i18next.t('reports.error-title'), errorToastContent, statusToastProps)
    yield put(isPreview ? downloadReportReviewSuccessful(null) : downloadReportSuccessful())
    return
  }

  // Not cancelled
  if (reportLoading) {
    yield call(handleReportSuccess, res, isPreview, successToastContent)
  }
}

function* getReportQueryParams(isPreview) {
  const form = yield select(reportFormSelector)
  const rest = form ? form.values : {}
  const keys = rest ? Object.keys(rest) : []
  
  let filteredParams = {}

  keys.forEach(key => {
    const value = rest[key]
    if (isArray(value) && value.length > 0 || (!isArray(value) && value)) {
      filteredParams[key] = value
    }
  })

  if (isPreview) {
    filteredParams["preview"] = true
  }

  return filteredParams
}

function* pollForReport(payload, currentTask, isPreview) {
  const poll_url = `:id/?task=:task${isPreview ? '&preview=true' : ''}`
  const responseType = isPreview ? 'json' : 'blob'
  const loadingSelector = isPreview ? reportPreviewLoadingSelector : reportLoadingSelector

  let res
  let isError = false
  let counter = 0
  let reportLoading = true

  while (
    (!res || res.status === 202) &&
    !isError &&
    counter < MAX_COUNT &&
    reportLoading
  ) {
    reportLoading = yield select(loadingSelector)

    if (res?.status === 500) {
      isError = true
      break
    }

    res = yield call(
      reportApi.get,
      { path: { id: payload.selectedReport, task: currentTask } },
      poll_url,
      { responseType },
      true
    )
    counter++

    yield delay(INTERVAL_MILLISECONDS)
  }

  return { res, isError, counter, reportLoading }
}

function* handleReportSuccess(res, isPreview, successToastContent) {
  toastr.success(
    i18next.t('reports.finished-title'),
    successToastContent,
    statusToastProps
  )
  if (isPreview) {
    yield put(downloadReportReviewSuccessful(res.data))
  } else {
    const contentDisposition = res.headers['content-disposition']
    const fileName = contentDisposition?.split('filename=')[1]
    FileSaver.saveAs(res.data, fileName)
    yield put(downloadReportSuccessful())
  }
}
