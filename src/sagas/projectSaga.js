import axios from 'axios'
import { takeLatest, put, all, call, select } from 'redux-saga/effects'
import { isEqual, isEmpty, isArray } from 'lodash'
import { push } from 'connected-react-router'
import {
  editFormSelector,
  deadlineModalSelector,
  newProjectFormSelector,
  editFloorAreaFormSelector,
  editProjectTimetableFormSelector
} from '../selectors/formSelector'
import {
  currentProjectSelector,
  currentProjectIdSelector,
  amountOfProjectsToShowSelector,
  totalOwnProjectsSelector,
  totalProjectsSelector,
  ownProjectsSelector,
  projectsSelector,
  amountOfProjectsToIncreaseSelector,
  onholdProjectsSelector,
  archivedProjectsSelector,
  savingSelector,
  formErrorListSelector
} from '../selectors/projectSelector'
import { userIdSelector } from '../selectors/authSelector'
import { phasesSelector } from '../selectors/phaseSelector'
import {
  LAST_MODIFIED,
  lastModified,
  POLL_CONNECTION,
  SET_POLL,
  setPoll,
  SET_LAST_SAVED,
  setLastSaved,
  SET_UNLOCK_STATUS,
  SET_LOCK_STATUS,
  setUnlockStatus,
  setLockStatus,
  LOCK_PROJECT_FIELD,
  UNLOCK_PROJECT_FIELD,
  UNLOCK_ALL_FIELDS,
  FETCH_PROJECTS,
  FETCH_OWN_PROJECTS,
  fetchProjectsSuccessful,
  fetchOwnProjectsSuccessful,
  fetchProjectSuccessful,
  updateProject,
  INCREASE_AMOUNT_OF_PROJECTS_TO_SHOW,
  setAmountOfProjectsToShow,
  SET_AMOUNT_OF_PROJECTS_TO_INCREASE,
  setTotalProjects,
  setTotalOwnProjects,
  SORT_PROJECTS,
  setProjects,
  setOwnProjects,
  CREATE_PROJECT,
  createProjectSuccessful,
  createOwnProjectSuccessful,
  INITIALIZE_PROJECT,
  initializeProjectSuccessful,
  SAVE_PROJECT_BASE,
  SAVE_PROJECT_FLOOR_AREA,
  SAVE_PROJECT_FLOOR_AREA_SUCCESSFUL,
  saveProjectFloorAreaSuccessful,
  SAVE_PROJECT_TIMETABLE,
  SAVE_PROJECT_TIMETABLE_SUCCESSFUL,
  saveProjectTimetableSuccessful,
  SAVE_PROJECT,
  saveProjectSuccessful,
  CHANGE_PROJECT_PHASE,
  changeProjectPhaseSuccessful,
  changeProjectPhaseFailure,
  PROJECT_FILE_UPLOAD,
  PROJECT_FILE_REMOVE,
  projectFileRemoveSuccessful,
  saveProject as saveProjectAction,
  PROJECT_SET_DEADLINES,
  projectSetDeadlinesSuccessful,
  initializeProject as initializeProjectAction,
  FETCH_PROJECT_DEADLINES,
  fetchProjectDeadlinesSuccessful,
  GET_PROJECT,
  getProjectSuccessful,
  RESET_PROJECT_DEADLINES,
  getProjectSnapshotSuccessful,
  GET_PROJECT_SNAPSHOT,
  getProjectsOverviewFloorAreaSuccessful,
  GET_PROJECTS_OVERVIEW_FLOOR_AREA,
  getProjectsOverviewBySubtypeSuccessful,
  GET_PROJECTS_OVERVIEW_BY_SUBTYPE,
  getProjectsOverviewFiltersSuccessful,
  GET_PROJECTS_OVERVIEW_FILTERS,
  getExternalDocumentsSuccessful,
  GET_EXTERNAL_DOCUMENTS,
  GET_PROJECTS_OVERVIEW_MAP_DATA,
  getProjectsOverviewMapDataSuccessful,
  getProjectsOverviewFloorAreaTargetsSuccessful,
  GET_PROJECTS_OVERVIEW_FLOOR_AREA_TARGETS,
  GET_PROJECT_MAP_LEGENDS,
  getMapLegendsSuccessful,
  SAVE_PROJECT_BASE_PAYLOAD,
  FETCH_ARCHIVED_PROJECTS,
  FETCH_ONHOLD_PROJECTS,
  fetchOnholdProjectsSuccessful,
  fetchArchivedProjectsSuccessful,
  setTotalOnholdProjects,
  setTotalArchivedProjects,
  setOnholdProjects,
  setArchivedProjects,
  resetProjectDeadlinesSuccessful,
  projectFileUploadSuccessful,
  GET_ATTRIBUTE_DATA,
  SET_ATTRIBUTE_DATA,
  setAttributeData,
  FETCH_DISABLED_DATES_START,
  fetchDisabledDatesSuccess,
  fetchDisabledDatesFailure,
  VALIDATE_DATE
} from '../actions/projectActions'
import { startSubmit, stopSubmit, setSubmitSucceeded } from 'redux-form'
import { error } from '../actions/apiActions'
import { setAllEditFields } from '../actions/schemaActions'
import projectUtils from '../utils/projectUtils'
import {
  projectApi,
  projectDeadlinesApi,
  overviewFloorAreaApi,
  overviewBySubtypeApi,
  overviewFiltersApi,
  externalDocumentsApi,
  overviewMapApi,
  overviewFloorAreaTargetApi,
  legendApi,
  attributesApiLock,
  attributesApiUnlock,
  attributesApiUnlockAll,
  pingApi,
  getAttributeDataApi,
  projectDateTypesApi,
  projectDateValidateApi
} from '../utils/api'
import { usersSelector } from '../selectors/userSelector'
import {
  NEW_PROJECT_FORM,
  EDIT_FLOOR_AREA_FORM,
  EDIT_PROJECT_FORM,
  EDIT_PROJECT_TIMETABLE_FORM
} from '../constants'
import i18 from 'i18next'
import { checkDeadlines } from '../components/ProjectTimeline/helpers/helpers'
import dayjs from 'dayjs'
import { toastr } from 'react-redux-toastr'

export default function* projectSaga() {
  yield all([
    takeLatest(LAST_MODIFIED, lastModified),
    takeLatest(POLL_CONNECTION,pollConnection),
    takeLatest(SET_POLL, setPoll),
    takeLatest(FETCH_PROJECTS, fetchProjects),
    takeLatest(FETCH_OWN_PROJECTS, fetchOwnProjects),
    takeLatest(FETCH_PROJECT_DEADLINES, fetchProjectDeadlines),
    takeLatest(INITIALIZE_PROJECT, initializeProject),
    takeLatest(CREATE_PROJECT, createProject),
    takeLatest(SAVE_PROJECT_BASE, saveProjectBase),
    takeLatest(SAVE_PROJECT_FLOOR_AREA, saveProjectFloorArea),
    takeLatest(SAVE_PROJECT_FLOOR_AREA_SUCCESSFUL, saveProjectFloorAreaSuccessful),
    takeLatest(SAVE_PROJECT_TIMETABLE, saveProjectTimetable),
    takeLatest(SAVE_PROJECT_TIMETABLE_SUCCESSFUL, saveProjectTimetableSuccessful),
    takeLatest(SAVE_PROJECT, saveProject),
    takeLatest(SET_LAST_SAVED, setLastSaved),
    takeLatest(SET_LOCK_STATUS, setLockStatus),
    takeLatest(SET_UNLOCK_STATUS, setUnlockStatus),
    takeLatest(LOCK_PROJECT_FIELD, lockProjectField),
    takeLatest(UNLOCK_PROJECT_FIELD, unlockProjectField),
    takeLatest(UNLOCK_ALL_FIELDS,unlockAllFields),
    takeLatest(CHANGE_PROJECT_PHASE, changeProjectPhase),
    takeLatest(PROJECT_FILE_UPLOAD, projectFileUpload),
    takeLatest(PROJECT_FILE_REMOVE, projectFileRemove),
    takeLatest(PROJECT_SET_DEADLINES, projectSetDeadlinesSaga),
    takeLatest(INCREASE_AMOUNT_OF_PROJECTS_TO_SHOW, increaseAmountOfProjectsToShowSaga),
    takeLatest(SORT_PROJECTS, sortProjectsSaga),
    takeLatest(SET_AMOUNT_OF_PROJECTS_TO_INCREASE, setAmountOfProjectsToIncreaseSaga),
    takeLatest(GET_PROJECT, getProject),
    takeLatest(RESET_PROJECT_DEADLINES, resetProjectDeadlines),
    takeLatest(GET_PROJECT_SNAPSHOT, getProjectSnapshot),
    takeLatest(GET_PROJECTS_OVERVIEW_FLOOR_AREA, getProjectsOverviewFloorArea),
    takeLatest(GET_PROJECTS_OVERVIEW_BY_SUBTYPE, getProjectsOverviewBySubtype),
    takeLatest(GET_PROJECTS_OVERVIEW_FILTERS, getProjectsOverviewFilters),
    takeLatest(GET_EXTERNAL_DOCUMENTS, getExternalDocumentsSaga),
    takeLatest(GET_PROJECTS_OVERVIEW_MAP_DATA, getProjectOverviewMapDataSaga),
    takeLatest(
      GET_PROJECTS_OVERVIEW_FLOOR_AREA_TARGETS,
      getProjectsOverviewFloorAreaTargets
    ),
    takeLatest(GET_PROJECT_MAP_LEGENDS, getProjectMapLegends),
    takeLatest(SAVE_PROJECT_BASE_PAYLOAD, saveProjectPayload),
    takeLatest(FETCH_ONHOLD_PROJECTS, fetchOnholdProjects),
    takeLatest(FETCH_ARCHIVED_PROJECTS, fetchArchivedProjects),
    takeLatest(GET_ATTRIBUTE_DATA, getAttributeData),
    takeLatest(SET_ATTRIBUTE_DATA, setAttributeData),
    takeLatest(FETCH_DISABLED_DATES_START, getProjectDisabledDeadlineDates),
    takeLatest(VALIDATE_DATE, validateDate)
  ])
}

function* validateDate({payload}) {
  try {
    console.log(payload)
    const query = {
      identifier: payload.field,
      project: payload.projectName,
      date: payload.date,
    };
    console.log(query)
    const result = yield call(projectDateValidateApi.get, { query });
    console.log(result)
    //yield put(fetchDisabledDatesSuccess(dates?.date_types?.disabled_dates?.dates));
  } catch (e) {
    console.log(e)
    //yield put(fetchDisabledDatesFailure(e));
  }
}

function* getProjectDisabledDeadlineDates() {
  try {
    const dates = yield call(projectDateTypesApi.get);
    yield put(fetchDisabledDatesSuccess(dates?.date_types?.disabled_dates?.dates));
  } catch (e) {
    yield put(fetchDisabledDatesFailure(e));
  }
}

function* getAttributeData(data) {
  const project_name = data.payload.projectName;
  const attribute_identifier = data.payload.fieldName;
  const {formName, set, nulledFields,i} = data.payload
  let query
  
  if(project_name && attribute_identifier){
    query = {
      project_name: project_name,
      attribute_identifier: attribute_identifier
    }
    try {
      const getAttributeData = yield call(
        getAttributeDataApi.get,
        {query},
      )
      yield put(setAttributeData(attribute_identifier,getAttributeData,formName, set, nulledFields,i))
    } catch (e) {
      yield put(error(e))
    }
  }
}

function* pollConnection() {
  try {
    yield call(
      pingApi.get
    )
    const dateVariable = new Date()
    const time = dateVariable.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    yield put(setPoll(true))
    yield put(setLastSaved("success",time,[],[],false))
  } catch (e) {
    yield put(setPoll(false))
  }
}

function* resetProjectDeadlines({ payload: projectId }) {
  try {
    const timelineProject = yield call(
      projectApi.patch,
      {},
      { path: { projectId }, query: { generate_schedule: true } },
      ':projectId/'
    )
    yield put(updateProject(timelineProject))
    yield put(initializeProjectAction(projectId))
    yield put(resetProjectDeadlinesSuccessful())
  } catch (e) {
    yield put(error(e))
  }
}

function* getProject({ payload: projectId }) {
  try {
    const timelineProject = yield call(
      projectApi.get,
      { path: { projectId } },
      ':projectId/'
    )
    yield put(getProjectSuccessful(timelineProject))
  } catch (e) {
    yield put(error(e))
  }
}

function getQueryValues(page_size,page,searchQuery,sortField,sortDir,status){
  let query

  query = {
    page: page + 1,
    ordering: sortDir === 1 ? sortField : '-'+sortField,
    status: status,
    page_size: page_size ? page_size : 10
  }

  if (searchQuery.length > 0) {
    if(searchQuery[0] !== ""){
      query.search = searchQuery[0]
    }
    if(searchQuery[1] !== ""){
      query.department = searchQuery[1]
    }
    if(searchQuery[2].length > 0){
      query.includes_users = searchQuery[2]
    }
  }
  return query
}

function* fetchOnholdProjects({ payload }) {
  try {
    const query = getQueryValues(payload.page_size,payload.page,payload.searchQuery,payload.sortField,payload.sortDir,"onhold")
    const onholdProjects = yield call(
      projectApi.get,
      {
        query
      },
      '',
      null,
      null,
      true
    )
    yield put(fetchOnholdProjectsSuccessful(onholdProjects.results))
    yield put(setTotalOnholdProjects(onholdProjects.count))
  } catch (e) {
    if (e.response && e.response.status !== 404) {
      yield put(error(e))
    }
  }
}
function* fetchArchivedProjects({ payload }) {
  try {
    const query = getQueryValues(payload.page_size,payload.page,payload.searchQuery,payload.sortField,payload.sortDir,"archived")
    const archivedProjects = yield call(
      projectApi.get,
      {
        query
      },
      '',
      null,
      null,
      true
    )
    yield put(fetchArchivedProjectsSuccessful(archivedProjects.results))
    yield put(setTotalArchivedProjects(archivedProjects.count))
  } catch (e) {
    if (e.response && e.response.status !== 404) {
      yield put(error(e))
    }
  }
}

function* fetchProjects({ payload }) {
  try {
    const query = getQueryValues(payload.page_size,payload.page,payload.searchQuery,payload.sortField,payload.sortDir,"active")

    const projects = yield call(
      projectApi.get,
      {
        query
      },
      '',
      null,
      null,
      true
    )

    yield put(fetchProjectsSuccessful(projects.results))
    yield put(setTotalProjects(projects.count))
    
  } catch (e) {
    if (e.response && e.response.status !== 404) {
      yield put(error(e))
    }
  }
}

function* fetchOwnProjects({ payload }) {
  try {
    const query = getQueryValues(payload.page_size,payload.page,payload.searchQuery,payload.sortField,payload.sortDir,"own")

    const projects = yield call(
      projectApi.get,
      {
        query
      },
      '',
      null,
      null,
      true
    )

    yield put(fetchOwnProjectsSuccessful(projects.results))
    yield put(setTotalOwnProjects(projects.count))
  } catch (e) {
    if (e.response && e.response.status !== 404) {
      yield put(error(e))
    }
  }
}

function* fetchProjectDeadlines({ payload: projectId }) {
  try {
    const deadlines = yield call(
      projectDeadlinesApi.get,
      { path: { projectId } },
      ':projectId/'
    )
    yield put(fetchProjectDeadlinesSuccessful(deadlines))
  } catch (e) {
    yield put(error(e))
  }
}

function* increaseAmountOfProjectsToShowSaga(action, howMany = null) {
  try {
    const PAGE_SIZE = 100 // Defined in backend
    const totalOwnProjects = yield select(totalOwnProjectsSelector)
    const totalProjects = yield select(totalProjectsSelector)
    const amountOfProjectsToShow = yield select(amountOfProjectsToShowSelector)
    const amountOfProjectsToIncrease = howMany
      ? howMany
      : yield select(amountOfProjectsToIncreaseSelector)
    const fetchOwn = amountOfProjectsToShow < totalOwnProjects
    const fetchAll = amountOfProjectsToShow < totalProjects

    if (fetchOwn || fetchAll) {
      if (
        Math.floor(amountOfProjectsToShow / (PAGE_SIZE + 1)) + 1 !==
        Math.floor(
          (amountOfProjectsToShow + amountOfProjectsToIncrease) / (PAGE_SIZE + 1)
        ) +
          1
      ) {
        yield call(
          fetchProjects,
          null,
          Math.floor(
            (amountOfProjectsToShow + amountOfProjectsToIncrease) / (PAGE_SIZE + 1)
          ) + 1,
          fetchOwn,
          fetchAll
        )
      }
      yield put(
        setAmountOfProjectsToShow(amountOfProjectsToShow + amountOfProjectsToIncrease)
      )
    } else {
      yield put(setAmountOfProjectsToShow(amountOfProjectsToShow))
    }
  } catch (e) {
    yield put(error(e))
  }
}

function* setAmountOfProjectsToIncreaseSaga({ payload }) {
  try {
    const amountOfProjectsToShow = yield select(amountOfProjectsToShowSelector)
    if (amountOfProjectsToShow < payload) {
      yield call(
        increaseAmountOfProjectsToShowSaga,
        null,
        payload - amountOfProjectsToShow
      )
    }
  } catch (e) {
    yield put(error(e))
  }
}

function* sortProjectsSaga({ payload: { sort, dir } }) {
  try {
    const ownProjects = yield select(ownProjectsSelector)
    const projects = yield select(projectsSelector)
    const onholdProjects = yield select(onholdProjectsSelector)
    const archivedProjects = yield select(archivedProjectsSelector)

    const phases = yield select(phasesSelector)
    const users = yield select(usersSelector)
    const amountOfProjectsToShow = yield select(totalProjectsSelector)
    const options = { sort, dir, phases, amountOfProjectsToShow, users }

    yield put(setOwnProjects(projectUtils.sortProjects(ownProjects, options)))
    yield put(setProjects(projectUtils.sortProjects(projects, options)))
    yield put(setOnholdProjects(projectUtils.sortProjects(onholdProjects, options)))
    yield put(setArchivedProjects(projectUtils.sortProjects(archivedProjects, options)))
  } catch (e) {
    yield put(error(e))
  }
}

function* initializeProject({ payload: projectId }) {
  try {
    const project = yield call(projectApi.get, { path: { projectId } }, ':projectId/')
    yield put(fetchProjectSuccessful(project))
    yield put(initializeProjectSuccessful())
  } catch (e) {
    yield put(error(e))
  }
}

function* getProjectSnapshot({ payload }) {
  try {
    let query = {}

    if (payload.phase) {
      query = { phase: payload.phase }
    } else if (payload.snapshot) {
      query = { snapshot: encodeURIComponent(payload.snapshot) }
    }
    const project = yield call(
      projectApi.get,
      { path: { projectId: payload.projectId }, query: query },
      ':projectId/'
    )

    yield put(getProjectSnapshotSuccessful(project))
  } catch (e) {
    yield put(error(e))
  }
}

function* createProject() {
  yield put(startSubmit(NEW_PROJECT_FORM))
  const { values } = yield select(newProjectFormSelector)
  const userId = yield select(userIdSelector)
  try {
    const createdProject = yield call(projectApi.post, values)
    if (createdProject.user === userId) {
      yield put(createOwnProjectSuccessful(createdProject))
    }
    yield put(createProjectSuccessful(createdProject))
    if (createdProject.public || createdProject.user === userId) {
      yield put(push(`/projects/${createdProject.id}/edit`))
    }
    yield put(setSubmitSucceeded(NEW_PROJECT_FORM))
  } catch (e) {
    if (e?.response?.status === 400) {
      yield put(stopSubmit(NEW_PROJECT_FORM, e.response.data))
    } else {
      yield put(error(e))
    }
  }
}

const getChangedAttributeData = (values, initial) => {
  let attribute_data = {}
  let errorValues = false
  const wSpaceRegex = /^(\s+|\s+)$/g
  Object.keys(values).forEach(key => {
    if(key.includes("_readonly")){
      return
    }
    if (initial[key] !== undefined && isEqual(values[key], initial[key])) {
      return
    }
     if(values[key] === '' || values[key]?.ops && values[key]?.ops[0] && values[key]?.ops[0]?.insert.replace(wSpaceRegex, '').length === 0){
      //empty text values saved as null
      attribute_data[key] = null
    }
    else if(values[key] === null) {
      attribute_data[key] = null
    }
    else if(values[key]?.length === 0) {
      attribute_data[key] = []
    }
    else {
      attribute_data[key] = values[key]
    }
  })
  return errorValues ? false : attribute_data
}
function* saveProjectPayload({ payload }) {
  const currentProjectId = yield select(currentProjectIdSelector)
  try {
    const updatedProject = yield call(
      projectApi.patch,
      payload,
      { path: { id: currentProjectId } },
      ':id/'
    )
    yield put(updateProject(updatedProject))
    yield put(initializeProjectAction(currentProjectId))
  } catch (e) {
    yield put(error(e))
  }
}

function* saveProjectBase({ payload }) {
  yield put(startSubmit(NEW_PROJECT_FORM))
  const { values } = yield select(newProjectFormSelector)
  const currentProjectId = yield select(currentProjectIdSelector)
  if (payload && payload.archived) {
    values.archived = payload.archived
  }

  if (values) {
    try {
      const updatedProject = yield call(
        projectApi.patch,
        values,
        { path: { id: currentProjectId } },
        ':id/'
      )
      yield put(updateProject(updatedProject))
      yield put(setSubmitSucceeded(NEW_PROJECT_FORM))
      yield put(initializeProjectAction(currentProjectId))
    } catch (e) {
      if (e.response.status === 400) {
        yield put(stopSubmit(NEW_PROJECT_FORM, e.response.data))
      } else {
        yield put(error(e))
      }
    }
  }
}

function* saveProjectFloorArea() {
  yield put(startSubmit(EDIT_FLOOR_AREA_FORM))
  const { initial, values } = yield select(editFloorAreaFormSelector)
  const currentProjectId = yield select(currentProjectIdSelector)
  if (values) {
    const attribute_data = getChangedAttributeData(values, initial)
    try {
      const updatedProject = yield call(
        projectApi.patch,
        { attribute_data },
        { path: { id: currentProjectId } },
        ':id/'
      )

      yield put(updateProject(updatedProject))
      yield put(setSubmitSucceeded(EDIT_FLOOR_AREA_FORM))
      yield put(saveProjectFloorAreaSuccessful(true))
      yield put(setAllEditFields())

      yield put(toastr.success(i18.t('messages.timelines-successfully-saved')))
    } catch (e) {
      if (e?.code === "ERR_NETWORK") {
        yield put(toastr.error(i18.t('messages.general-save-error')))
      }
      yield put(stopSubmit(EDIT_FLOOR_AREA_FORM, e.response && e.response.data))
    }
  }
}
function* saveProjectTimetable() {
  yield put(startSubmit(EDIT_PROJECT_TIMETABLE_FORM))

  const { initial, values, registeredFields } = yield select(
    editProjectTimetableFormSelector
  )
  const currentProject = yield select(currentProjectSelector)
  const currentProjectId = yield select(currentProjectIdSelector)

  if (values) {
    let attribute_data = getChangedAttributeData(values, initial)

    if(attribute_data.oikaisukehoituksen_alainen_readonly){
      delete attribute_data.oikaisukehoituksen_alainen_readonly
    }
    
    const deadlineAttributes = currentProject.deadline_attributes
    // Add missing fields as a null to payload since there are
    // fields which can be hidden according the user selection. 
    // If old values are left, it will break the timelines.
    deadlineAttributes.forEach(attribute => {
      if (registeredFields && !registeredFields[attribute]) {
        attribute_data = { ...attribute_data, [attribute]: null }
      }
    })

    try {
      const updatedProject = yield call(
        projectApi.patch,
        { attribute_data },
        { path: { id: currentProjectId } },
        ':id/'
      )
      yield put(updateProject(updatedProject))
      yield put(setSubmitSucceeded(EDIT_PROJECT_TIMETABLE_FORM))
      yield put(saveProjectTimetableSuccessful(true))
      yield put(setAllEditFields())

      if (!checkDeadlines(updatedProject.deadlines)) {
        yield put(toastr.success(i18.t('messages.deadlines-successfully-saved')))
      } else {
        yield put(
          toastr.warning(
            i18.t('messages.deadlines-successfully-saved'),
            i18.t('messages.check-timetable')
          )
        )
      }
    } catch (e) {
      if (e?.code === "ERR_NETWORK") {
        yield put(toastr.error(i18.t('messages.general-save-error')))
      }
      yield put(stopSubmit(EDIT_PROJECT_TIMETABLE_FORM, e.response && e.response.data))
    }
  }
}

function* unlockAllFields(data) {
  const project_name = data.payload.projectName;
  try {
    yield call(
     attributesApiUnlockAll.post,
     {project_name}
   )
 }
 catch (e) {
  yield put(error(e))
 }
}

function* unlockProjectField(data) {
  const project_name = data.payload.projectName;
  const attribute_identifier = data.payload.inputName;

  if(project_name && attribute_identifier){
    try {
       yield call(
        attributesApiUnlock.post,
        {project_name,
        attribute_identifier}
      )
      const lockData = {attribute_lock:{project_name:project_name,attribute_identifier:attribute_identifier}}
      yield put(setUnlockStatus(lockData,true))
    }
    catch (e) {
      yield put(error(e))
    }
  }
}

function* lockProjectField(data) {
  const attribute_identifier = data.payload.inputName;
  const project_name = data.payload.projectName;
  const saving = yield select(savingSelector)

  if(project_name && attribute_identifier){
    //Fielset has prefixes someprefix[x]. that needs to be cut out. Only actual field info is compared.
    try {
      //Return data when succesfully locked or is locked to someone else
      //lockData is compared to current userdata on frontend and editing allowed or prevented
      const lockData = yield call(
        attributesApiLock.post,
        {project_name,
        attribute_identifier}
      )
      //Send data to store
      yield put(setLockStatus(lockData,false,saving))
    }
    catch (e) {
      const dateVariable = new Date()
      const time = dateVariable.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      yield put(setLastSaved("error",time,[attribute_identifier],[""],true))
      yield put(error(e))
    }
  }
}

function* saveProject(data) {
  const {fileOrimgSave,insideFieldset,fieldsetData,fieldsetPath} = data.payload

  const currentProjectId = yield select(currentProjectIdSelector)
  const editForm = yield select(editFormSelector) || {}
  const visibleErrors = yield select(formErrorListSelector)

  const { initial, values } = editForm

  const dateVariable = new Date()
  const time = dateVariable.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  if (values) {
    let keys = {}
    let changedValues = {}
    if(visibleErrors.length === 0){
      changedValues = getChangedAttributeData(values, initial)
      keys = Object.keys(changedValues)
    }
    //Get latest modified field and send it to components to prevent new modification for that field until saved. 
    //Prevents only user that was editing and saving. Richtext and custominput.
    const latestModifiedKey = localStorage.getItem("changedValues")?.split(",") ? localStorage.getItem("changedValues")?.split(",") : []
    if(latestModifiedKey){
      yield put(lastModified(latestModifiedKey[0]))
    }

    if (!isEmpty(keys)) {
      if(fileOrimgSave && insideFieldset && fieldsetData && fieldsetPath){
        //Data added for front when image inside fieldset is saved without other data
        if(isEmpty(changedValues[fieldsetPath[0].parent][fieldsetPath[0].index])){
          changedValues[fieldsetPath[0].parent][fieldsetPath[0].index] = fieldsetData
        }
      }
      const attribute_data = changedValues
      try {
        const updatedProject = yield call(
          projectApi.patch,
          { attribute_data },
          { path: { id: currentProjectId } },
          ':id/'
        )
        yield put(updateProject(updatedProject))
        yield put(setAllEditFields())
        yield put(setPoll(false))
        //success will show if error toastr is last visible toastr
        yield put(setLastSaved("success",time,[],[],false))
      } catch (e) {
        if (e.response && e.response.status === 400) {
          yield put(setLastSaved("field_error",time,Object.keys(attribute_data),Object.values(attribute_data),false))
          yield put(stopSubmit(EDIT_PROJECT_FORM, e.response.data))
        } else {
          yield put(setLastSaved("error",time,Object.keys(attribute_data),Object.values(attribute_data),false))
        }
      }
    }
    else if(fileOrimgSave){
      yield put(setAllEditFields())
      yield put(setPoll(false))
    }
    else if(visibleErrors.length > 0){
      yield put(setLastSaved("field_error",time,visibleErrors,[],false))
    }
  }
  yield put(saveProjectSuccessful())
}

function* changeProjectPhase({ payload: phase }) {
  try {
    const saveReady = yield call(saveProjectAction)
    if(saveReady){
      const currentProjectId = yield select(currentProjectIdSelector)
      const updatedProject = yield call(
        projectApi.patch,
        { phase },
        { path: { id: currentProjectId } },
        ':id/'
      )
      yield put(changeProjectPhaseSuccessful(updatedProject))
    }
  } catch (e) {
    yield put(error(e))
    yield put(changeProjectPhaseFailure())
  }
}

function* projectFileUpload({
  payload: { attribute, file, description, callback, setCancelToken, insideFieldset }
}) {
  const dateVariable = new Date()
  const time = dateVariable.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  try {
    const currentProjectId = yield select(currentProjectIdSelector)

    let fieldSetIndex = []
    let currentFieldName = attribute

    const lastIndex = attribute.lastIndexOf('.')
    if (lastIndex !== -1) {
      const splitted = attribute.split('.')

      splitted.forEach(value => {
        const firstBracket = value.indexOf('[')
        const secondBracket = value.indexOf(']')

        const fieldSet = attribute.substring(0, firstBracket)
        const index = attribute.substring(firstBracket + 1, secondBracket)
        currentFieldName = attribute.substring(lastIndex + 1, attribute.length)

        if (fieldSet !== '' && index !== '') {
          const returnObject = {
            parent: fieldSet,
            index: index
          }
          fieldSetIndex.push(returnObject)
        }
      })
    }

    // Create formdata
    const formData = new FormData()
    formData.append('attribute', currentFieldName)
    formData.append('file', file)
    formData.append('description', description)

    if (fieldSetIndex && fieldSetIndex.length > 0) {
      formData.append('fieldset_path', JSON.stringify(fieldSetIndex))
    }

    // Set cancel token
    const CancelToken = axios.CancelToken
    const src = CancelToken.source()
    setCancelToken(src)
    // Upload file
    const res = yield call(
      projectApi.put,
      formData,
      { path: { id: currentProjectId } },
      ':id/files/',
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: callback,
        cancelToken: src.token
      }
    )

    let fieldsetData = false
    let fieldsetPath = false
    if (fieldSetIndex && fieldSetIndex.length > 0) {
      fieldsetData = {"_deleted": false,[res.attribute]:{"description":res.description,"link":res.file}}
      fieldsetPath = res.fieldset_path
    }
    yield put(projectFileUploadSuccessful(res))
    yield put(saveProjectAction(true,insideFieldset,fieldsetData,fieldsetPath))
    yield put(setLastSaved("success",time,[],[],false))
  } catch (e) {
    if (!axios.isCancel(e)) {
      yield put(error(e))
    }
    yield put(error(e))
    yield put(setLastSaved("error",time,[attribute],["Kuva/tiedosto"],false))
  }
}

function* projectFileRemove({ payload }) {
  try {
    const currentProjectId = yield select(currentProjectIdSelector)
    const attribute_data = {}
    attribute_data[payload] = null
    const dateVariable = new Date()
    const time = dateVariable.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    yield call(
      projectApi.patch,
      { attribute_data },
      { path: { id: currentProjectId } },
      ':id/'
    )
    yield put(projectFileRemoveSuccessful(payload))
    yield put(saveProjectAction(true,false,false,false))
    yield put(setLastSaved("success",time,[],[],false))
  } catch (e) {
    yield put(error(e))
  }
}

function* projectSetDeadlinesSaga() {
  try {
    yield put(startSubmit('deadlineModal'))
    const currentProject = yield select(currentProjectSelector)
    const { values } = yield select(deadlineModalSelector)
    const deadlines = [...currentProject.deadlines].map(deadline => ({
      ...deadline,
      start: values[`${deadline.phase_name}-start`],
      deadline: values[`${deadline.phase_name}-deadline`]
    }))
    const res = yield call(
      projectApi.patch,
      { deadlines },
      { path: { id: currentProject.id } },
      ':id/'
    )
    yield put(projectSetDeadlinesSuccessful(res.deadlines))
    yield put(setSubmitSucceeded('deadlineModal'))
  } catch (e) {
    if (e.response && e.response.status === 400) {
      yield put(stopSubmit('deadlineModal', e.response.data))
      yield put(error({ custom: true, message: 'Tarkista päivämäärät!' }))
    } else {
      yield put(error(e))
    }
  }
}
function* getProjectsOverviewFloorArea({ payload }) {
  let query = {}

  const keys = Object.keys(payload)
  keys.forEach(key => {
    if (key === 'vuosi') {
      const value = payload[key]
      let startDate
      let endDate
      if (!isArray(value)) {
        startDate = dayjs(new Date(value, 0, 1)).format('YYYY-MM-DD')
        endDate = dayjs(new Date(value, 11, 31)).format('YYYY-MM-DD')
      } else {
        startDate = dayjs(new Date(value[0].value, 0, 1)).format('YYYY-MM-DD')
        endDate = dayjs(new Date(value[value.length - 1].value, 11, 31)).format(
          'YYYY-MM-DD'
        )
      }
      query = {
        ...query,
        start_date: startDate,
        end_date: endDate
      }
    } else if (key === 'henkilo') {
      const currentPersonIds = []

      const currentPayload = payload[key]

      currentPayload.forEach(current => currentPersonIds.push(current.id))

      if (currentPersonIds) {
        query = {
          ...query,
          [key]: currentPersonIds.toString()
        }
      }
    }
    else if (key === 'kaavaprosessi') {
      const queryValue = []
      const current = payload[key]

      //Change attributedata kaavaprosessin nimi strings to int subtype_id for nicer comparison in backend
      const getSubtypeID = id => modifiedValuePairs[id]; 
      const modifiedValuePairs = {
        XS: 1, xs: 1, S: 2, s: 2, M: 3, m: 3,L: 4, l: 4, XL: 5, xl: 5 
      };

      if (isArray(current)) {
        for (let i = 0; i < current.length; i++) {
          queryValue.push(getSubtypeID(current[i]))
        }
      }
      if (queryValue.length > 0) {
        query = {
          ...query,
          ["subtype_id"]: queryValue.toString()
        }
      }
    }
    else if(key === "yksikko_tai_tiimi"){
      const queryValue = []

      const current = payload[key]
      if (isArray(current)) {
        for (let i = 0; i < current.length; i++) {
          queryValue.push(current[i])
        }
      }
      if (queryValue.length > 0) {
        query = {
          ...query,
          ["vastuuyksikko"]: queryValue.toString()
        }
      }
    }
    else {
      const queryValue = []

      const current = payload[key]

      if (isArray(current)) {
        current.forEach(value => queryValue.push(value))
      } else {
        queryValue.push(payload[key])
      }

      if (queryValue.length > 0) {
        query = {
          ...query,
          [key]: queryValue.toString()
        }
      }
    }
  })

  try {
    const floorArea = yield call(overviewFloorAreaApi.get, { query: query })
    yield put(getProjectsOverviewFloorAreaSuccessful(floorArea))
  } catch (e) {
    yield put(error(e))
  }
}
function* getProjectsOverviewBySubtype({ payload }) {
  let query = {}

  const keys = Object.keys(payload)

  keys.forEach(key => {
    if (key === 'vuosi') {
      const value = payload[key]

      let startDate
      let endDate
      if (!isArray(value)) {
        startDate = dayjs(new Date(value, 0, 1)).format('YYYY-MM-DD')
        endDate = dayjs(new Date(value, 11, 31)).format('YYYY-MM-DD')
      } else {
        startDate = dayjs(new Date(value[0].value, 0, 1)).format('YYYY-MM-DD')
        endDate = dayjs(new Date(value[value.length - 1].value, 11, 31)).format(
          'YYYY-MM-DD'
        )
      }

      query = {
        ...query,
        start_date: startDate,
        end_date: endDate
      }
    } else if (key === 'henkilo') {
      const currentPersonIds = []

      const currentPayload = payload[key]

      currentPayload.forEach(current => currentPersonIds.push(current.id))

      query = {
        ...query,
        [key]: currentPersonIds.toString()
      }
    } else {
      const queryValue = []

      const current = payload[key]

      if (isArray(current)) {
        current.forEach(value => queryValue.push(value))
      } else {
        queryValue.push(payload[key])
      }

      if (queryValue.length > 0) {
        query = {
          ...query,
          [key]: queryValue.toString()
        }
      }
    }
  })
  try {
    const bySubtype = yield call(overviewBySubtypeApi.get, { query: query })
    yield put(getProjectsOverviewBySubtypeSuccessful(bySubtype))
  } catch (e) {
    yield put(error(e))
  }
}
function* getProjectsOverviewFilters() {
  try {
    const filters = yield call(overviewFiltersApi.get)
    yield put(getProjectsOverviewFiltersSuccessful(filters))
  } catch (e) {
    yield put(error(e))
  }
}
function* getExternalDocumentsSaga({ payload: projectId }) {
  try {
    const documents = yield call(externalDocumentsApi.get, { path: { id: projectId } })
    yield put(getExternalDocumentsSuccessful(documents))
  } catch (e) {
    yield put(error(e))
  }
}

function* getProjectOverviewMapDataSaga({ payload }) {
  let query = {}

  const keys = Object.keys(payload)

  keys.forEach(key => {
    if (key === 'vuosi') {
      const value = payload[key]

      let startDate
      let endDate
      if (!isArray(value)) {
        startDate = dayjs(new Date(value, 0, 1)).format('YYYY-MM-DD')
        endDate = dayjs(new Date(value, 11, 31)).format('YYYY-MM-DD')
      } else {
        startDate = dayjs(new Date(value[0].value, 0, 1)).format('YYYY-MM-DD')
        endDate = dayjs(new Date(value[value.length - 1].value, 11, 31)).format(
          'YYYY-MM-DD'
        )
      }

      query = {
        ...query,
        start_date: startDate,
        end_date: endDate
      }
    } else if (key === 'henkilo') {
      const currentPersonIds = []

      const currentPayload = payload[key]

      currentPayload.forEach(current => currentPersonIds.push(current.id))

      query = {
        ...query,
        [key]: currentPersonIds.toString()
      }
    } else {
      const queryValue = []

      const current = payload[key]

      if (isArray(current)) {
        current.forEach(value => queryValue.push(value))
      } else {
        queryValue.push(payload[key])
      }

      if (queryValue.length > 0) {
        query = {
          ...query,
          [key]: queryValue.toString()
        }
      }
    }
  })
  try {
    const mapData = yield call(overviewMapApi.get, { query: query })
    yield put(getProjectsOverviewMapDataSuccessful(mapData))
  } catch (e) {
    yield put(error(e))
  }
}
function* getProjectsOverviewFloorAreaTargets() {
  try {
    const targets = yield call(overviewFloorAreaTargetApi.get)
    yield put(getProjectsOverviewFloorAreaTargetsSuccessful(targets))
  } catch (e) {
    yield put(error(e))
  }
}
function* getProjectMapLegends() {
  try {
    const legends = yield call(legendApi.get)
    yield put(getMapLegendsSuccessful(legends))
  } catch (e) {
    yield put(error(e))
  }
}
