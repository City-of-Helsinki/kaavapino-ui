import { reducer as comment, initialState } from '../../reducers/commentReducer'
import {
  CREATE_COMMENT_SUCCESSFUL,
  DELETE_COMMENT_SUCCESSFUL,
  EDIT_COMMENT_SUCCESSFUL,
  FETCH_COMMENTS_SUCCESSFUL,
  FETCH_COMMENTS
} from '../../actions/commentActions'

import { describe, it, expect } from 'vitest'

describe('comment reducer', () => {
  it('should return the initial state', () => {
    expect(comment(undefined, {})).toEqual({
      ...initialState
    })
  })

  it('should handle CREATE_COMMENT_SUCCESSFUL', () => {
    const updatedState = comment(initialState, {
      type: CREATE_COMMENT_SUCCESSFUL,
      payload: 'test1'
    })
    expect(
      comment(updatedState, { type: CREATE_COMMENT_SUCCESSFUL, payload: 'test2' })
    ).toEqual({
      ...updatedState,
      comments: ['test1', 'test2']
    })
  })

  it('should handle DELETE_COMMENT_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      comments: [{ id: 1 }, { id: 2 }, { id: 3 }]
    }
    expect(comment(state, { type: DELETE_COMMENT_SUCCESSFUL, payload: 1 })).toEqual({
      ...state,
      comments: [{ id: 2 }, { id: 3 }]
    })
    expect(comment(state, { type: DELETE_COMMENT_SUCCESSFUL, payload: 4 })).toEqual({
      ...state
    })
  })

  it('should handle EDIT_COMMENT_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      comments: [
        { id: 1, x: '1' },
        { id: 2, x: '2' },
        { id: 3, x: '3' }
      ]
    }
    expect(
      comment(state, { type: EDIT_COMMENT_SUCCESSFUL, payload: { id: 1, x: 'y' } })
    ).toEqual({
      ...state,
      comments: [
        { id: 1, x: 'y' },
        { id: 2, x: '2' },
        { id: 3, x: '3' }
      ]
    })
    expect(
      comment(state, { type: EDIT_COMMENT_SUCCESSFUL, payload: { id: 4, x: 'y' } })
    ).toEqual({
      ...state
    })
  })

  it('should handle FETCH_COMMENTS_SUCCESSFUL', () => {
    expect(
      comment(
        { ...initialState, commentsLoading: true },
        { type: FETCH_COMMENTS_SUCCESSFUL, payload: [1, 2, 3] }
      )
    ).toEqual({
      ...initialState,
      comments: [1, 2, 3],
      commentsLoading: false
    })
  })

  it('should handle FETCH_COMMENTS', () => {
    expect(comment(initialState, { type: FETCH_COMMENTS })).toEqual({
      ...initialState,
      commentsLoading: true
    })
  })
})
