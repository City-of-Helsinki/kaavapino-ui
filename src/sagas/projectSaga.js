import axios from 'axios'
import { eventChannel } from 'redux-saga';
import { take, takeLatest, put, all, call, select, takeEvery, delay, race } from 'redux-saga/effects'
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
  formErrorListSelector,
  lastSavedSelector
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
  SAVE_PROJECT_TIMETABLE_FAILED,
  saveProjectTimetableFailed,
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
  VALIDATE_DATE,
  setDateValidationResult,
  VALIDATE_PROJECT_TIMETABLE,
  UPDATE_PROJECT_FAILURE,
  setValidatingTimetable
} from '../actions/projectActions'
import { startSubmit, stopSubmit, setSubmitSucceeded } from 'redux-form'
import { error } from '../actions/apiActions'
import { setAllEditFields } from '../actions/schemaActions'
import projectUtils from '../utils/projectUtils'
import errorUtil from '../utils/errorUtil'
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
import dayjs from 'dayjs'
import { toastr } from 'react-redux-toastr'
import { confirmationAttributeNames } from '../utils/constants';
import { generateConfirmedFields } from '../utils/generateConfirmedFields';

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
    takeLatest(VALIDATE_PROJECT_TIMETABLE,validateProjectTimetable),
    takeLatest(SAVE_PROJECT_TIMETABLE_SUCCESSFUL, saveProjectTimetableSuccessful),
    takeLatest(SAVE_PROJECT_TIMETABLE_FAILED, saveProjectTimetableFailed),
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
//Check if user has access to internet
function createOnlineChannel() {
  return eventChannel(emitter => {
    const onlineHandler = () => {
      emitter(true);
    };
    window.addEventListener('online', onlineHandler);
    return () => {
      window.removeEventListener('online', onlineHandler);
    };
  });
}

const onlineChannel = createOnlineChannel();

function* validateDate({payload}) {
  try {
    const query = {
      identifier: payload.field,
      project: payload.projectName,
      date: payload.date,
    };
    const result = yield call(projectDateValidateApi.get, { query });
    const valid = result.conflicting_deadline === null && result.error_reason === null && result.suggested_date === null ? true : false;
    yield put(setDateValidationResult(valid,result))
  } catch (e) {
    yield put(error(e))
  }
}

export function* watchValidateDate() {
  yield takeEvery(VALIDATE_DATE, validateDate);
}

function* getProjectDisabledDeadlineDates() {
  try {
    const dates = yield call(projectDateTypesApi.get);
    yield put(fetchDisabledDatesSuccess(dates));
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

const adjustDeadlineData = (attributeData, allAttributeData) => {
  Object.keys(allAttributeData).forEach(key => {
    if (key.includes("periaatteet_esillaolo") ||
        key.includes("mielipiteet_periaatteista") ||
        key.includes("periaatteet_lautakunnassa") ||
        key.includes("oas_esillaolo") ||
        key.includes("mielipiteet_oas") ||
        key.includes("luonnosaineiston_maaraaika") ||
        key.includes("luonnos_esillaolo") ||
        key.includes("mielipiteet_luonnos") ||
        key.includes("milloin_kaavaluonnos_lautakunnassa") ||
        key.includes("milloin_kaavaehdotus_lautakunnassa") ||
        key.includes("ehdotus_nahtaville_aineiston_maaraaika") ||
        key.includes("milloin_ehdotuksen_nahtavilla_paattyy") ||
        key.includes("viimeistaan_lausunnot_ehdotuksesta") ||
        key.includes("milloin_tarkistettu_ehdotus_lautakunnassa") ||
        key.includes("vahvista")) {
      attributeData[key] = attributeData[key] || allAttributeData[key]
    }
  })
  return attributeData
}

const getChangedAttributeData = (values, initial) => {
  let attribute_data = {}
  let errorValues = false
  const wSpaceRegex = /^(\s+|\s+)$/g
  Object.keys(values).forEach(key => {
    if(key.includes("_readonly")){
      return
    }
    if (initial && initial[key] !== undefined && isEqual(values[key], initial[key])) {
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
    else if(Array.isArray(values[key]) && Object.getPrototypeOf(values[key][0]) === Object.prototype &&
    Object.keys(values[key].length > 0)) {
      // Fieldset
      attribute_data[key] = values[key].map((fieldsetEntry) => {
        Object.keys(fieldsetEntry).forEach((entryKey) => {
          const entryValue = fieldsetEntry[entryKey]
          if (entryValue === '' || entryValue?.ops && entryValue.ops[0]?.insert.replace(wSpaceRegex, '').length === 0){
            fieldsetEntry[entryKey] = null
          }
        })
        return fieldsetEntry
      })
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
    window.scrollTo(0, 0); // Scroll to top of the page so user can see it is archiving
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

      toastr.success(i18.t('messages.timelines-successfully-saved'))
    } catch (e) {
      if (e?.code === "ERR_NETWORK") {
        toastr.error(i18.t('messages.general-save-error'))
      }
      yield put(stopSubmit(EDIT_FLOOR_AREA_FORM, e.response && e.response.data))
    }
  }
}

function* validateProjectTimetable() {
  // Remove success toastr before showing info
  toastr.removeByType('success');
  toastr.clean(); // Clear existing toastr notifications
  // Show a loading icon at the start of the saga
  toastr.info(i18.t('messages.checking-dates'), {
    timeOut: 0, // Keep it showing until manually removed
    removeOnHover: false,
    showCloseButton: false,
  });
  yield put(startSubmit(EDIT_PROJECT_TIMETABLE_FORM));
  yield put(setValidatingTimetable(true, false));

  const { initial, values } = yield select(editProjectTimetableFormSelector);
  const currentProjectId = yield select(currentProjectIdSelector);

  if (values) {
    let changedAttributeData = getChangedAttributeData(values, initial);

    if (changedAttributeData.oikaisukehoituksen_alainen_readonly) {
      delete changedAttributeData.oikaisukehoituksen_alainen_readonly;
    }

    let attribute_data = adjustDeadlineData(changedAttributeData, values);

    // Add confirmed field locking from vahvista_* flags
    // leave 'kaynnistys','hyvaksyminen','voimaantulo' out because no vahvista flags there
    const phaseNames = [
      'periaatteet',
      'oas',
      'luonnos',
      'ehdotus',
      'tarkistettu_ehdotus'
    ];
    //Find confirmed fields from attribute_data so backend knows not to edit them
    const confirmed_fields = generateConfirmedFields(
      attribute_data,
      confirmationAttributeNames,
      phaseNames
    );

    try {
      const response = yield call(
        projectApi.patch,
        {
          attribute_data,
          confirmed_fields,
        },
        { path: { id: currentProjectId } },
        ':id/?fake=true'
      );

      // Remove the loading icon
      toastr.removeByType('info');
      toastr.success(i18.t('messages.dates-confirmed'), {
        timeOut: 10000,
        removeOnHover: false,
        showCloseButton: true,
      });

      // Success. Prevent further validation calls by setting state
      yield put(setValidatingTimetable(true, true));

      // Backend may have edited phase start/end dates, so update project
      yield put(updateProject(response));
    } catch (e) {
      if (e?.code === 'ERR_NETWORK') {
        toastr.error(i18.t('messages.validation-error'));
      }

      // Catch reached so dates were not correct,
      // get days and update them to form from projectReducer UPDATE_PROJECT_FAILURE

      // For debugging
      // Get the error message string dynamically
      // const errorMessage = errorUtil.getErrorMessage(e?.response?.data);
      // toastr.removeByType('info');
      // toastr.info(i18.t('messages.error-with-dates'), errorMessage, {
      //   timeOut: 10000,
      //   removeOnHover: false,
      //   showCloseButton: true,
      //   preventDuplicates: true,
      //   className: 'large-scrollable-toastr rrt-info',
      // });

      // Show a message of a dates changed
      // const message = errorUtil.getErrorMessage(e?.response?.data, 'date');
      // toastr.warning(i18.t('messages.fixed-timeline-dates'), message, {
      //   timeOut: 10000,
      //   removeOnHover: false,
      //   showCloseButton: true,
      //   preventDuplicates: true,
      //   className: 'large-scrollable-toastr rrt-warning',
      // });

      // Dispatch failure action with error data for the reducer to handle date correction to timeline form
      yield put({
        type: UPDATE_PROJECT_FAILURE,
        payload: { errorData: e?.response?.data, formValues: attribute_data },
      });
    }
  }
}

function* saveProjectTimetable(action,retryCount = 0) {
  yield put(startSubmit(EDIT_PROJECT_TIMETABLE_FORM))

  const { initial, values } = yield select(
    editProjectTimetableFormSelector
  )
  const currentProjectId = yield select(currentProjectIdSelector)

  if (values) {
    let changedAttributeData = getChangedAttributeData(values, initial)
    if(changedAttributeData.oikaisukehoituksen_alainen_readonly){
      delete changedAttributeData.oikaisukehoituksen_alainen_readonly
    }
    let attribute_data = adjustDeadlineData(changedAttributeData, values)
    
    // Add confirmed field locking from vahvista_* flags
    // leave 'kaynnistys','hyvaksyminen','voimaantulo' out because no vahvista flags there
    const phaseNames = [
      'periaatteet',
      'oas',
      'luonnos',
      'ehdotus',
      'tarkistettu_ehdotus'
    ];
    
    //Find confirmed fields from attribute_data so backend knows not to edit them
    const confirmed_fields = generateConfirmedFields(
      attribute_data,
      confirmationAttributeNames,
      phaseNames
    );

    const maxRetries = 5;
    try {
      const updatedProject = yield call(
        projectApi.patch,
        { attribute_data, confirmed_fields },
        { path: { id: currentProjectId } },
        ':id/'
      )

      yield put(updateProject(updatedProject))
      yield put(setSubmitSucceeded(EDIT_PROJECT_TIMETABLE_FORM))
      yield put(saveProjectTimetableSuccessful(true))
      yield put(setAllEditFields())
      toastr.success(i18.t('messages.deadlines-successfully-saved'))
    } 
    catch (e) {
      if (e?.code === "ERR_NETWORK" && retryCount <= maxRetries) {
        toastr.error(i18.t('messages.error-connection'))
        yield race({
          online: take(onlineChannel), // Wait for the online event
          timeout: delay(2500) // Wait for 2.5 seconds before retrying
        });
        yield delay(2500); // Wait for 2.5 seconds before retrying
        yield call(saveProjectTimetable,action, retryCount + 1);
      }
      else {
        yield put(stopSubmit(EDIT_PROJECT_TIMETABLE_FORM, e?.response?.data))
        // Get the error message string dynamically
        const errorMessage = e?.response?.data ? errorUtil.getErrorMessage(e.response.data) : i18.t('messages.error-connection-fail');
        // Display the error message in a toastr
        toastr.error(i18.t('messages.general-save-error'), errorMessage, {
          timeOut: 0,
          removeOnHover: false,
          showCloseButton: true,
          className: 'large-scrollable-toastr rrt-error'
        });
        yield put(saveProjectTimetableFailed(false))
      }
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

function addListingInfo(deltaOps) {
  //Add isOrderList and isBulleted attributes to the previous op if the current op is a list item
  //This way it is easier for backend to interpret the list styles to document
  const enriched = [...deltaOps]
  for (let i = 0; i < enriched.length; i++) {
    const op = enriched[i]
    if (op?.attributes?.list === 'ordered' && i > 0 && !enriched[i - 1].attributes?.isOrderList) {
      enriched[i - 1].attributes = { ...(enriched[i - 1].attributes || {}), isOrderList: true }
    }
    if (op?.attributes?.list === 'bullet' && i > 0 && !enriched[i - 1].attributes?.isBulleted) {
      enriched[i - 1].attributes = { ...(enriched[i - 1].attributes || {}), isBulleted: true }
    }
  }
  return enriched
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
      for (const key in changedValues) {
        const value = changedValues[key]
        if (Array.isArray(value)) {
          changedValues[key] = value.map(item => {
            if (item && Array.isArray(item.ops)) {
              return {
                ...item,
                ops: addListingInfo(item.ops)
              }
            }
            return item
          })
        } else if (value && Array.isArray(value.ops)) {
          changedValues[key] = {
            ...value,
            ops: addListingInfo(value.ops)
          }
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

        // Set connection poll status to true after recovering from error
        const lastSaved = yield select(lastSavedSelector)
        if (lastSaved?.status === "error" || lastSaved?.status === "field_error"){
          yield put(setPoll(true))
        } else {
          yield put(setPoll(false))
        }
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
      window.scrollTo(0, 0);
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
