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
  FORM_ERROR_LIST,
  RESET_FORM_ERRORS,
  SET_ATTRIBUTE_DATA,
  FETCH_DISABLED_DATES_START,
  FETCH_DISABLED_DATES_SUCCESS,
  FETCH_DISABLED_DATES_FAILURE,
  SET_DATE_VALIDATION_RESULT,
  REMOVE_DEADLINES,
  VALIDATE_DATE,
  UPDATE_DATE_TIMELINE,
  RESET_ATTRIBUTE_DATA
} from '../actions/projectActions'

import timeUtil from '../utils/timeUtil'
import objectUtil from '../utils/objectUtil'

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
  connection:{"connection":false},
  showEditFloorAreaForm:false,
  showEditProjectTimetableForm:false,
  lastModified:false,
  updatedFloorValue:{},
  formErrorList:[],
  updateField:false,
  loading: false,
  disabledDates: {},
  error: null,
  dateValidationResult: {valid: false, result: {}},
  validated:false
}

export const reducer = (state = initialState, action) => {

  switch (action.type) {

    case UPDATE_DATE_TIMELINE: {
      const { field, newDate, deadlineSectionValues, formValues, isAdd, deadlineSections } = action.payload;

      // Create a copy of the state and attribute_data
      let updatedAttributeData
      if(formValues){
        updatedAttributeData = formValues
      }
      else{
        updatedAttributeData = { 
          ...state.currentProject.attribute_data, // Shallow copy of attribute_data
        };
      }
      //Sort array by date
      const origSortedData = timeUtil.sortObjectByDate(updatedAttributeData);
      const newDateObj = new Date(newDate);
      const current = new Date(updatedAttributeData[field]);

      // Update the specific date at the given field
      updatedAttributeData[field] = timeUtil.formatDate(newDateObj);
      //Iterate through deadlineSectionValues and match with keys in attribute_data
      // deadlineSectionValues is not used when adding new groups to timeline
      if(deadlineSectionValues){
        // Calculate the difference in days between the new date and the current date
        const daysDifference = (newDateObj - current) / (1000 * 60 * 60 * 24);
        let initialDistance
        deadlineSectionValues.forEach(section => {
          const matchingKey = section.name;  // Get the name to match the key in attribute_data
          if (matchingKey !== field) {  // Avoid updating the already changed field
            let dateType = "esilläolopäivät"
            let type = "esilläolopäivät"
            //Date types determinate what dates can or cannot be selected
            if(matchingKey.includes("_lautakunnassa")){
              dateType = "lautakunnan_kokouspäivät"
              type = "lautakunta"
              initialDistance = section?.initial_distance?.distance
            }
            else if(matchingKey.includes("_maaraaika")){
              if(section.name.includes("kylk_aineiston_maaraaika") || section.name.includes("kylk_maaraaika") || section.name.includes("lautakunta_aineiston_maaraaika")){
                type = "lautakunta_määräaika"
                initialDistance = 22
              }
              else{
                type = "esilläolopäivät"
              }
              dateType = "työpäivät"
            }
            else if(matchingKey.includes("_nahtavilla") || matchingKey.includes("_lausunnot")){
              dateType = "arkipäivät"
              type = "arkipäivät"
            }
            //Check matching key and field and determine is matching key allowed to be moved when field is moved
            if (daysDifference > 0 && !(matchingKey.includes("_paattyy") && field.includes("projektin_kaynnistys_pvm")) && !(matchingKey.includes("_alkaa") && field.includes("_paattyy")) && !(matchingKey.includes("kaynnistys_pvm") && field.includes("_paattyy"))  && !(field.includes("_alkaa") && matchingKey.includes("_paattyy")) && !(field.includes("_paattyy") && matchingKey.includes("_maaraaika"))) {
              // Move matchingKey days forward
              updatedAttributeData[matchingKey] = timeUtil.addDays(type,updatedAttributeData[matchingKey], daysDifference, state.disabledDates.date_types[dateType].dates,true,updatedAttributeData[field],state.disabledDates,initialDistance);
            } 
            else if (daysDifference < 0 && !(matchingKey.includes("_paattyy") && field.includes("projektin_kaynnistys_pvm")) && !(field.includes("_alkaa") && matchingKey.includes("_paattyy")) && !(field.includes("_paattyy") && matchingKey.includes("_alkaa")) && !(field.includes("_paattyy") && matchingKey.includes("_maaraaika"))) {
              // Move matchingKey days backward
              updatedAttributeData[matchingKey] = timeUtil.subtractDays(type,updatedAttributeData[matchingKey], -daysDifference, state.disabledDates.date_types[dateType].dates,true,updatedAttributeData[field],state.disabledDates,initialDistance);
            }
          }
        });
      }
      // Generate array from updatedAttributeData for comparison
      const updateAttributeArray = objectUtil.generateDateStringArray(updatedAttributeData)
      //Compare for changes with dates in order sorted array
      const changes = objectUtil.compareAndUpdateArrays(origSortedData,updateAttributeArray,deadlineSections)
      //Find out is next date below minium and add difference of those days to all values after and move them forward 
      const decreasingValues = objectUtil.checkForDecreasingValues(changes,isAdd,field);
      //Add new values from array to updatedAttributeData object
      objectUtil.updateOriginalObject(updatedAttributeData,decreasingValues)
      // Return the updated state with the modified currentProject and attribute_data
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          attribute_data: updatedAttributeData,
        },
      };
    }    

    case REMOVE_DEADLINES:{
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          deadlines: state.currentProject.deadlines.filter(deadline => !action.payload.includes(deadline.deadline.attribute)),
        },
      };
    }

    case VALIDATE_DATE: {
      return { 
        ...state,
        validated: true
      };
    }
      
    case SET_DATE_VALIDATION_RESULT: {
      return { 
        ...state, 
        dateValidationResult: {
          ...state.dateValidationResult,
          valid: action.payload.valid, 
          result: action.payload.result 
        },
        validated: false
      };
    }

    case FETCH_DISABLED_DATES_START: {
      return { ...state, loading: true, error: null };
    }

    case FETCH_DISABLED_DATES_SUCCESS: {
      return { ...state, loading: false, disabledDates: action.payload};
    }

    case FETCH_DISABLED_DATES_FAILURE:{
      return { ...state, loading: false, error: action.payload };
    }

    case SET_ATTRIBUTE_DATA: {
      const { fieldName, data } = action.payload
      let updatedAttributeData

      if(data[fieldName]){
        updatedAttributeData = { ...state.currentProject.attribute_data,...data }
      }
      else{
        updatedAttributeData = state.currentProject.attribute_data
      }

      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          attribute_data: { ...updatedAttributeData }
        },
        updateField:action.payload
      }
    }

    case RESET_ATTRIBUTE_DATA: {
      const { initialData } = action.payload
      let updatedAttributeData
      updatedAttributeData = { ...state.currentProject.attribute_data,...initialData }
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          attribute_data: { ...updatedAttributeData }
        }
      }
    }

    case RESET_FORM_ERRORS: {
      return{
        ...state,
        formErrorList:[],
      }
    }

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
      // Clone the payload to avoid direct mutation
      const updatedPayload = { ...action.payload };

      // Check conditions and update attribute_data if necessary
      // Add the key with a value of true because first one should be always visible at start 
      // on periaate and luonnos phase if they have been created and value is not set to false later
      // if not true data is not visible for modification on edit timetable side panel
      if (updatedPayload?.attribute_data?.periaatteet_luotu === true){
        if(updatedPayload?.attribute_data["jarjestetaan_periaatteet_esillaolo_1"] === undefined) {
          updatedPayload.attribute_data["jarjestetaan_periaatteet_esillaolo_1"] = true;
        }
        if(updatedPayload.attribute_data["periaatteet_lautakuntaan_1"] === undefined) {
          updatedPayload.attribute_data["periaatteet_lautakuntaan_1"] = true;
        }
        if(updatedPayload.attribute_data["vahvista_periaatteet_lautakunnassa"]) {
          updatedPayload.attribute_data["periaatteet_lautakuntaan_2"] = true;
        }
      }

      if (updatedPayload?.attribute_data?.luonnos_luotu === true){
        if(updatedPayload?.attribute_data["jarjestetaan_luonnos_esillaolo_1"] === undefined) {
          updatedPayload.attribute_data["jarjestetaan_luonnos_esillaolo_1"] = true;
        }
        if(updatedPayload?.attribute_data["kaavaluonnos_lautakuntaan_1"] === undefined) {
          updatedPayload.attribute_data["kaavaluonnos_lautakuntaan_1"] = true;
        }
        if(updatedPayload?.attribute_data["vahvista_luonnos_esillaolo_alkaa"]) {
          updatedPayload.attribute_data["jarjestetaan_luonnos_esillaolo_2"] = true;
        }
      } 

      if (updatedPayload?.attribute_data?.kaavaprosessin_kokoluokka === "XL" || updatedPayload?.attribute_data?.kaavaprosessin_kokoluokka === "L"){
        if(updatedPayload?.attribute_data["kaavaehdotus_lautakuntaan_1"] === undefined) {
          updatedPayload.attribute_data["kaavaehdotus_lautakuntaan_1"] = true;
        }
        if(updatedPayload?.attribute_data["ehdotus_lautakuntaan_1"] === undefined) {
          updatedPayload.attribute_data["ehdotus_lautakuntaan_1"] = true;
        }
        if(updatedPayload?.attribute_data["vahvista_kaavaehdotus_lautakunnassa"]) {
          updatedPayload.attribute_data["ehdotus_lautakuntaan_2"] = true;
        }
      } 

      return {
        ...state,
        currentProject: updatedPayload,
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
