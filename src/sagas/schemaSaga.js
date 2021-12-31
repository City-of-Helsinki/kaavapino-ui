import { takeLatest, put, all, call, select } from 'redux-saga/effects'
import {
  FETCH_SCHEMAS,
  fetchSchemasSuccessful,
  SET_ALL_EDIT_FIELDS,
  setAllEditFieldsSuccessful,
  GET_PROJECT_CARD_FIELDS,
  getProjectCardFieldsSuccessful,
  GET_ATTRIBUTES,
  getAttributesSuccessful
} from '../actions/schemaActions'
import { updatesSelector } from '../selectors/projectSelector'
import { error } from '../actions/apiActions'
import { schemaApi, cardSchemaApi, attributesApi } from '../utils/api'

export default function* schemaSaga() {
  yield all([
    takeLatest(FETCH_SCHEMAS, fetchSchemas),
    takeLatest(SET_ALL_EDIT_FIELDS, allEditedFieldsSaga),
    takeLatest(GET_PROJECT_CARD_FIELDS, getProjectCardFields),
    takeLatest(GET_ATTRIBUTES, getAttributes)
  ])
}

function* fetchSchemas({ payload: { project, subtype } }) {
  try {
    const [{ subtypes }] = yield call(schemaApi.get, {
      query: { project: project, subtypes: subtype }
    })

    yield put(fetchSchemasSuccessful(subtypes[0]))
    yield call(allEditedFieldsSaga)
  } catch (e) {
    yield put(error(e))
  }
}

function* allEditedFieldsSaga() {
  const updates = yield select(updatesSelector)
  yield put(setAllEditFieldsSuccessful(updates))
}

function* getProjectCardFields() {
  try {
    const projectFields = yield call(cardSchemaApi.get)
    yield put(getProjectCardFieldsSuccessful(projectFields))
  } catch (e) {
    yield put(error(e))
  }
}

function* getAttributes() {
  try {
    const attributes = yield call(attributesApi.get)
    yield put(getAttributesSuccessful(attributes))
  } catch (e) {
    yield put(error(e))
  }
}
