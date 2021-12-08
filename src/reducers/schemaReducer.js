import {
  FETCH_SCHEMAS_SUCCESSFUL,
  SET_ALL_EDIT_FIELDS_SUCCESSFUL,
  GET_PROJECT_CARD_FIELDS_SUCCESSFUL,
  GET_ATTRIBUTES_SUCCESSFUL,
  CLEAR_SCHEMAS
} from '../actions/schemaActions'

export const initialState = {
  schema: null,
  allEditFields: undefined,
  attributes: [],
  projectCardFields: []
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_SCHEMAS_SUCCESSFUL: {
      return {
        ...state,
        schema: action.payload
      }
    }

    case SET_ALL_EDIT_FIELDS_SUCCESSFUL: {
      return {
        ...state,
        allEditFields: action.payload
      }
    }
    case CLEAR_SCHEMAS: {
      return initialState
    }

    case GET_PROJECT_CARD_FIELDS_SUCCESSFUL: {
      return {
        ...state,
        projectCardFields: action.payload
      }
    }

    case GET_ATTRIBUTES_SUCCESSFUL: {
      return {
        ...state,
        attributes: action.payload
      }
    }
    default: {
      return state
    }
  }
}
