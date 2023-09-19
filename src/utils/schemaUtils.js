function getAllFields(schemaPhases, deadlineSections, floorAreaSections, includeNameAndLabelOnly) {
  const referenceFields = []

  schemaPhases.forEach(({ sections }) =>
    sections.forEach(({ fields }) => {
      fields.forEach(field => {

        referenceFields.push( getValue( field, includeNameAndLabelOnly))
       

        if (field.fieldset_attributes) {
          field.fieldset_attributes.forEach(attribute => {
            referenceFields.push(getValue( attribute, includeNameAndLabelOnly))

            if (attribute.fieldset_attributes) {
              attribute.fieldset_attributes.forEach(attribute => {
                referenceFields.push(getValue( attribute, includeNameAndLabelOnly))
              })
            }
          })
        }
      })
    })
  )
  deadlineSections.forEach(({ sections }) => {
    sections.forEach(({ attributes }) => {
      attributes.forEach(field => {
        referenceFields.push(getValue( field, includeNameAndLabelOnly))
      })
    })
  })
  floorAreaSections.forEach(({ fields }) => {
    fields.forEach(({ matrix }) => {
      if (matrix) {
        matrix.fields.forEach(field => {
          referenceFields.push(getValue( field, includeNameAndLabelOnly))
        })
      }
    })
  })

  return referenceFields
}
function getValue( field, includeNameAndLabelOnly ) {
    if ( includeNameAndLabelOnly ) {
        return {name: field.name, label: field.label }
    }
    return field
}

function getSelectedPhase (location,selectedPhase) {
  let checkedSelectedPhase = selectedPhase
  const search = location
  const params = new URLSearchParams(search)

  if (params.get('phase')) {
    checkedSelectedPhase = +params.get('phase')
  }
  return checkedSelectedPhase
}

export default {
  getAllFields,
  getSelectedPhase
}
