import { reducer as projectType, initialState } from '../../reducers/projectTypeReducer'
import {
  FETCH_PROJECT_SUBTYPES_SUCCESSFUL,
  FETCH_PROJECT_TYPES_SUCCESSFUL
} from '../../actions/projectTypeActions'

import { describe, it, expect } from 'vitest'

describe('project type reducer', () => {
  it('should return the initial state', () => {
    expect(projectType(undefined, {})).toEqual({
      ...initialState
    })
  })

  it('should handle FETCH_PROJECT_SUBTYPES_SUCCESSFUL', () => {
    expect(
      projectType(initialState, {
        type: FETCH_PROJECT_SUBTYPES_SUCCESSFUL,
        payload: [1, 2, 3]
      })
    ).toEqual({
      ...initialState,
      projectSubtypes: [1, 2, 3]
    })
  })

  it('should handle FETCH_PROJECT_TYPES_SUCCESSFUL', () => {
    expect(
      projectType(initialState, {
        type: FETCH_PROJECT_TYPES_SUCCESSFUL,
        payload: [1, 2, 3]
      })
    ).toEqual({
      ...initialState,
      projectTypes: [1, 2, 3]
    })
  })
})
