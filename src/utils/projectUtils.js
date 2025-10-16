import { isArray } from 'lodash'
import { showField, vis_bool_group_map } from './projectVisibilityUtils'

let confirmationAttributeNames = [
  'vahvista_oas_esillaolo_alkaa','vahvista_oas_esillaolo_paattyy',
  'vahvista_oas_esillaolo_alkaa_2','vahvista_oas_esillaolo_paattyy_2',
  'vahvista_oas_esillaolo_alkaa_3','vahvista_oas_esillaolo_paattyy_3',
  'vahvista_periaatteet_esillaolo_alkaa','vahvista_periaatteet_esillaolo_paattyy',
  'vahvista_periaatteet_esillaolo_alkaa_2','vahvista_periaatteet_esillaolo_paattyy_2',
  'vahvista_periaatteet_esillaolo_alkaa_3','vahvista_periaatteet_esillaolo_paattyy_3',
  'vahvista_periaatteet_lautakunnassa',
  'vahvista_luonnos_esillaolo_alkaa', 'vahvista_luonnos_esillaolo_paattyy',
  'vahvista_luonnos_esillaolo_alkaa_2', 'vahvista_luonnos_esillaolo_paattyy_2',
  'vahvista_luonnos_esillaolo_alkaa_3', 'vahvista_luonnos_esillaolo_paattyy_3',
  'vahvista_ehdotus_esillaolo_alkaa_pieni', 'vahvista_ehdotus_esillaolo_paattyy',
  'vahvista_kaavaluonnos_lautakunnassa',
  'vahvista_ehdotus_esillaolo_alkaa_pieni', 'vahvista_ehdotus_esillaolo_alkaa_iso',
  'vahvista_ehdotus_esillaolo_paattyy',
  'vahvista_ehdotus_esillaolo_alkaa_pieni_2', 'vahvista_ehdotus_esillaolo_alkaa_iso_2',
  'vahvista_ehdotus_esillaolo_paattyy_2',
  'vahvista_ehdotus_esillaolo_alkaa_pieni_3', 'vahvista_ehdotus_esillaolo_alkaa_iso_3',
  'vahvista_ehdotus_esillaolo_paattyy_3',
  'vahvista_ehdotus_esillaolo_alkaa_pieni_4', 'vahvista_ehdotus_esillaolo_alkaa_iso_4',
  'vahvista_ehdotus_esillaolo_paattyy_4',
  'vahvista_kaavaehdotus_lautakunnassa',
  'vahvista_tarkistettu_ehdotus_lautakunnassa',
];
const confirmationAttributes = confirmationAttributeNames.concat(confirmationAttributeNames.map(attr => attr + '_readonly'));
Object.freeze(confirmationAttributes);

const addZeroPrefixIfNecessary = value => (value < 10 ? `0${value}` : value)

const formatDate = value => {
  const date = new Date(value)
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${addZeroPrefixIfNecessary(day)}.${addZeroPrefixIfNecessary(month)}.${year}`
}

const formatTime = value => {
  const date = new Date(value)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return `${addZeroPrefixIfNecessary(hours)}:${addZeroPrefixIfNecessary(minutes)}`
}

const formatDateTime = date => `${formatDate(date)} ${formatTime(date)}`

const formatUsersName = user => {
  if (user) {
    return user.last_name || user.first_name
      ? `${user.last_name} ${user.first_name}`
      : user.email
  }
  return ''
}

const formatDeadlines = ({ name, deadlines, subtype }, phases) => {
  return {
    title: name,
    deadlines: deadlines.map(d => ({
      title: d.phase_name,
      start: new Date(d.start),
      end: new Date(d.deadline)
    })),
    colors: phases
      .filter(p => subtype === p.project_subtype)
      .sort((p1, p2) => p1.index - p2.index)
      .map(p => p.color_code)
  }
}

const isFieldMissing = (fieldName, isFieldRequired, attributeData, autofill_readonly) => {
  let name = fieldName
  if(name?.includes("_readonly")){
    //get the correct key name for readonly values, attribute data has the value without _readonly for some reason
    name = name.replace('_readonly','');
  }
  const value = findValueFromObject(attributeData, name)

  return (
    isFieldRequired &&
    !autofill_readonly &&
    (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))
  )
}

const isFieldSetRequired = fieldsetAttributes => {
  let required = false

  fieldsetAttributes &&
    fieldsetAttributes.forEach(attribute => {
      if (attribute.required) {
        required = true
      }
    })

  return required
}
const isFieldsetMissing = (fieldName, formValues, fieldsetRequired) => {
  if (!fieldsetRequired) {
    return false
  }
  const value = formValues[fieldName]

  let missing = true

  value &&
    value.forEach(current => {
      if (!current._deleted && missing) {
        missing = false
      }
    })
  return missing
}

const sortProjects = (projects, options) => {
  const targetAttributes = [
    'projectId',
    'hankenumero',
    'name',
    'phase',
    'subtype',
    'modified_at',
    'user'
  ]
  const { sort, dir, phases, amountOfProjectsToShow, users } = options
  if (sort < 0) return projects
  return projects
    .slice(0, amountOfProjectsToShow)
    .sort((a, b) => {
      const p1 = formatFilterProject(a, true, phases, users)[targetAttributes[sort]]
      const p2 = formatFilterProject(b, true, phases, users)[targetAttributes[sort]]

      return dir === 0 ? (p1 > p2 ? 1 : -1) : p1 < p2 ? 1 : -1
    })
    .concat(projects.slice(amountOfProjectsToShow, projects.length))
}

const formatFilterProject = (project, sort = false, phases, users) => {
  const user = formatUsersName(users.find(u => u.id === project.user))
  const modified_at = sort
    ? new Date(project.modified_at).getTime()
    : formatDate(project.modified_at)
  const phase = formatPhase(project.phase, phases).index
  const { subtype } = project
  const { name } = project
  const projectId = project.pino_number || '-'
  const hankenumero = project.attribute_data.hankenumero || '-'

  return { name, hankenumero, user, modified_at, phase, subtype, projectId }
}

const formatPhase = (id, phases) => {
  const { index, name, color_code } = phases?.find(phase => phase.id === id) || { index: null, name: '', color_code: '' }
  return { index, phaseName: name, phaseColor: color_code }
}

const formatNextDeadline = (deadlines, phase) =>
  formatDate(deadlines.find(d => d.phase_id === phase).deadline)

const formatSubtype = (id, subtypes) => {
  const foundSubtype = subtypes.find(subtype => subtype.id === id)
  if (foundSubtype) {
    return foundSubtype.name
  }
}

function getFieldsetAttributes(parent, sections) {
  let fieldsetAttributes
  sections.some(title => {
    if (fieldsetAttributes) {
      return fieldsetAttributes ? true : false
    }
    title.fields.some(fieldset => {
      if (fieldset.name === parent) {
        fieldsetAttributes = fieldset.fieldset_attributes.map(key => key.name)
        return fieldsetAttributes ? true : false
      }
      return false
    })
    return false
  })
  return fieldsetAttributes
}

const checkDeadline = (props, currentDeadline) => {
  if (currentDeadline) {
    props.input.defaultValue = currentDeadline.date
    return
  }
}
const getDefaultValue = (parentName, attributeData, name) => {
  const fieldsetFields = attributeData[parentName]

  if (fieldsetFields && fieldsetFields.length > 0) {
    return fieldsetFields[0][name]
  }
}

const generateArrayOfYears = parameter => {
  const max = new Date().getFullYear() + 2
  const min = max - 20
  const years = []

  // eslint-disable-next-line for-direction
  for (let year = max; year >= min; year--) {
    years.push({ parameter, key: year.toString(), label: year.toString(), value: year })
  }
  return years
}
const generateArrayOfYearsForChart = () => {
  const max = new Date().getFullYear() + 10
  const min = new Date().getFullYear() - 5
  const years = []

  // eslint-disable-next-line for-direction
  for (let year = min; year < max; year++) {
    years.push({ key: year.toString(), label: year.toString(), value: year })
  }
  return years
}

const findValueFromObject = (object, key) => {
  let value
  Object.keys(object).some(currentKey => {
    if (currentKey === key && !object['_deleted']) {
      value = object[currentKey]
      return true
    }
    if (object[currentKey] && typeof object[currentKey] === 'object') {
      value = findValueFromObject(object[currentKey], key)
      return value !== undefined
    }

    return false
  })
  return value
}
const findValuesFromObject = (object, key, returnArray) => {
  let value

  Object.keys(object).some(currentKey => {
    if (currentKey === key) {
      if (!object['_deleted']) {
        returnArray.push(object[currentKey])
      }

      return true
    }
    if (object[currentKey] && typeof object[currentKey] === 'object') {
      value = findValuesFromObject(object[currentKey], key, returnArray)
      return value !== undefined
    }
    return false
  })
  return value
}

function isFieldOrMatrixOrFieldsetMissing(field, attributeData) {
  if (field.type === 'matrix') {
    const { matrix } = field;
    return matrix.fields.some(({ required, name }) => isFieldMissing(name, required, attributeData));
  } else if (field.type === 'fieldset') {
    return hasFieldsetErrors(field.name, field.fieldset_attributes, attributeData);
  } else {
    return isFieldMissing(field.name, field.required, attributeData, field.autofill_readonly);
  }
}

function hasUnconfirmedRequiredConfirmations(attributeData, currentSchema) {
  if (!currentSchema?.title) return false;

  const phaseTitleNormalized = (currentSchema.title || '').toLowerCase().trim();
  let allowedSegments = [];
  if (phaseTitleNormalized.includes('oas')) allowedSegments = ['oas'];
  else if (phaseTitleNormalized.includes('periaatteet')) allowedSegments = ['periaatteet'];
  else if (phaseTitleNormalized.includes('luonnos')) allowedSegments = ['luonnos','kaavaluonnos'];
  else if (phaseTitleNormalized.includes('tarkistettu') && phaseTitleNormalized.includes('ehdotus')) allowedSegments = ['tarkistettu_ehdotus'];
  else if (phaseTitleNormalized.includes('ehdotus')) allowedSegments = ['kaavaehdotus','ehdotus'];

  const triggerTrueList = [];
  const requiredConfirmations = [];

  const esillaoloRegex = /^jarjestetaan_(\w+)_esillaolo_(\d+)$/;
  const lautakuntaRegex = /^(\w+)_lautakuntaan_(\d+)$/;

  Object.entries(attributeData).forEach(([key, value]) => {
    if (value !== true) return;
    let match = key.match(esillaoloRegex);
    if (match) {
      const seg = match[1];
      const idx = parseInt(match[2], 10);
      if (!allowedSegments.includes(seg)) return;
      triggerTrueList.push(key);
      const suffix = idx > 1 ? '_' + idx : '';
      requiredConfirmations.push(`vahvista_${seg}_esillaolo_alkaa${suffix}`);
      return;
    }
    match = key.match(lautakuntaRegex);
    if (match) {
      const seg = match[1];
      const idx = parseInt(match[2], 10);
      if (!allowedSegments.includes(seg)) return;
      triggerTrueList.push(key);
      const suffix = idx > 1 ? '_' + idx : '';
      requiredConfirmations.push(`vahvista_${seg}_lautakunnassa${suffix}`);
      return;
    }
  });

  for (let i = 0; i < requiredConfirmations.length; i++) {
    const cKey = requiredConfirmations[i];
    const cVal = attributeData[cKey];
    if (cVal !== true) {
      return true;
    }
  }
  return false;
}

function hasMissingFields(attributeData, currentProject, schema, action) {
  const currentSchema = schema.phases.find(s => s.id === currentProject.phase);
  const currentDeadlineSchema = schema.deadline_sections.find(s => s.id === currentProject.phase)
  const { sections } = currentSchema;

  // 1. Check all fields
  const missingFields = sections.some(({ fields }) =>
      fields.some(field =>
          showField(field, attributeData) &&
          isFieldOrMatrixOrFieldsetMissing(field, attributeData)
      )
  );
  if (missingFields) return true;
  // 2. Check deadline schema required attributes
  if (action === 'changeCurrentPhase' && currentDeadlineSchema) {
    const tmpErrors = checkDeadlineSchemaErrors([], currentDeadlineSchema, attributeData, true);
    if (tmpErrors.length > 0) {
      return true;
    }
  }

  // 3. Check phase confirmations
  if (hasUnconfirmedRequiredConfirmations(attributeData, currentSchema)) {
    return true;
  }

  return false;
}

function checkErrors(errorFields,currentSchema,attributeData) {
  const { sections } = currentSchema
  sections.forEach(({ title,fields }) => {
    fields.forEach(field => {
      // Only validate visible fields
      if (showField(field, attributeData)) {
        // Matrices can contain any kinds of fields, so
        // we must go through them separately
        if (field.type === 'matrix') {
          const { matrix } = field
          matrix.fields.forEach(({ required, name, label }) => {
            if (isFieldMissing(name, required, attributeData)) {
              errorFields.push({"title":"Tämä näkymä","errorSection":title,"errorField":label,"fieldAnchorKey":name})
            }
          })
          // Fieldsets can contain any fields (except matrices)
          // multiple times, so we need to go through them all
        } else if (field.type === 'fieldset') {
          if (hasFieldsetErrors(field.name, field.fieldset_attributes, attributeData)) {
            errorFields.push({"title":"Tämä näkymä","errorSection":title,"errorField":field.label,"fieldAnchorKey":field.name})
          }
        } else if (
          isFieldMissing(
            field.name,
            field.required,
            attributeData,
            field.autofill_readonly
          )
        ) {
          errorFields.push({"title":"Tämä näkymä","errorSection":title,"errorField":field.label,"fieldAnchorKey":field.name})
        }
      }
    })
  })
  return errorFields
}

// Timetable modal required fields checks.
function checkDeadlineSchemaErrors(errorFields, currentDeadlineSchema, attributeData,isEndPhaseCheck) {
  if (!currentDeadlineSchema) return errorFields
  const groupMap = vis_bool_group_map
  let sections = currentDeadlineSchema?.sections || []
  sections.forEach(section => {
    const attrs = section?.attributes || []
    attrs.forEach(attr => {
      if (!attr?.required) return
      const val = findValueFromObject(attributeData, attr.name)
      //Ending phase specific checks
      if (isEndPhaseCheck) {
        // Confirmation fields should only error when their occurrence trigger boolean is active.
        const confirmationPattern = /^vahvista_([a-z_]+)_(esillaolo(?:_alkaa(?:_(pieni|iso))?|_paattyy)?|lautakunnassa)(?:_(\d+))?$/
        const match = attr.name.match(confirmationPattern)
        if (match) {
          let segment = match[1] // e.g. periaatteet, oas, luonnos, ehdotus, kaavaluonnos, kaavaehdotus, tarkistettu_ehdotus
          const typePart = match[2] // esillaolo_alkaa(_pieni|_iso)? | esillaolo_paattyy | lautakunnassa
          const idx = match[4] || '1'
          if (segment === 'kaavaehdotus') segment = 'ehdotus'
          let groupKey = null
          if (typePart.startsWith('esillaolo')) {
            const candidateNahtavilla = `${segment}_nahtavillaolokerta_${idx}`
            if (Object.prototype.hasOwnProperty.call(groupMap, candidateNahtavilla)) {
              groupKey = candidateNahtavilla
            } else {
              groupKey = `${segment}_esillaolokerta_${idx}`
            }
          } else if (typePart === 'lautakunnassa') {
            groupKey = `${segment}_lautakuntakerta_${idx}`
          }
          if (groupKey && Object.prototype.hasOwnProperty.call(groupMap, groupKey)) {
            const triggerBoolName = groupMap[groupKey]
            const active = !triggerBoolName || findValueFromObject(attributeData, triggerBoolName) === true
            if (!active) return // occurrence not enabled => skip confirmation
            if (val !== true) {
              errorFields.push({
                "title": "Aikataulun muokkausnäkymä",
                "errorSection": section.name,
                "errorField": attr.label || attr.name,
                "fieldAnchorKey": attr.name
              })
            }
            return
          }
          // Fall through to generic handling if groupKey not mapped
        }
        const missing = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)
        if (missing) {
          errorFields.push({
            "title": "Aikataulun muokkausnäkymä",
            "errorSection": section.name,
            "errorField": attr.label || attr.name,
            "fieldAnchorKey": attr.name
          })
        }
      } 
      else {
        // document download checks
        const isNumericConfirmation = /^vahvista_.*_\d+$/.test(attr.name)
        if (isNumericConfirmation && attributeData[attr.name] === undefined) return
        const isIndexOneConfirmation = /^vahvista_.*_1$/.test(attr.name)
        const isBaseConfirmation = /^vahvista_/.test(attr.name) && !isNumericConfirmation
        const missing =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0) ||
          ((isIndexOneConfirmation || isBaseConfirmation) && val === false)
        if (missing) {
          errorFields.push({
            "title": "Aikataulun muokkausnäkymä",
            "errorSection": section.name,
            "errorField": attr.label || attr.name,
            "fieldAnchorKey": attr.name
          })
        }
      }
    })
  })
  // Extra aggregate validation for Voimaantulo phase: require at least one of the given keys to have a non-empty string value (these keys are not marked as required)
  if (currentDeadlineSchema?.title === 'Voimaantulo') {
    const requiredKeys = ['tullut_osittain_voimaan_pvm','voimaantulo_pvm','kumottu_pvm','rauennut']
    const hasAny = requiredKeys.some(k => {
      const v = attributeData[k]
      return typeof v === 'string' && v.trim() !== ''
    })
    if (!hasAny) {
      errorFields.push({
        "title": "Aikataulun muokkausnäkymä",
        "errorSection": currentDeadlineSchema.title,
        "errorField": "Voimaantulo: vähintään yksi kenttä (tullut osittain voimaan / voimaantulo / kumottu / rauennut) on täytettävä",
        "fieldAnchorKey": requiredKeys[0]
      })
    }
  }
  return errorFields
}

function getErrorFields(checkDocuments, attributeData, currentSchema, phase, origin, currentDeadlineSchema, isEndPhaseCheck) {
  let errorFields = []
  const phaseName = attributeData.kaavan_vaihe.split(".").pop().replace(/\s/g,'');
  const title = currentSchema.title.replace(/\s/g,'');
    //Check only using currentPhase sections if check checkDocuments is false and do other check when checking document downloads
  if(checkDocuments && currentSchema?.id === phase && currentSchema?.sections && title === phaseName || !checkDocuments && currentSchema?.sections){
    // Go through every single field
    errorFields = checkErrors(errorFields,currentSchema,attributeData)
    // Validate deadline schema required attributes using dedicated helper (phase already scoped)
    if(isEndPhaseCheck){
      //Check only and show required fields from deadlines when trying to change or archive phase
      errorFields = checkDeadlineSchemaErrors(errorFields, currentDeadlineSchema, attributeData,isEndPhaseCheck)
    }
  }
  else if(checkDocuments && currentSchema?.id === phase){
    //Show error for hide download button on document download view if not currently active phase
    errorFields.push("notcurrentphase")
  }
  return errorFields 
}

function isSceduleAccepted(attributeData, currentSchema) {
  let scheduleIsAccepted = []
  if(currentSchema?.sections){
    const { sections } = currentSchema
    const currentPhaseRaw = attributeData?.kaavan_vaihe || '';
    const currentPhaseName = currentPhaseRaw.split('.').pop().trim();
    // Go through every single field
    sections.forEach(({name,attributes }) => {
      const sectionPhaseName = (name || '').split('.').pop().trim();
      if (sectionPhaseName !== currentPhaseName) return;
      if(name === "2. OAS" || name === "3. Ehdotus" || name === "4. Tarkistettu ehdotus" || name === "XL. Periaatteet" || name === "XL. Luonnos"){
        attributes.forEach(field => {
          if (showField(field, attributeData)) {
            if (confirmationAttributes.includes(field.name)) {
              //Only first confirm needs to be checked for acceptance
              const confirmName = field.name
                .replace("_readonly", "")
                .replace(/_\d+$/, '')
              const value = findValueFromObject(attributeData, confirmName)
              if (!value) {
                //increase array size with false value and prevent acceptance
                scheduleIsAccepted.push(field.name)
              }
            }
          }
        })
      }
    })
    
  }
  return scheduleIsAccepted 
}

function hasFieldsetErrors(fieldName, fieldsetAttributes, attributeData) {
  if (
    isFieldsetMissing(fieldName, attributeData, isFieldSetRequired(fieldsetAttributes))
  ) {
    return true
  } else {
    let missingFields = false

    const validFieldSets = getValidFieldsets(attributeData[fieldName])

    validFieldSets.forEach(fieldset => {
      const keys = Object.keys(fieldset)

      if (isRequiredFieldsetFieldMissing(fieldsetAttributes, fieldset)) {
        missingFields = true
      }

      keys.forEach(key => {
        if (key !== '_deleted') {
          const required = isFieldsetFieldRequired(fieldsetAttributes, key)

          if (required) {
            if (fieldset[key] === undefined) {
              missingFields = true
            }
          }
        }
      })
    })
    return missingFields
  }
}
function getValidFieldsets(fieldsets) {
  const validFieldsets = []
  for (let index in fieldsets) {
    if (!fieldsets[index]._deleted) {
      validFieldsets.push(fieldsets[index])
    }
  }
  return validFieldsets
}
function isFieldsetFieldRequired(fieldsetAttributes, name) {
  let required = false

  fieldsetAttributes &&
    fieldsetAttributes.forEach(attribute => {
      if (attribute.name === name) {
        required = attribute.required
      }
    })
  return required
}
function isRequiredFieldsetFieldMissing(fieldsetAttributes, fieldset) {
  let isMissing = false
  const fieldsetKeys = Object.keys(fieldset)
  fieldsetAttributes &&
    fieldsetAttributes.forEach(attribute => {
      if (attribute.required && attribute.type !== 'file') {
        if (!fieldsetKeys.includes(attribute.name)) {
          isMissing = true
        }
      }
    })
  return isMissing
}
const getField = (name, sections) => {
  let returnField = null
  sections.forEach(section => {
    section.fields.some(field => {
      // Field found
      if (field.name === name) {
        returnField = field
        return true
      }

      if (field.fieldset_attributes) {
        field.fieldset_attributes.some(field => {
          if (field.name === name) {
            returnField = field
            return true
          }
          if (field.fieldset_attributes) {
            field.fieldset_attributes.some(field => {
              if (field.name === name) {
                returnField = field
                return true
              }
            })
          }
        })
      }
    })
  })

  return returnField
}

const reduceNonEditableFields = (attributeData, sections) => {
  const keys = Object.keys(attributeData)

  keys &&
    keys.forEach(key => {
      const fieldsetAttributes = attributeData[key]

      checkFieldsetAttributes(fieldsetAttributes, sections)
    })
}

const checkFieldsetAttributes = (fieldsetAttributes, sections) => {
  if (isArray(fieldsetAttributes)) {
    fieldsetAttributes &&
      fieldsetAttributes.forEach(attribute => {
        const subKeys = Object.keys(attribute)

        subKeys &&
          subKeys.forEach(subKey => {
            if (subKey !== '_deleted') {
              const field = getField(subKey, sections)

              if (field && field.type === 'fieldset') {
                checkFieldsetAttributes(attribute[subKey], sections)
              }
              if (field && !field.editable) {
                delete attribute[subKey]
              }
            }
          })
      })
  }
}
//Check if two similar objects values has been changed
const objectsEqual = (o1, o2) => {
  let equal = true
  if(o1 && o2){
    equal = Object.keys(o1).length === Object.keys(o2).length 
    && Object.keys(o1).every(p => o1[p] === o2[p])
  }
  return equal
}

//Find difference in two arrays
const diffArray = (arr1, arr2) => {
  function diff(a, b) {
    return a.filter(item => b.indexOf(item) === -1);
  }

  const diff1 = diff(arr1, arr2)
  const diff2 = diff(arr2, arr1)
  return [].concat(diff1, diff2)
}
//Find difference in array of objects
const diffArrayObject = (array1, array2) => {
  return array1.filter(object1 => {
    return !array2.some(object2 => {
      return object1 === object2;
    })
  })
}

// Returns entries of geoData if they are missing in att_data, or have truthy, non-zero values
// Used so manually entered values don't get overwritten by invalid data from geoserver api (broken atm)
const getMissingGeoData = (attData, geoData) => {
  if (!geoData || typeof geoData !== 'object' || Array.isArray(geoData)){ 
    return {}
  }
  const newGeoData = {}
  for (const [key, value] of Object.entries(geoData)){
    if (!(key in attData) || (value !== attData[key] && value && value !== "0.0")){
      newGeoData[key] = value
    }
  }
  return newGeoData
}


export default {
  confirmationAttributes,
  formatDate,
  formatTime,
  formatDateTime,
  formatUsersName,
  formatDeadlines,
  isFieldMissing,
  sortProjects,
  formatFilterProject,
  formatPhase,
  formatNextDeadline,
  formatSubtype,
  checkDeadline,
  getDefaultValue,
  generateArrayOfYears,
  getFieldsetAttributes,
  findValueFromObject,
  findValuesFromObject,
  generateArrayOfYearsForChart,
  isFieldsetMissing,
  isFieldSetRequired,
  hasFieldsetErrors,
  reduceNonEditableFields,
  getField,
  checkFieldsetAttributes,
  hasMissingFields,
  getErrorFields,
  isSceduleAccepted,
  objectsEqual,
  diffArray,
  diffArrayObject,
  getMissingGeoData
}
