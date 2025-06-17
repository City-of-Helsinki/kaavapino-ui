import { isArray } from 'lodash'
import { showField } from './projectVisibilityUtils'

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
    if (currentKey === key) {
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

function hasMissingFields(attributeData, currentProject, schema) {
    const currentSchema = schema.phases.find(s => s.id === currentProject.phase)
    const { sections } = currentSchema
    let missingFields = false
    // Go through every single field
    sections.forEach(({ fields }) => {
      fields.forEach(field => {
        // Only validate visible fields
        if (showField(field, attributeData)) {
          // Matrices can contain any kinds of fields, so
          // we must go through them separately
          if (field.type === 'matrix') {
            const { matrix } = field
            matrix.fields.forEach(({ required, name }) => {
              if (isFieldMissing(name, required, attributeData)) {
                missingFields = true
              }
            })

            // Fieldsets can contain any fields (except matrices)
            // multiple times, so we need to go through them all
          } else if (field.type === 'fieldset') {
            if (hasFieldsetErrors(field.name, field.fieldset_attributes, attributeData)) {
              missingFields = true
            }
          } else if (
            isFieldMissing(
              field.name,
              field.required,
              attributeData,
              field.autofill_readonly
            )
          ) {
            missingFields = true
          }
        }
      })
    })
    return missingFields 
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
              errorFields.push({"errorSection":title,"errorField":label,"fieldAnchorKey":name})
            }
          })
          // Fieldsets can contain any fields (except matrices)
          // multiple times, so we need to go through them all
        } else if (field.type === 'fieldset') {
          if (hasFieldsetErrors(field.name, field.fieldset_attributes, attributeData)) {
            errorFields.push({"errorSection":title,"errorField":field.label,"fieldAnchorKey":field.name})
          }
        } else if (
          isFieldMissing(
            field.name,
            field.required,
            attributeData,
            field.autofill_readonly
          )
        ) {
          errorFields.push({"errorSection":title,"errorField":field.label,"fieldAnchorKey":field.name})
        }
      }
    })
  })
  return errorFields
}

function getErrorFields(checkDocuments, attributeData, currentSchema, phase) {
  let errorFields = []
  const phaseName = attributeData.kaavan_vaihe.split(".").pop().replace(/\s/g,'');
  const title = currentSchema.title.replace(/\s/g,'');
    //Check only using currentPhase sections if check checkDocuments is false and do other check when checking document downloads
  if(checkDocuments && currentSchema?.id === phase && currentSchema?.sections && title === phaseName || !checkDocuments && currentSchema?.sections){
    // Go through every single field
    errorFields = checkErrors(errorFields,currentSchema,attributeData)
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
    // Go through every single field
    sections.forEach(({name,attributes }) => {
      if(name === "2. OAS" || name === "3. Ehdotus" || name === "4. Tarkistettu ehdotus" || name === "XL. Periaatteet" || name === "XL. Luonnos"){
        attributes.forEach(field => {
          if (showField(field, attributeData)) {
            if (confirmationAttributes.includes(field.name)) {
              const confirmName = field.name.replace("_readonly", "")
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
