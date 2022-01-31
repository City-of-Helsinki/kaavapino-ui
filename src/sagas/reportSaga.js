import { takeLatest, all, call, put, select, delay } from 'redux-saga/effects'
import {
  FETCH_REPORTS,
  fetchReportsSuccessful,
  DOWNLOAD_REPORT,
  DOWNLOAD_REPORT_REVIEW,
  downloadReportReviewSuccessful,
  downloadReportSuccessful
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
    takeLatest(DOWNLOAD_REPORT_REVIEW, downloadReportPreviewSaga)
  ])
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
    res = yield call(
      reportApi.get,
      { path: { id: payload && payload.selectedReport }, query: { ...filteredParams } },
      ':id/',
      { responseType: 'text' },
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
      while (
        (!res || res.status === 202) &&
        !isError &&
        counter < MAX_COUNT &&
        reportPreviewLoading
      ) {
        reportPreviewLoading = yield select(reportPreviewLoadingSelector)
        console.log(
          '🚀 ~ file: reportSaga.js ~ line 95 ~ function*downloadReportPreviewSaga ~ reportPreviewLoading',
          reportPreviewLoading
        )

        if (res && res.status === 500) {
          isError = true
          break
        }

        res = yield call(
          reportApi.get,
          { path: { id: payload.selectedReport, task: currentTask } },
          ':id/?preview=true&task=:task',
          { responseType: 'text' },
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

  if (counter === MAX_COUNT) {
    toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-preview'))
    yield put(downloadReportReviewSuccessful(null))
  }

  if (!isError && counter !== MAX_COUNT) {
    if (!reportPreviewLoading) {
      console.log('keskeytetty')
      toastr.error(i18next.t('reports.error-title'), 'keskeytetty')
      yield put(downloadReportReviewSuccessful(null))
    } else {
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
  try {
    res = yield call(
      reportApi.get,
      { path: { id: payload.selectedReport }, query: { ...filteredParams } },
      ':id/',
      { responseType: 'text' },
      true
    )
    currentTask = res && res.data ? res.data.detail : null

    if (!currentTask) {
      toastr.removeByType('info')
      toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-report'))
      isError = true
      yield put(downloadReportSuccessful())
    } else {
      while (
        (!res || res.status === 202) &&
        !isError &&
        counter < MAX_COUNT &&
        reportLoading
      ) {
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

  if (counter === MAX_COUNT) {
    toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-report'))
    yield put(downloadReportSuccessful())
  }

  if (!isError && counter !== MAX_COUNT) {
    if (!reportLoading) {
      console.log('keskeytetty')
      toastr.error(i18next.t('reports.error-title'), 'keskeytetty')
      yield put(downloadReportSuccessful())
    } else {
      const fileData = res.data

      const contentDisposition = res.headers['content-disposition']
      const fileName = contentDisposition && contentDisposition.split('filename=')[1]
      if (fileData) {
        FileSaver.saveAs(fileData, fileName)

        toastr.success(
          i18next.t('reports.finished-title'),
          i18next.t('reports.report-loaded')
        )
        yield put(downloadReportSuccessful())
      } else {
        toastr.error(i18next.t('reports.error-title'), i18next.t('reports.error-report'))
        yield put(downloadReportSuccessful())
      }
    }
  }
}
