import { TOKEN_LOADED, INIT_API_REQUEST_SUCCESSFUL } from '../actions/apiActions'

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
