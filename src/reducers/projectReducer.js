import {
  FETCH_PROJECTS_SUCCESSFUL,
  FETCH_OWN_PROJECTS_SUCCESSFUL,
  FETCH_PROJECTS,
  FETCH_PROJECT_SUCCESSFUL,
  SET_PROJECTS,
  SET_OWN_PROJECTS,
  SET_AMOUNT_OF_PROJECTS_TO_SHOW,
  INCREASE_AMOUNT_OF_PROJECTS_TO_SHOW,
  SET_AMOUNT_OF_PROJECTS_TO_INCREASE,
  SET_TOTAL_PROJECTS,
  SET_TOTAL_OWN_PROJECTS,
  UPDATE_PROJECT,
  CREATE_PROJECT_SUCCESSFUL,
  CREATE_OWN_PROJECT_SUCCESSFUL,
  INITIALIZE_PROJECT,
  INITIALIZE_PROJECT_SUCCESSFUL,
  SAVE_PROJECT,
  SAVE_PROJECT_BASE,
  SAVE_PROJECT_SUCCESSFUL,
  SAVE_PROJECT_BASE_SUCCESSFUL,
  VALIDATE_PROJECT_FIELDS,
  VALIDATE_PROJECT_FIELDS_SUCCESSFUL,
  CHANGE_PROJECT_PHASE,
  CHANGE_PROJECT_PHASE_SUCCESSFUL,
  CHANGE_PROJECT_PHASE_FAILURE,
  PROJECT_FILE_UPLOAD_SUCCESSFUL,
  PROJECT_FILE_REMOVE_SUCCESSFUL,
  PROJECT_SET_CHECKING,
  PROJECT_SET_DEADLINES_SUCCESSFUL,
  FETCH_PROJECT_DEADLINES_SUCCESSFUL,
  GET_PROJECT_SUCCESSFUL,
  GET_PROJECT_SNAPSHOT_SUCCESSFUL,
  RESET_PROJECT_SNAPSHOT,
  SET_SELECTED_PHASE_ID,
  GET_PROJECTS_OVERVIEW_FLOOR_AREA_SUCCESSFUL,
  GET_PROJECTS_OVERVIEW_BY_SUBTYPE_SUCCESSFUL,
  GET_PROJECTS_OVERVIEW_FILTERS_SUCCESSFUL,
  GET_EXTERNAL_DOCUMENTS_SUCCESSFUL,
  CLEAR_PROJECTS_OVERVIEW_FLOOR_AREA,
  GET_PROJECTS_OVERVIEW_MAP_DATA_SUCCESSFUL,
  CLEAR_PROJECTS_OVERVIEW_MAP_DATA,
  CLEAR_PROJECTS_OVERVIEW_PROJECT_TYPE_DATA,
  SET_OVERVIEW_MAP_FILTERS,
  SET_OVERVIEW_FLOOR_AREA_FILTERS,
  SET_OVERVIEW_PROJECT_TYPE_FILTERS,
  GET_PROJECTS_OVERVIEW_FLOOR_AREA_TARGETS_SUCCESSFUL,
  GET_PROJECT_MAP_LEGENDS_SUCCESSFUL,
  CLEAR_PROJECTS_OVERVIEW,
  CLEAR_PROJECTS,
  CLEAR_EXTERNAL_DOCUMENTS
} from '../actions/projectActions'

export const initialState = {
  projects: [],
  totalProjects: null,
  amountOfProjectsToIncrease: 10,
  amountOfProjectsToShow: 10,
  totalOwnProjects: null,
  ownProjects: [],
  loadingProjects: false,
  users: [],
  currentProject: null,
  currentProjectLoaded: false,
  saving: false,
  changingPhase: false,
  validating: false,
  hasErrors: false,
  checking: false,
  pollingProjects: false,
  timelineProject: [],
  selectedPhase: 0,
  currentProjectExternalDocuments: null,
  overview: {
    floorArea: {},
    bySubtype: {},
    filters: [],
    mapData: {},
    floorAreaTargets: {},
    legends: []
  }
}

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PROJECTS: {
      return {
        ...state,
        currentProject: null,
        currentProjectLoaded: false,
        loadingProjects: true,
        projects: [],
        ownProjects: [],
        amountOfProjectsToIncrease: 10,
        amountOfProjectsToShow: 10
      }
    }

    case FETCH_OWN_PROJECTS_SUCCESSFUL: {
      return {
        ...state,
        ownProjects: state.ownProjects.concat(action.payload)
      }
    }

    case GET_PROJECT_SUCCESSFUL: {
      return {
        ...state,
        timelineProject: state.timelineProject.concat(action.payload)
      }
    }

    case FETCH_PROJECTS_SUCCESSFUL: {
      return {
        ...state,
        projects: state.projects.concat(action.payload),
        loadingProjects: false
      }
    }
    case CLEAR_PROJECTS: {
      return {
        ...state,
        ownProjects: [],
        projects: [],
        totalOwnProjects: null,
        totalProjects: null

      }
    }
    case CLEAR_EXTERNAL_DOCUMENTS: {
      return {
        ...state,
        currentProjectExternalDocuments: null

      }
    }

    case SET_PROJECTS: {
      return {
        ...state,
        projects: action.payload
      }
    }

    case SET_OWN_PROJECTS: {
      return {
        ...state,
        ownProjects: action.payload
      }
    }

    case SET_AMOUNT_OF_PROJECTS_TO_INCREASE: {
      return {
        ...state,
        amountOfProjectsToIncrease: action.payload
      }
    }

    case INCREASE_AMOUNT_OF_PROJECTS_TO_SHOW: {
      return {
        ...state,
        pollingProjects: true
      }
    }

    case SET_AMOUNT_OF_PROJECTS_TO_SHOW: {
      return {
        ...state,
        amountOfProjectsToShow: action.payload,
        pollingProjects: false
      }
    }

    case SET_TOTAL_PROJECTS: {
      return {
        ...state,
        totalProjects: action.payload
      }
    }

    case SET_TOTAL_OWN_PROJECTS: {
      return {
        ...state,
        totalOwnProjects: action.payload
      }
    }

    case CREATE_PROJECT_SUCCESSFUL: {
      return {
        ...state,
        projects: state.projects.concat(action.payload)
      }
    }

    case CREATE_OWN_PROJECT_SUCCESSFUL: {
      return {
        ...state,
        ownProjects: state.ownProjects.concat(action.payload)
      }
    }

    case INITIALIZE_PROJECT: {
      return {
        ...state,
        currentProject: null,
        currentProjectLoaded: false
      }
    }

    case INITIALIZE_PROJECT_SUCCESSFUL: {
      return {
        ...state,
        currentProjectLoaded: true,
        checking: false
      }
    }

    case UPDATE_PROJECT:
    case FETCH_PROJECT_SUCCESSFUL: {
      return {
        ...state,
        currentProject: action.payload,
        saving: false
      }
    }
    case FETCH_PROJECT_DEADLINES_SUCCESSFUL: {
      return {
        ...state,
        projectDeadlines: action.payload,
        saving: false
      }
    }

    case SAVE_PROJECT:
    case SAVE_PROJECT_BASE: {
      return {
        ...state,
        saving: true
      }
    }

    case SAVE_PROJECT_SUCCESSFUL:
    case SAVE_PROJECT_BASE_SUCCESSFUL: {
      return {
        ...state,
        saving: false
      }
    }

    case VALIDATE_PROJECT_FIELDS: {
      return {
        ...state,
        validating: true
      }
    }

    case VALIDATE_PROJECT_FIELDS_SUCCESSFUL: {
      return {
        ...state,
        validating: false,
        hasErrors: action.payload
      }
    }

    case CHANGE_PROJECT_PHASE: {
      return {
        ...state,
        changingPhase: true
      }
    }

    case SET_SELECTED_PHASE_ID: {
      return {
        ...state,
        selectedPhase: action.payload
      }
    }

    case CHANGE_PROJECT_PHASE_SUCCESSFUL: {
      return {
        ...state,
        currentProject: action.payload,
        changingPhase: false
      }
    }

    case CHANGE_PROJECT_PHASE_FAILURE: {
      return {
        ...state,
        changingPhase: false
      }
    }

    case PROJECT_FILE_UPLOAD_SUCCESSFUL: {
      const updatedAttributeData = { ...state.currentProject.attribute_data }
      const { file, description } = action.payload
      updatedAttributeData[action.payload.attribute] = { link: file, description }
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          attribute_data: { ...updatedAttributeData }
        }
      }
    }

    case PROJECT_FILE_REMOVE_SUCCESSFUL: {
      const updatedAttributeData = { ...state.currentProject.attribute_data }
      delete updatedAttributeData[action.payload]
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          attribute_data: { ...updatedAttributeData }
        }
      }
    }

    case PROJECT_SET_CHECKING: {
      return {
        ...state,
        checking: action.payload
      }
    }

    case PROJECT_SET_DEADLINES_SUCCESSFUL: {
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          deadlines: [...action.payload]
        }
      }
    }
    case GET_PROJECT_SNAPSHOT_SUCCESSFUL: {
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          projectSnapshot: action.payload
        }
      }
    }
    case RESET_PROJECT_SNAPSHOT: {
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          projectSnapshot: null
        }
      }
    }
    case GET_PROJECTS_OVERVIEW_FLOOR_AREA_SUCCESSFUL: {
      return {
        ...state,
        overview: {
          ...state.overview,
          floorArea: action.payload
        }
      }
    }
    case GET_PROJECTS_OVERVIEW_BY_SUBTYPE_SUCCESSFUL: {
      return {
        ...state,
        overview: {
          ...state.overview,
          bySubtype: action.payload
        }
      }
    }
    case GET_PROJECTS_OVERVIEW_FILTERS_SUCCESSFUL: {
      return {
        ...state,
        overview: {
          ...state.overview,
          filters: action.payload
        }
      }
    }
    case GET_EXTERNAL_DOCUMENTS_SUCCESSFUL: {
      return {
        ...state,
        currentProjectExternalDocuments: action.payload
      }
    }
    case GET_PROJECTS_OVERVIEW_MAP_DATA_SUCCESSFUL: {
      return {
        ...state,
        overview: {
          ...state.overview,
          mapData: action.payload
        }
      }
    }
    case GET_PROJECTS_OVERVIEW_FLOOR_AREA_TARGETS_SUCCESSFUL: {
      return {
        ...state,
        overview: {
          ...state.overview,
          floorAreaTargets: action.payload
        }
      }
    }
    case CLEAR_PROJECTS_OVERVIEW_MAP_DATA: {
      return {
        ...state,
        overview: {
          ...state.overview,
          mapData: {}
        }
      }
    }
    case CLEAR_PROJECTS_OVERVIEW_FLOOR_AREA: {
      return {
        ...state,
        overview: {
          ...state.overview,
          floorArea: {},
          mapData: {}
        }
      }
    }
    case CLEAR_PROJECTS_OVERVIEW_PROJECT_TYPE_DATA: {
      return {
        ...state,
        overview: {
          ...state.overview,
          bySubtype: {}
        }
      }
    }
    case CLEAR_PROJECTS_OVERVIEW: {
      return {
        ...state,
        overview: {
          ...state.overview,
          floorArea: {},
          bySubtype: {},
          mapData: {},
          floorAreaTargets: {}
        }
      }
    }

    case SET_OVERVIEW_MAP_FILTERS: {
      return {
        ...state,
        overview: {
          ...state.overview,
          mapFilters: action.payload
        }
      }
    }
    case SET_OVERVIEW_FLOOR_AREA_FILTERS: {
      return {
        ...state,
        overview: {
          ...state.overview,
          floorAreaFilters: action.payload
        }
      }
    }
    case SET_OVERVIEW_PROJECT_TYPE_FILTERS: {
      return {
        ...state,
        overview: {
          ...state.overview,
          projectTypeFilters: action.payload
        }
      }
    }
    case GET_PROJECT_MAP_LEGENDS_SUCCESSFUL: {
      return {
        ...state,
        overview: {
          ...state.overview,
          legends: action.payload
        }
      }
    }

    default: {
      return state
    }
  }
}
