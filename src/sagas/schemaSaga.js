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
import {
  deadlineSectionsSelector,
  floorAreaSectionsSelector,
  schemaSelector
} from '../selectors/schemaSelector'
import { error } from '../actions/apiActions'
import { schemaApi, cardSchemaApi, attributesApi } from '../utils/api'
import projectUtils from '../utils/projectUtils'
import schemaUtils from '../utils/schemaUtils'


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
  const schema = yield select(schemaSelector)
  const updates = yield select(updatesSelector)
  const deadlineSections = yield select(deadlineSectionsSelector)
  const floorAreaSections = yield select(floorAreaSectionsSelector)

  const result = []

  if (!schema || !schema.phases) {
    return null
  }

  const referenceFields = schemaUtils.getAllFields(schema.phases, deadlineSections, floorAreaSections)

  const keys = Object.keys(updates)

  keys.forEach(key => {
    const value = updates[key]

    const referenceField = referenceFields.find(field => field.name === key)

    if (referenceField && referenceField.editable ) {

     result.push({
        name: key,
        attribute_label: referenceField ? referenceField.label : '',
        label: referenceField ? referenceField.label : '',
        auto_fill: referenceField ? referenceField.autofill_readonly : false,
        timestamp: value.timestamp,
        user_name: value.user,
        old_value: value.old_value,
        new_value: value.new_value,
        editable: referenceField.editable,
        type: referenceField ? referenceField.type : ''
      })
    }
  })

  const uniques = projectUtils.getUniqueUpdates(
    result.sort(
      (u1, u2) => new Date(u2.timestamp).getTime() - new Date(u1.timestamp).getTime()
    ))

  yield put(setAllEditFieldsSuccessful(uniques))
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
