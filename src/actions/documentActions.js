export const FETCH_DOCUMENTS = 'Fetch documents'
export const FETCH_DOCUMENTS_SUCCESSFUL = 'Fetch documents successful'
export const DOWNLOAD_DOCUMENT = 'Download document'
export const DOWNLOAD_DOCUMENT_PREVIEW = 'Download document preview'
export const CLEAR_DOCUMENT_PREVIEW = 'Clear document preview'
export const DOWNLOAD_DOCUMENT_DONE = 'Download document done'

export const fetchDocuments = projectId => ({ type: FETCH_DOCUMENTS, payload: projectId })
export const fetchDocumentsSuccessful = documents => ({
  type: FETCH_DOCUMENTS_SUCCESSFUL,
  payload: documents
})

export const downloadDocument = payload => ({
  type: DOWNLOAD_DOCUMENT,
  payload: payload
})
export const downloadDocumentPreview = payload => ({
  type: DOWNLOAD_DOCUMENT_PREVIEW,
  payload: payload
})
export const downloadDocumentDone = payload => ({
  type: DOWNLOAD_DOCUMENT_DONE,
  payload: payload
})

export const clearDocumentPreview = documentUrl => ({
  type: CLEAR_DOCUMENT_PREVIEW,
  payload: documentUrl
})
