import { createSelector } from 'reselect'

const selectReport = state => state.report

export const reportsSelector = createSelector(selectReport, ({ reports }) => reports)
export const currentReportsSelector = createSelector(selectReport, ({ currentReport }) => currentReport)
export const reportPreviewLoadingSelector = createSelector( selectReport, ({reportPreviewLoading}) => reportPreviewLoading)
export const reportLoadingSelector = createSelector( selectReport, ({reportLoading}) => reportLoading)
export const externalReportsUrlSelector = createSelector(selectReport, ({ externalReportsUrl }) => externalReportsUrl)
