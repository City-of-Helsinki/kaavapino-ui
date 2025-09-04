import { reducer as user, initialState } from '../../reducers/userReducer'
import { FETCH_USERS_SUCCESSFUL } from '../../actions/userActions'
import { describe, it, expect } from 'vitest'

describe('user reducer', () => {
  it('should return the initial state', () => {
    expect(user(undefined, {})).toEqual({
      ...initialState
    })
  })

  it('should handle FETCH_USERS_SUCCESSFUL', () => {
    expect(user(initialState, { type: FETCH_USERS_SUCCESSFUL, payload: 1 })).toEqual({
      ...initialState,
      users: 1
    })
  })
})
