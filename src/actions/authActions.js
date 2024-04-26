export const LOGIN_SUCCESSFUL = 'Login successful'
export const LOGIN_FAILURE = 'Login failure'
export const LOGOUT = 'Logout'
export const LOGOUT_SUCCESSFUL = 'Logout successful'
export const USER_LOADED = 'User loaded'
export const USER_UNLOADED = 'User unloaded'

export const loginSuccessful = () => ({ type: LOGIN_SUCCESSFUL })

export const loginFailure = () => ({ type: LOGIN_FAILURE })

export const logout = () => ({ type: LOGOUT })

export const logoutSuccessful = () => ({ type: LOGOUT_SUCCESSFUL })

export const userLoaded = (user) => ({ type: USER_LOADED, payload:user})

export const userUnloaded = () => ({type: USER_UNLOADED})

export const fakeLogin = () => ({
  type: 'redux-oidc/USER_FOUND',
  payload: {
    profile: {
      sub: '11111111-2222-3333-4444-555555555555'
    }
  }
})
