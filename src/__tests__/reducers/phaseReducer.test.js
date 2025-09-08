import { reducer as phase, initialState } from '../../reducers/phaseReducer'
import { FETCH_PHASES_SUCCESSFUL } from '../../actions/phaseActions'
import { describe, it, expect } from 'vitest'


describe('phase reducer', () => {
  it('should return the initial state', () => {
    expect(phase(undefined, {})).toEqual({
      ...initialState
    })
  })

  it('should handle FETCH_PHASES_SUCCESSFUL', () => {
    expect(
      phase(initialState, { type: FETCH_PHASES_SUCCESSFUL, payload: [1, 2, 3] })
    ).toEqual({
      ...initialState,
      phases: [1, 2, 3]
    })
  })
})
