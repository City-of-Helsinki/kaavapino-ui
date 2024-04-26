import { USER_LOADED, USER_UNLOADED } from "../actions/authActions"

const initialState = {
  user: null
}

export const reducer = (state=initialState, action) => {
  switch (action.type) {
    case USER_LOADED:
      return {
        user: action.payload
      }
    case USER_UNLOADED:
      return {
        user: null
      }
    default:
      return state;
  }
}