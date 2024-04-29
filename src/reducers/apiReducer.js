import { TOKEN_LOADED, INIT_API_REQUEST_SUCCESSFUL } from '../actions/apiActions'
import { USER_UNLOADED } from '../actions/authActions'

export const initialState = {
  apiToken: null,
  apiInitialized: false
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {

    case TOKEN_LOADED: {
      return {
        ...state,
        apiToken: action.payload,
      }
    }

    case USER_UNLOADED: {
      return {
        apiToken: null,
        apiInitialized: false
      }
    }

    case INIT_API_REQUEST_SUCCESSFUL: {
      return {
        ...state,
        apiInitialized: true
      }
    }

    default: {
      return state
    }
  }
}
