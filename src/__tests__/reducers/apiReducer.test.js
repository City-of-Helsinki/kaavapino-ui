import { reducer as api, initialState } from '../../reducers/apiReducer'
import { INIT_API_REQUEST_SUCCESSFUL, TOKEN_LOADED } from '../../actions/apiActions'
import { describe, it, expect } from 'vitest'


describe('api reducer', () => {
  it('should return the initial state', () => {
    expect(api(undefined, {})).toEqual({
      ...initialState
    })
  })

  it('should handle INIT_API_REQUEST_SUCCESSFUL', () => {
    expect(
      api(initialState, { type: INIT_API_REQUEST_SUCCESSFUL, payload: '123' })
    ).toEqual({
      ...initialState,
      apiInitialized: true
    })
  })

  it('should handle TOKEN_LOADED', () => {
    expect(api(initialState, { type: TOKEN_LOADED, payload: '123' })).toEqual({
      ...initialState,
      apiToken: '123',
      loadingToken: false
    })
  })
})
