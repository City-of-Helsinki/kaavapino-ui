import { TOKEN_LOADED, INIT_API_REQUEST_SUCCESSFUL, LOAD_API_TOKEN} from '../actions/apiActions'
import { USER_UNLOADED } from '../actions/authActions'

export const initialState = {
  apiToken: null,
  apiInitialized: false,
  loadingToken: false
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {

    case LOAD_API_TOKEN: {
      // Don't set loadingToken during silent renew (causes refresh)
      if (state.apiToken) {
        return state
      }
      return {
        ...state,
        loadingToken:true
      }
    }

    case TOKEN_LOADED: {
      return {
        ...state,
        apiToken: action.payload,
        loadingToken:false
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
