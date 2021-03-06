export const FETCH_SCHEMAS = 'Fetch schemas'
export const FETCH_SCHEMAS_SUCCESSFUL = 'Fetch schemas successful'
export const SET_ALL_EDIT_FIELDS = 'Set all edit fields'
export const SET_ALL_EDIT_FIELDS_SUCCESSFUL = 'Set all edit fields successful'

export const fetchSchemas = (project, subtype) => ({ type: FETCH_SCHEMAS, payload: { project, subtype } })
export const fetchSchemasSuccessful = schemas => ({
  type: FETCH_SCHEMAS_SUCCESSFUL,
  payload: schemas
})
export const setAllEditFields = () => ({ type: SET_ALL_EDIT_FIELDS })
export const setAllEditFieldsSuccessful = fields => ({
  type: SET_ALL_EDIT_FIELDS_SUCCESSFUL,
  payload: fields
})
