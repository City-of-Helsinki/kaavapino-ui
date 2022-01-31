export const FETCH_REPORTS = 'Fetch reports'
export const FETCH_REPORTS_SUCCESSFUL = 'Fetch reports successful'
export const DOWNLOAD_REPORT = 'Download report'
export const DOWNLOAD_REPORT_REVIEW = 'Download report preview'
export const DOWNLOAD_REPORT_REVIEW_SUCCESSFUL = 'Download report preview successful'
export const CLEAR_REPORT_PREVIEW = 'Clear report preview'
export const DOWNLOAD_REPORT_SUCCESSFUL = 'Export report successful'
export const CANCEL_REPORT_LOADING = 'Cancel report loading'
export const CANCEL_REPORT_PREVIEW_LOADING = 'Cancel report preview loading'

export const fetchReports = () => ({ type: FETCH_REPORTS })
export const fetchReportsSuccessful = reports => ({
  type: FETCH_REPORTS_SUCCESSFUL,
  payload: reports
})
export const downloadReport = report => ({ type: DOWNLOAD_REPORT, payload: report })

export const downloadReportSuccessful = () => ({ type: DOWNLOAD_REPORT_SUCCESSFUL })

export const downloadReportReview = report => ({
  type: DOWNLOAD_REPORT_REVIEW,
  payload: report
})

export const downloadReportReviewSuccessful = report => ({
  type: DOWNLOAD_REPORT_REVIEW_SUCCESSFUL,
  payload: report
})

export const clearDownloadReportReview = () => ({ type: CLEAR_REPORT_PREVIEW })

export const cancelReportPreviewLoading = () => ({
  type: CANCEL_REPORT_PREVIEW_LOADING
})
export const cancelReportLoading = () => ({
  type: CANCEL_REPORT_LOADING
})