import { reducer as api, initialState } from '../../reducers/apiReducer'
import { USER_FOUND } from 'redux-oidc'
import {
  INIT_API_REQUEST_SUCCESSFUL,
  TOKEN_LOADED
} from '../../actions/apiActions'

describe('api reducer', () => {
  it('should return the initial state', () => {
    expect(api(undefined, {})).toEqual({
      ...initialState
    })
  })

  it('should handle USER_FOUND', () => {
    expect(api(initialState, { type: USER_FOUND })).toEqual({
      ...initialState,
      apiToken: null,
      loadingToken: true,
      apiInitialized: false
    })
  })

  it('should handle INIT_API_REQUEST_SUCCESSFUL', () => {
    expect(api(initialState, { type: INIT_API_REQUEST_SUCCESSFUL, payload: '123' })).toEqual({
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