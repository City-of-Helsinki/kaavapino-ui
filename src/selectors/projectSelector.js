import { createSelector } from 'reselect'

const selectProject = state => state.project

export const projectsSelector = createSelector(selectProject, ({ projects }) => projects)

export const ownProjectsSelector = createSelector(
  selectProject,
  ({ ownProjects }) => ownProjects
)
export const onholdProjectsSelector = createSelector(
  selectProject,
  ({ onholdProjects }) => onholdProjects
)
export const archivedProjectsSelector = createSelector(
  selectProject,
  ({ archivedProjects }) => archivedProjects
)

export const amountOfProjectsToShowSelector = createSelector(
  selectProject,
  ({ amountOfProjectsToShow }) => amountOfProjectsToShow
)

export const amountOfProjectsToIncreaseSelector = createSelector(
  selectProject,
  ({ amountOfProjectsToIncrease }) => amountOfProjectsToIncrease
)

export const totalProjectsSelector = createSelector(
  selectProject,
  ({ totalProjects }) => totalProjects
)

export const totalOwnProjectsSelector = createSelector(
  selectProject,
  ({ totalOwnProjects }) => totalOwnProjects
)

export const totalOnholdProjectsSelector = createSelector(
  selectProject,
  ({ totalOnholdProjects }) => totalOnholdProjects
)

export const totalArchivedProjectsSelector = createSelector(
  selectProject,
  ({ totalArchivedProjects }) => totalArchivedProjects
)

export const pollingProjectsSelector = createSelector(
  selectProject,
  ({ pollingProjects }) => pollingProjects
)

export const loadingProjectsSelector = createSelector(
  selectProject,
  ({ loadingProjects }) => loadingProjects
)

export const currentProjectSelector = createSelector(
  selectProject,
  project => project.currentProject || null
)

export const timelineProjectSelector = createSelector(
  selectProject,
  ({ timelineProject }) => timelineProject
)

export const attributeDataSelector = createSelector(
  currentProjectSelector,
  ({ attribute_data }) => attribute_data
)

export const currentProjectLoadedSelector = createSelector(
  selectProject,
  project => project.currentProjectLoaded
)

export const currentProjectIdSelector = createSelector(
  currentProjectSelector,
  currentProject => (currentProject ? currentProject.id : null)
)

export const savingSelector = createSelector(selectProject, project => project?.saving)

export const changingPhaseSelector = createSelector(
  selectProject,
  project => project.changingPhase
)

export const validatingSelector = createSelector(
  selectProject,
  project => project.validating
)

export const hasErrorsSelector = createSelector(
  selectProject,
  ({ hasErrors }) => hasErrors
)

export const checkingSelector = createSelector(selectProject, ({ checking }) => checking)

export const updatesSelector = createSelector(
  currentProjectSelector,
  (currentProject = {}) =>
    currentProject
      ? currentProject._metadata
        ? currentProject._metadata.updates
          ? currentProject._metadata.updates
          : {}
        : {}
      : {}
)

export const usersSelector = createSelector(
  currentProjectSelector,
  (currentProject = {}) =>
    currentProject && currentProject._metadata ? currentProject._metadata.users : []
)

export const personnelSelector = createSelector(
  currentProjectSelector,
  (currentProject = {}) =>
    currentProject && currentProject._metadata ? currentProject._metadata.personnel : []
)

export const creatorSelector = createSelector(
  currentProjectSelector,
  (currentProject = {}) =>
    currentProject && currentProject._metadata ? currentProject._metadata.created : []
)

export const deadlinesSelector = createSelector(
  currentProjectSelector,
  (currentProject = { deadlines: [] }) => currentProject.deadlines
)

export const currentProjectArchivedSelector = createSelector(
  currentProjectSelector,
  currentProject => currentProject.archived
)
export const currentProjectOnholdSelector = createSelector(
  currentProjectSelector,
  currentProject => currentProject.onhold
)

export const selectedPhaseSelector = createSelector(
  selectProject,
  project => project.selectedPhase
)

export const onholdProjectSelector = createSelector(
  selectProject,
  project => project.onholdProjects
)

export const archivedProjectSelector = createSelector(
  selectProject,
  project => project.archivedProjects
)

export const projectOverviewFloorAreaSelector = createSelector(
  selectProject,
  project => project.overview.floorArea
)
export const projectOverviewBySubtypeSelector = createSelector(
  selectProject,
  project => project.overview.bySubtype
)
export const projectOverviewFiltersSelector = createSelector(
  selectProject,
  project => project.overview.filters
)
export const externalDocumentsSelector = createSelector(
  selectProject,
  project => project.currentProjectExternalDocuments
)
export const projectOverviewMapDataSelector = createSelector(
  selectProject,
  project => project.overview.mapData
)
export const projectOverviewMapFiltersSelector = createSelector(
  selectProject,
  project => project.overview.mapFilters
)
export const projectOverviewFloorAreaFiltersSelector = createSelector(
  selectProject,
  project => project.overview.floorAreaFilters
)
export const projectOverviewProjectTypeFiltersSelector = createSelector(
  selectProject,
  project => project.overview.projectTypeFilters
)
export const projectOverviewFloorAreaTargetsSelector = createSelector(
  selectProject,
  project => project.overview.floorAreaTargets
)
export const projectMapLegendsSelector = createSelector(
  selectProject,
  project => project.overview.legends
)
export const resettingDeadlinesSelector = createSelector(
  selectProject,
  ({ resettingDeadlines }) => resettingDeadlines
)

export const lockedSelector = createSelector(
  selectProject, 
  project => project?.locked
)

export const floorAreaSavedSelector = createSelector(
  selectProject, 
  ({ floorAreaSaved }) => floorAreaSaved
)

export const timetableSavedSelector = createSelector(
  selectProject, 
  ({ timetableSaved }) => timetableSaved
)

export const lastSavedSelector = createSelector(
  selectProject, 
  project => project?.lastSaved
)

export const pollSelector = createSelector(
  selectProject, 
  project => project?.connection
)

export const showTimetableSelector = createSelector(
  selectProject, 
  project => project?.showEditProjectTimetableForm
)

export const showFloorAreaSelector = createSelector(
  selectProject, 
  project => project?.showEditFloorAreaForm
)

export const lastModifiedSelector = createSelector(
  selectProject, 
  project => project?.lastModified
)