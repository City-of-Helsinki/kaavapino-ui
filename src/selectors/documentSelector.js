import { createSelector } from 'reselect'

const selectDocument = state => state.document

export const documentsSelector = createSelector(
  selectDocument,
  document => document.documents
)

export const documentsLoadingSelector = createSelector(
  selectDocument,
  ({ documentsLoading }) => documentsLoading
)

export const documentPreviewSelector = createSelector(
  selectDocument,
  ({ documentPreview }) => documentPreview
)

export const documentDownloadedSelector = createSelector(
  selectDocument,
  ({ documentDownloaded }) => documentDownloaded
)
