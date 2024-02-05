import {
  FETCH_DOCUMENTS,
  FETCH_DOCUMENTS_SUCCESSFUL,
  CLEAR_DOCUMENT_PREVIEW,
  DOWNLOAD_DOCUMENT_DONE
} from '../actions/documentActions'

export const initialState = {
  documents: [],
  documentsLoading: false,
  documentPreview: null,
  documentDownloaded: true
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DOCUMENTS: {
      return {
        ...state,
        documents: [],
        documentsLoading: true
      }
    }

    case FETCH_DOCUMENTS_SUCCESSFUL: {
      return {
        ...state,
        documents: action.payload,
        documentsLoading: false
      }
    }
    case CLEAR_DOCUMENT_PREVIEW: {
      return {
        ...state,
        documentPreview: null
      }
    }

    case DOWNLOAD_DOCUMENT_DONE: {
      return {
        ...state,
        documentDownloaded: action.payload
      }
    }

    default: {
      return state
    }
  }
}
