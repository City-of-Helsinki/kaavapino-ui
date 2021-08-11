export const FETCH_PROJECTS = 'Fetch projects'
export const FETCH_PROJECTS_SUCCESSFUL = 'Fetch projects successful'
export const FETCH_OWN_PROJECTS_SUCCESSFUL = 'Fetch own projects successful'
export const CLEAR_PROJECTS = 'Clear projects'
export const SET_PROJECTS = 'Set projects'
export const SET_OWN_PROJECTS = 'Set own projects'
export const SET_AMOUNT_OF_PROJECTS_TO_INCREASE = 'Set amount of projects to increase'
export const INCREASE_AMOUNT_OF_PROJECTS_TO_SHOW = 'Increase amount of projects to show'
export const SET_AMOUNT_OF_PROJECTS_TO_SHOW = 'Set amount of projects to show'
export const SET_TOTAL_PROJECTS = 'Set total projects'
export const SET_TOTAL_OWN_PROJECTS = 'Set total own projects'
export const SORT_PROJECTS = 'Sort projects'
export const CREATE_PROJECT = 'Create project'
export const CREATE_PROJECT_SUCCESSFUL = 'Create project successful'
export const CREATE_OWN_PROJECT_SUCCESSFUL = 'Create own project successful'
export const FETCH_PROJECT_SUCCESSFUL = 'Fetch project successful'
export const UPDATE_PROJECT = 'Update project'
export const INITIALIZE_PROJECT = 'Initialize project'
export const INITIALIZE_PROJECT_SUCCESSFUL = 'Initialize project successful'
export const SAVE_PROJECT_BASE = 'Save project base'
export const SAVE_PROJECT_BASE_SUCCESSFUL = 'Save project base successful'
export const SAVE_PROJECT_FLOOR_AREA = 'Save project floor area'
export const SAVE_PROJECT_FLOOR_AREA_SUCCESSFUL = 'Save project floor area successful'
export const SAVE_PROJECT_TIMETABLE = 'Save project timetable'
export const SAVE_PROJECT_TIMETABLE_SUCCESSFUL = 'Save project timetable successful'
export const SAVE_PROJECT = 'Save project'
export const SAVE_PROJECT_SUCCESSFUL = 'Save project successful'
export const VALIDATE_PROJECT_FIELDS = 'Validate project fields'
export const VALIDATE_PROJECT_FIELDS_SUCCESSFUL = 'Validate project fields successful'
export const CHANGE_PROJECT_PHASE = 'Change phase'
export const CHANGE_PROJECT_PHASE_SUCCESSFUL = 'Change phase successful'
export const CHANGE_PROJECT_PHASE_FAILURE = 'Change phase failure'
export const PROJECT_FILE_UPLOAD = 'Project file upload'
export const PROJECT_FILE_UPLOAD_SUCCESSFUL = 'Project file upload successful'
export const PROJECT_FILE_REMOVE = 'Project file remove'
export const PROJECT_FILE_REMOVE_SUCCESSFUL = 'Project file remove successful'
export const PROJECT_SET_CHECKING = 'Project set checking'
export const PROJECT_SET_DEADLINES = 'Project set deadlines'
export const PROJECT_SET_DEADLINES_SUCCESSFUL = 'Project set deadlines successful'
export const FETCH_PROJECT_DEADLINES = 'Fetch project deadlines'
export const FETCH_PROJECT_DEADLINES_SUCCESSFUL = 'Fetch project deadlines successful'
export const GET_PROJECT = 'Get project'
export const GET_PROJECT_SUCCESSFUL = 'Get project successful'
export const RESET_PROJECT_DEADLINES = 'Reset project deadlines'
export const GET_PROJECT_SNAPSHOT = 'Get project snapshot'
export const GET_PROJECT_SNAPSHOT_SUCCESSFUL = 'Get project snapshot successful'
export const RESET_PROJECT_SNAPSHOT = 'Reset project snapshot'
export const SET_SELECTED_PHASE_ID = 'Set selected phase id'
export const GET_PROJECTS_OVERVIEW_FLOOR_AREA = 'Get projects overview floor-area'
export const GET_PROJECTS_OVERVIEW_FLOOR_AREA_SUCCESSFUL = 'Get projects overview floor-area successful'
export const GET_PROJECTS_OVERVIEW_BY_SUBTYPE = 'Get projects overview by subtype'
export const GET_PROJECTS_OVERVIEW_BY_SUBTYPE_SUCCESSFUL = 'Get projects overview by subtype successful'
export const GET_PROJECTS_OVERVIEW_FILTERS = 'Get project overview filters'
export const GET_PROJECTS_OVERVIEW_FILTERS_SUCCESSFUL = 'Get project overview filters successful'
export const GET_EXTERNAL_DOCUMENTS = 'Get external documents'
export const GET_EXTERNAL_DOCUMENTS_SUCCESSFUL = 'Get external documents successful'
export const CLEAR_PROJECTS_OVERVIEW_FLOOR_AREA= 'Clear current data'
export const GET_PROJECTS_OVERVIEW_MAP_DATA = 'Get projects overview map data'
export const GET_PROJECTS_OVERVIEW_MAP_DATA_SUCCESSFUL = 'Get projects overview map data successful'
export const CLEAR_PROJECTS_OVERVIEW_MAP_DATA ='Clear projects overview map data'
export const SET_OVERVIEW_MAP_FILTERS = "Set overview map filters"
export const SET_OVERVIEW_FLOOR_AREA_FILTERS = "Set overview floor area filters"
export const SET_OVERVIEW_PROJECT_TYPE_FILTERS = "Set overview project type filters"
export const CLEAR_PROJECTS_OVERVIEW_PROJECT_TYPE_DATA = "Clear projects data"
export const GET_PROJECTS_OVERVIEW_FLOOR_AREA_TARGETS = "get projects overview floor area targets"
export const GET_PROJECTS_OVERVIEW_FLOOR_AREA_TARGETS_SUCCESSFUL = "get projects overview floor area targets successful"
export const CLEAR_PROJECTS_OVERVIEW = "Clear project overview"
export const CLEAR_EXTERNAL_DOCUMENTS = "Clear external documents"

export const fetchProjects = searchQuery => ({
  type: FETCH_PROJECTS,
  payload: searchQuery
})
export const fetchOwnProjectsSuccessful = projects => ({
  type: FETCH_OWN_PROJECTS_SUCCESSFUL,
  payload: projects
})
export const fetchProjectsSuccessful = projects => ({
  type: FETCH_PROJECTS_SUCCESSFUL,
  payload: projects
})
export const clearProjects = () => ({
  type: CLEAR_PROJECTS
})

CLEAR_PROJECTS
export const setProjects = projects => ({ type: SET_PROJECTS, payload: projects })
export const setOwnProjects = projects => ({ type: SET_OWN_PROJECTS, payload: projects })
export const initializeProject = id => ({ type: INITIALIZE_PROJECT, payload: id })
export const initializeProjectSuccessful = () => ({ type: INITIALIZE_PROJECT_SUCCESSFUL })

export const setAmountOfProjectsToIncrease = amount => ({
  type: SET_AMOUNT_OF_PROJECTS_TO_INCREASE,
  payload: amount
})

export const increaseAmountOfProjectsToShow = () => ({
  type: INCREASE_AMOUNT_OF_PROJECTS_TO_SHOW
})
export const setAmountOfProjectsToShow = count => ({
  type: SET_AMOUNT_OF_PROJECTS_TO_SHOW,
  payload: count
})

export const setTotalProjects = count => ({ type: SET_TOTAL_PROJECTS, payload: count })
export const setTotalOwnProjects = count => ({
  type: SET_TOTAL_OWN_PROJECTS,
  payload: count
})

export const setSelectedPhaseId = phaseId => ({
  type: SET_SELECTED_PHASE_ID,
  payload: phaseId
})

export const sortProjects = options => ({ type: SORT_PROJECTS, payload: options })

export const fetchProjectSuccessful = project => ({
  type: FETCH_PROJECT_SUCCESSFUL,
  payload: project
})

export const fetchProjectDeadlines = subtype => ({
  type: FETCH_PROJECT_DEADLINES,
  payload: subtype
})
export const fetchProjectDeadlinesSuccessful = deadlines => ({
  type: FETCH_PROJECT_DEADLINES_SUCCESSFUL,
  payload: deadlines
})

export const updateProject = updatedProject => ({
  type: UPDATE_PROJECT,
  payload: updatedProject
})

export const createProject = () => ({ type: CREATE_PROJECT })
export const createProjectSuccessful = project => ({
  type: CREATE_PROJECT_SUCCESSFUL,
  payload: project
})
export const createOwnProjectSuccessful = project => ({
  type: CREATE_OWN_PROJECT_SUCCESSFUL,
  payload: project
})

export const saveProjectBase = archived => ({
  type: SAVE_PROJECT_BASE,
  payload: archived
})
export const saveProjectBaseSuccessful = () => ({ type: SAVE_PROJECT_BASE_SUCCESSFUL })

export const saveProjectFloorArea = () => ({ type: SAVE_PROJECT_FLOOR_AREA })
export const saveProjectFloorAreaSuccessful = () => ({
  type: SAVE_PROJECT_FLOOR_AREA_SUCCESSFUL
})

export const saveProjectTimetable = () => ({ type: SAVE_PROJECT_TIMETABLE })
export const saveProjectTimetableSuccessful = () => ({
  type: SAVE_PROJECT_TIMETABLE_SUCCESSFUL
})

export const saveProject = () => ({ type: SAVE_PROJECT })
export const saveProjectSuccessful = () => ({ type: SAVE_PROJECT_SUCCESSFUL })

export const validateProjectFields = formValues => ({
  type: VALIDATE_PROJECT_FIELDS,
  payload: formValues
})
export const validateProjectFieldsSuccessful = result => ({
  type: VALIDATE_PROJECT_FIELDS_SUCCESSFUL,
  payload: result
})

export const changeProjectPhase = nextPhase => ({
  type: CHANGE_PROJECT_PHASE,
  payload: nextPhase
})
export const changeProjectPhaseSuccessful = updatedProject => ({
  type: CHANGE_PROJECT_PHASE_SUCCESSFUL,
  payload: updatedProject
})
export const changeProjectPhaseFailure = () => ({ type: CHANGE_PROJECT_PHASE_FAILURE })

export const projectFileUpload = fileObject => ({
  type: PROJECT_FILE_UPLOAD,
  payload: fileObject
})
export const projectFileUploadSuccessful = attributeData => ({
  type: PROJECT_FILE_UPLOAD_SUCCESSFUL,
  payload: attributeData
})
export const projectFileRemove = attribute => ({
  type: PROJECT_FILE_REMOVE,
  payload: attribute
})
export const projectFileRemoveSuccessful = attribute => ({
  type: PROJECT_FILE_REMOVE_SUCCESSFUL,
  payload: attribute
})

export const projectSetChecking = value => ({
  type: PROJECT_SET_CHECKING,
  payload: value
})

export const projectSetDeadlines = () => ({ type: PROJECT_SET_DEADLINES })
export const projectSetDeadlinesSuccessful = deadlines => ({
  type: PROJECT_SET_DEADLINES_SUCCESSFUL,
  payload: deadlines
})

export const getProject = projectId => ({ type: GET_PROJECT, payload: projectId })
export const getProjectSuccessful = project => ({
  type: GET_PROJECT_SUCCESSFUL,
  payload: project
})

export const resetProjectDeadlines = id => ({
  type: RESET_PROJECT_DEADLINES,
  payload: id
})

export const getProjectSnapshot = (projectId, snapshot, phase) => ({
  type: GET_PROJECT_SNAPSHOT,
  payload: { projectId, snapshot, phase }
})
export const getProjectSnapshotSuccessful = project => ({
  type: GET_PROJECT_SNAPSHOT_SUCCESSFUL,
  payload: project
})
export const resetProjectSnapshot = () => ({
  type: RESET_PROJECT_SNAPSHOT
})

export const getProjectsOverviewFloorArea = payload => ({
  type: GET_PROJECTS_OVERVIEW_FLOOR_AREA,
  payload: payload
})
export const clearProjectsOverviewFloorArea = () => ({
  type: CLEAR_PROJECTS_OVERVIEW_FLOOR_AREA
})
export const getProjectsOverviewFloorAreaSuccessful = floorArea => ({
  type: GET_PROJECTS_OVERVIEW_FLOOR_AREA_SUCCESSFUL,
  payload: floorArea
})

export const getProjectsOverviewBySubtype = payload => ({
  type: GET_PROJECTS_OVERVIEW_BY_SUBTYPE,
  payload: payload
})
export const getProjectsOverviewBySubtypeSuccessful = bySubtype => ({
  type: GET_PROJECTS_OVERVIEW_BY_SUBTYPE_SUCCESSFUL,
  payload: bySubtype
})
export const getProjectsOverviewFilters = () => ({
  type: GET_PROJECTS_OVERVIEW_FILTERS
})
export const getProjectsOverviewFiltersSuccessful = filters => ({
  type: GET_PROJECTS_OVERVIEW_FILTERS_SUCCESSFUL,
  payload: filters
})
export const getExternalDocuments = projectId => ({
  type: GET_EXTERNAL_DOCUMENTS,
  payload: projectId
})
export const clearExternalDocuments = () => ({
  type: CLEAR_EXTERNAL_DOCUMENTS
})

export const getExternalDocumentsSuccessful = documents => ({
  type: GET_EXTERNAL_DOCUMENTS_SUCCESSFUL,
  payload: documents
})

export const getProjectsOverviewMapData = filters => ({
  type: GET_PROJECTS_OVERVIEW_MAP_DATA,
  payload: filters
})

export const getProjectsOverviewMapDataSuccessful = mapData => ({
  type: GET_PROJECTS_OVERVIEW_MAP_DATA_SUCCESSFUL,
  payload: mapData
})

export const clearProjectsOverviewMapData = () => ({
    type: CLEAR_PROJECTS_OVERVIEW_MAP_DATA
})
export const setProjectsOverviewMapFilter = filter => ({
  type: SET_OVERVIEW_MAP_FILTERS,
  payload: filter
})
export const setProjectsOverviewFloorAreaFilter = filter => ({
  type: SET_OVERVIEW_FLOOR_AREA_FILTERS,
  payload: filter
})
export const setProjectsOverviewProjectTypeFilter = filter => ({
  type: SET_OVERVIEW_PROJECT_TYPE_FILTERS,
  payload: filter
})
export const clearProjectsOverviewProjectTypeData = () => ({
  type: CLEAR_PROJECTS_OVERVIEW_PROJECT_TYPE_DATA
})
export const clearProjectsOverview = () => ({
  type: CLEAR_PROJECTS_OVERVIEW
})
export const getProjectsOverviewFloorAreaTargetsSuccessful = targets => ({
  type: GET_PROJECTS_OVERVIEW_FLOOR_AREA_TARGETS_SUCCESSFUL,
  payload: targets
})
export const getProjectsOverviewFloorAreaTargets = () => ({
  type: GET_PROJECTS_OVERVIEW_FLOOR_AREA_TARGETS
})