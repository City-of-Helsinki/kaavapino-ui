import { createSelector } from 'reselect'
import { NEW_PROJECT_FORM, EDIT_PROJECT_FORM, EDIT_FLOOR_AREA_FORM, EDIT_PROJECT_TIMETABLE_FORM } from '../constants'

const selectForm = state => state && state.form

export const newProjectFormSelector = createSelector(
  selectForm,
  form => form[NEW_PROJECT_FORM]
)

export const newProjectSubtypeSelector = createSelector(
  newProjectFormSelector,
  newProjectForm =>
    newProjectForm && newProjectForm.values ? newProjectForm.values.subtype : null
)

export const editFormSelector = createSelector(
  selectForm,
  form => form && form[EDIT_PROJECT_FORM]
)

export const editFloorAreaFormSelector = createSelector(
  selectForm,
  form => form[EDIT_FLOOR_AREA_FORM]
)

export const editProjectTimetableFormSelector = createSelector(
  selectForm,
  form => form[EDIT_PROJECT_TIMETABLE_FORM]
)

export const reportFormSelector = createSelector(selectForm, form => form.reportForm)

export const reportFormSelectedReportSelector = createSelector(
  reportFormSelector,
  reportForm =>
    reportForm ? (reportForm.values ? reportForm.values.report : null) : null
)

export const deadlineModalSelector = createSelector(
  selectForm,
  form => form.deadlineModal
)
