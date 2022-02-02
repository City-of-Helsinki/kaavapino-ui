import {
  FETCH_REPORTS_SUCCESSFUL,
  DOWNLOAD_REPORT_REVIEW_SUCCESSFUL,
  CLEAR_REPORT_PREVIEW,
  DOWNLOAD_REPORT_REVIEW,
  DOWNLOAD_REPORT,
  DOWNLOAD_REPORT_SUCCESSFUL,
  CANCEL_REPORT_LOADING,
  CANCEL_REPORT_PREVIEW_LOADING
} from '../actions/reportActions'

export const initialState = {
  reports: null,
  currentReport: undefined,
  reportPreviewLoading: false,
  reportLoading: false
}

export const reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case FETCH_REPORTS_SUCCESSFUL:
      return {
        ...state,
        reports: payload
      }

    case DOWNLOAD_REPORT: {
      return { ...state, reportLoading: true }
    }

    case DOWNLOAD_REPORT_SUCCESSFUL: {
      return { ...state, reportLoading: false }
    }

    case DOWNLOAD_REPORT_REVIEW: {
      return {
        ...state,
        reportPreviewLoading: true
      }
    }
    case DOWNLOAD_REPORT_REVIEW_SUCCESSFUL:
      return {
        ...state,
        currentReport: payload,
        reportPreviewLoading: false
      }
    case CLEAR_REPORT_PREVIEW:
      return {
        ...state,
        currentReport: undefined
      }

    case CANCEL_REPORT_LOADING:
      return {
        ...state,
        reportLoading: false
      }
    case CANCEL_REPORT_PREVIEW_LOADING:
      return {
        ...state,
        reportPreviewLoading: false,
      }
    default:
      return { ...state }
  }
}
