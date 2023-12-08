import {
  LAST_MODIFIED,
  SET_POLL,
  SET_LAST_SAVED,
  SET_UNLOCK_STATUS,
  SET_LOCK_STATUS,
  LOCK_PROJECT_FIELD,
  UNLOCK_PROJECT_FIELD,
  UNLOCK_ALL_FIELDS,
  FETCH_PROJECTS_SUCCESSFUL,
  FETCH_OWN_PROJECTS_SUCCESSFUL,
  FETCH_PROJECTS,
  FETCH_OWN_PROJECTS,
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
  PROJECT_FILE_UPLOAD,
  PROJECT_FILE_REMOVE,
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
  SAVE_PROJECT_FLOOR_AREA_SUCCESSFUL,
  SAVE_PROJECT_TIMETABLE_SUCCESSFUL,
  RESET_FLOOR_AREA_SAVE,
  RESET_TIMETABLE_SAVE,
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
  CLEAR_EXTERNAL_DOCUMENTS,
  SAVE_PROJECT_BASE_PAYLOAD,
  FETCH_ARCHIVED_PROJECTS,
  FETCH_ARCHIVED_PROJECTS_SUCCESSFUL,
  FETCH_ONHOLD_PROJECTS,
  FETCH_ONHOLD_PROJECTS_SUCCESSFUL,
  SET_TOTAL_ARCHIVED_PROJECTS,
  SET_TOTAL_ONHOLD_PROJECTS,
  SET_ONHOLD_PROJECTS,
  SET_ARCHIVED_PROJECTS,
  RESET_PROJECT_DEADLINES,
  RESET_PROJECT_DEADLINES_SUCCESSFUL,
  SHOW_TIMETABLE,
  SHOW_FLOOR_AREA,
  UPDATE_FLOOR_VALUES,
  FORM_ERROR_LIST
} from '../actions/projectActions'

export const initialState = {
  projects: [],
  totalProjects: null,
  amountOfProjectsToIncrease: 10,
  amountOfProjectsToShow: 10,
  totalOwnProjects: null,
  totalOnholdProjects: null,
  totalArchivedProjects: null,
  ownProjects: [],
  onholdProjects: [],
  archivedProjects: [],
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
  resettingDeadlines: false,
  overview: {
    floorArea: {},
    bySubtype: {},
    filters: [],
    mapData: {},
    floorAreaTargets: {},
    legends: []
  },
  locked:{},
  ownProjectFilters:[],
  floorAreaSaved:false,
  timetableSaved:false,
  lastSaved:{},
  connection:false,
  showEditFloorAreaForm:false,
  showEditProjectTimetableForm:false,
  lastModified:false,
  updatedFloorValue:{},
  formErrorList:[]
}

export const reducer = (state = initialState, action) => {

  switch (action.type) {

    case FORM_ERROR_LIST: {
      let visibleErrors = state.formErrorList
      if(action.payload.addOrRemove && action.payload.name && !visibleErrors.includes(action.payload.name)){
        visibleErrors.push(action.payload.name)
      }
      else if(!action.payload.addOrRemove && action.payload.name){
        visibleErrors = visibleErrors.filter(n => n !== action.payload.name);
      }
      return{
        ...state,
        formErrorList:visibleErrors,
      }
    }
    case UPDATE_FLOOR_VALUES: {
      return{
        ...state,
        updatedFloorValue:action.payload,
      }
    }

    case LAST_MODIFIED: {
      return{
        ...state,
        lastModified:action.payload,
      }
    }

    case SHOW_TIMETABLE: {
      return{
        ...state,
        showEditProjectTimetableForm: action.payload
      }
    }
    
    case SHOW_FLOOR_AREA: {
      return{
        ...state,
        showEditFloorAreaForm:action.payload
      }
    }

    case SET_POLL: {
      return{
        ...state,
        connection:action.payload,
      }
    }

    case SET_LAST_SAVED: {
      return{
        ...state,
        lastSaved:action.payload,
        saving: false
      }
    }

    case SET_UNLOCK_STATUS: {
      return{
        ...state,
        locked:action.payload
      }
    }

    case SET_LOCK_STATUS: {
      return{
        ...state,
        locked:action.payload
      }
    }

    case UNLOCK_PROJECT_FIELD: {
      return{
        ...state
      }
    }

    case UNLOCK_ALL_FIELDS: {
      return{
        ...state,
        locked:{}
      }
    }

    case LOCK_PROJECT_FIELD: {
      return{
        ...state
      }
    }

    case FETCH_PROJECTS: {
      return {
        ...state,
        currentProject: null,
        currentProjectLoaded: false,
        loadingProjects: true,
        projects: [],
        ownProjects: [],
        amountOfProjectsToIncrease: 10,
        amountOfProjectsToShow: 10,
        totalOnholdProjects: null,
        totalArchivedProjects: null,
        onholdProjects: [],
        archivedProjects: []
      }
    }

    case FETCH_OWN_PROJECTS: {
      return {
        ...state,
        currentProject: null,
        currentProjectLoaded: false,
        loadingProjects: true,
        projects: [],
        ownProjects: [],
        amountOfProjectsToIncrease: 10,
        amountOfProjectsToShow: 10,
        totalOnholdProjects: null,
        totalArchivedProjects: null,
        onholdProjects: [],
        archivedProjects: []
      }
    }

    case FETCH_ONHOLD_PROJECTS: {
      return {
        ...state,
        currentProject: null,
        currentProjectLoaded: false,
        loadingProjects: true,
        projects: [],
        ownProjects: [],
        amountOfProjectsToIncrease: 10,
        amountOfProjectsToShow: 10,
        totalOnholdProjects: null,
        totalArchivedProjects: null,
        onholdProjects: [],
        archivedProjects: []
      }
    }

    case FETCH_ARCHIVED_PROJECTS: {
      return {
        ...state,
        currentProject: null,
        currentProjectLoaded: false,
        loadingProjects: true,
        projects: [],
        ownProjects: [],
        amountOfProjectsToIncrease: 10,
        amountOfProjectsToShow: 10,
        totalOnholdProjects: null,
        totalArchivedProjects: null,
        onholdProjects: [],
        archivedProjects: []
      }
    }

    case FETCH_OWN_PROJECTS_SUCCESSFUL: {
      return {
        ...state,
        ownProjects: state.ownProjects.concat(action.payload),
        loadingProjects: false
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

    case FETCH_ONHOLD_PROJECTS_SUCCESSFUL: {
      return {
        ...state,
        onholdProjects: state.onholdProjects.concat(action.payload),
        loadingProjects: false
      }
    }

    case FETCH_ARCHIVED_PROJECTS_SUCCESSFUL: {
      return {
        ...state,
        archivedProjects: state.archivedProjects.concat(action.payload),
        loadingProjects: false
      }
    }
    case CLEAR_PROJECTS: {
      return {
        ...state,
        ownProjects: [],
        projects: [],
        archivedProjects: [],
        onholdProjects: [],
        totalOwnProjects: null,
        totalProjects: null,
        totalOnholdProjects: null,
        totalArchivedProjects: null
      }
    }
    case CLEAR_EXTERNAL_DOCUMENTS: {
      return {
        ...state,
        currentProjectExternalDocuments: null
      }
    }
    case RESET_PROJECT_DEADLINES: {
      return {
        ...state,
        resettingDeadlines: true
      }
    }
    case RESET_PROJECT_DEADLINES_SUCCESSFUL: {
      return {
        ...state,
        resettingDeadlines: false
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
    case SET_ONHOLD_PROJECTS: {
      return {
        ...state,
        onholdProjects: action.payload
      }
    }
    case SET_ARCHIVED_PROJECTS: {
      return {
        ...state,
       archivedProjects: action.payload
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
    case SET_TOTAL_ARCHIVED_PROJECTS: {
      return {
        ...state,
        totalArchivedProjects: action.payload
      }
    }
    case SET_TOTAL_ONHOLD_PROJECTS: {
      return {
        ...state,
        totalOnholdProjects: action.payload
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
    case SAVE_PROJECT_BASE:
    case SAVE_PROJECT_BASE_PAYLOAD:
    case PROJECT_FILE_UPLOAD:
    case PROJECT_FILE_REMOVE: {
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
        validating: true,
        hasErrors: false
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
        },
        saving: false
      }
    }

    case PROJECT_FILE_REMOVE_SUCCESSFUL: {
     
      const updatedAttributeData = Object.assign( {}, { ...state.currentProject.attribute_data })
      delete updatedAttributeData[action.payload]
        return {
        ...state,
        currentProject: {
          ...state.currentProject,
          attribute_data: updatedAttributeData
        },
        saving: false
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
    case SAVE_PROJECT_FLOOR_AREA_SUCCESSFUL: {
      return{
        ...state,
        floorAreaSaved: action.payload,
        showEditFloorAreaForm: false
      }
    }

    case RESET_FLOOR_AREA_SAVE: {
      return{
        ...state,
        floorAreaSaved:false
      }
    }

    case SAVE_PROJECT_TIMETABLE_SUCCESSFUL: {
      return{
        ...state,
        timetableSaved:action.payload,
        showEditProjectTimetableForm: false
      }
    }

    case RESET_TIMETABLE_SAVE: {
      return{
        ...state,
        timetableSaved:false
      }
    }

    default: {
      return state
    }
  }
}
