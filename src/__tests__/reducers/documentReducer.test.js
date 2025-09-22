import { reducer as documentReducer, initialState } from '../../reducers/documentReducer'
import {
  FETCH_DOCUMENTS,
  FETCH_DOCUMENTS_SUCCESSFUL
} from '../../actions/documentActions'

import { describe, it, expect } from 'vitest'

describe('document reducer', () => {
  it('should return the initial state', () => {
    expect(documentReducer(undefined, {})).toEqual({
      ...initialState
    })
  })

  it('should handle FETCH_DOCUMENTS', () => {
    const state = {
      ...initialState,
      documents: [1, 2, 3],
      documentsLoading: false
    }
    expect(documentReducer(state, { type: FETCH_DOCUMENTS })).toEqual({
      ...state,
      documents: [],
      documentsLoading: true
    })
  })

  it('should handle FETCH_DOCUMENTS_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      documentsLoading: true
    }
    expect(
      documentReducer(state, { type: FETCH_DOCUMENTS_SUCCESSFUL, payload: [1, 2, 3] })
    ).toEqual({
      ...state,
      documents: [1, 2, 3],
      documentsLoading: false
    })
  })
})
