import projectUtils from './projectUtils'
import { isBoolean } from 'lodash'
import toPlaintext from 'quill-delta-to-plaintext'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../constants'
import { get } from 'lodash'

/* Field returns info whether field given as a parameter should be shown or not.
 *
 *  Autofill_rule has variables property which is meant to add a value from form to
 *  rule. Now it is only implemented if type is boolean and expected return value is string.
 *  Eq. "Kaavan nimi"-rule which has project name at the beginning and "asemakaava" or "asemakaava ja asemakaavan muuttaminen"
 */
export const getFieldAutofillValue = (
  autofill_rule,
  formValues,
  fieldName,
  callerFormName
) => {
  let returnValue
  let projectNameAdded = false

  const EQUAL = '=='
  const NOT_EQUAL = '!='
  const TRUE_STRING = 'True'
  const FALSE_STRING = 'False'
  const BIGGER_THAN = '>'

  if (autofill_rule && autofill_rule.length > 0) {
    for (let index in autofill_rule) {
      const autofill = autofill_rule[index]
      const condition = autofill.condition
      const thenBranch = autofill.then_branch
      const conditions = autofill.conditions

      if (conditions && conditions.length > 0) {
        const extraVariables = autofill.variables
        const conditions = autofill.conditions

        const lastIndex = fieldName ? fieldName.lastIndexOf('.') : -1
        const fieldNameFieldsetPart = fieldName ? fieldName.substring(0, lastIndex) : ''

        let formExtraValue

          if (extraVariables && extraVariables[0]) {
            // Check first if value is not inside fieldset
            formExtraValue = formValues[extraVariables[0]]

            if (formExtraValue === undefined) {
              formExtraValue = projectUtils.findValueFromObject(
                formValues,
                extraVariables[0]
              )

              if (formExtraValue === undefined) {
                formExtraValue = get(
                  formValues,
                  `${fieldNameFieldsetPart}${extraVariables[0]}`
                )
              }
            }
          }

          if (formExtraValue === undefined || formExtraValue === null) {
            formExtraValue = ''
          }

        let results = []
        if (conditions && conditions.length > 0) {
          

          results = []
          let notFoundValues = 0

          for (let conditionIndex in conditions) {
            const condition = conditions[conditionIndex]

            const variable = condition.variable
            const operator = condition.operator
            const comparisonValue = condition.comparison_value
            const comparisonValueType = condition.comparison_value_type

            const lastIndex = fieldName ? fieldName.lastIndexOf('.') : -1
            const fieldNameFieldsetPart = fieldName
              ? fieldName.substring(0, lastIndex)
              : ''

            let formValue = projectUtils.findValueFromObject(formValues, variable)

            if (fieldNameFieldsetPart) {
              formValue = get(formValues, `${fieldNameFieldsetPart}.${variable}`)
            }

            // Special case to check "Aloituspäivä" for timetable modal
            if (callerFormName === EDIT_PROJECT_TIMETABLE_FORM) {
              formValue =
                formValues[variable] === undefined
                  ? projectUtils.findValueFromObject(formValues, variable)
                  : formValues[variable]

              // Now only one variable is expected
              formExtraValue = extraVariables
                ? projectUtils.findValueFromObject(formValues, extraVariables[0])
                : ''
            }

            // List rule
            if (comparisonValueType === 'list<string>') {
              if (formValue === undefined || formValue === null) {
                notFoundValues++
              }
              if (comparisonValue.includes(formValue)) {
                results.push(comparisonValue.includes(formValue))
              }
            }
            // Boolean type
            if (comparisonValueType === 'boolean') {
              let realValue = false

              if (formValue === undefined || formValue === null) {
                notFoundValues++
              }

              // First check if formValue is quill delta format or normal value
              if (formValue && formValue.ops) {
                const richTextValue =
                  formValue && formValue.ops
                    ? toPlaintext(formValue.ops).trim()
                    : undefined
                realValue = richTextValue && richTextValue.trim() !== '' ? true : false
              } else {
                if (!isBoolean(formValue)) {
                  realValue = !formValue ? false : true
                } else {
                  realValue = formValue ? formValue === true : false
                }
              }

              if (operator === EQUAL) {
                const value = comparisonValue === realValue
                results.push(value)
              }
              if (operator === NOT_EQUAL) {
                const value = comparisonValue !== realValue
                results.push(value)
              }
            }
            if (comparisonValueType === 'number' || comparisonValueType === 'string') {
              if (formValue === undefined || formValue === null) {
                notFoundValues++
              }
              if (operator === EQUAL) {
                results.push(comparisonValue === formValue)
              }
              if (operator === NOT_EQUAL) {
                results.push(comparisonValue !== formValue)
              }
              if (operator === BIGGER_THAN && formValue > comparisonValue) {
                results.push(formValue > comparisonValue)
              }
            }
          }
           
          if (!results.includes(false) ) {
            return formExtraValue + thenBranch
          }

          

          if (notFoundValues == conditions.length ) {
            return formExtraValue
          }

         
        }
        
      } else {
        if (!condition) {
          continue
        }
        const variable = condition.variable
        const operator = condition.operator
        const comparisonValue = condition.comparison_value
        const comparisonValueType = condition.comparison_value_type
        const extraVariables = autofill.variables

        const lastIndex = fieldName ? fieldName.lastIndexOf('.') : -1
        const fieldNameFieldsetPart = fieldName ? fieldName.substring(0, lastIndex) : ''
        let formValue = projectUtils.findValueFromObject(formValues, variable)

        if (fieldNameFieldsetPart) {
          formValue = get(formValues, `${fieldNameFieldsetPart}.${variable}`)
        }
        let formExtraValue
        if (extraVariables && extraVariables[0]) {
          // Check first if value is not inside fieldset
          formExtraValue = formValues[extraVariables[0]]

          if (formExtraValue === undefined) {
            formExtraValue = projectUtils.findValueFromObject(
              formValues,
              extraVariables[0]
            )

            if (formExtraValue === undefined) {
              formExtraValue = get(
                formValues,
                `${fieldNameFieldsetPart}${extraVariables[0]}`
              )
            }
          }
        }

        if (formExtraValue === undefined || formExtraValue === null) {
          formExtraValue = ''
        }
        // Special case to check "Aloituspäivä" for timetable modal
        if (callerFormName === EDIT_PROJECT_TIMETABLE_FORM) {
          formValue =
            formValues[variable] === undefined
              ? projectUtils.findValueFromObject(formValues, variable)
              : formValues[variable]

          // Now only one variable is expected
          formExtraValue = extraVariables
            ? projectUtils.findValueFromObject(formValues, extraVariables[0])
            : ''
          
          if (formExtraValue?.ops && formValue?.ops) {
            formExtraValue = toPlaintext(formValue.ops).trim()
          }
        }

        // List rule
        if (comparisonValueType === 'list<string>') {
          if (comparisonValue.includes(formValue)) {
            if (thenBranch === TRUE_STRING) {
              returnValue = true
              continue
            }
            if (thenBranch === FALSE_STRING) {
              returnValue = false
              continue
            }
            returnValue = thenBranch
            break
          }
        }
        // Boolean type
        if (comparisonValueType === 'boolean') {
          let realValue = false

          // First check if formValue is quill delta format or normal value
          if (formValue && formValue.ops) {
            const richTextValue =
              formValue && formValue.ops ? toPlaintext(formValue.ops).trim() : undefined
            realValue = richTextValue && richTextValue.trim() !== '' ? true : false
          } else {
            if (!isBoolean(formValue)) {
              realValue = !formValue ? false : true
            } else {
              realValue = formValue ? formValue === true : false
            }
          }

          if (operator === EQUAL && comparisonValue === realValue) {
            if (thenBranch === TRUE_STRING) {
              returnValue = true
              break
            } else if (thenBranch === FALSE_STRING) {
              returnValue = false
              continue
            } else if (thenBranch === '' && !formExtraValue) {
              returnValue = true
              break
            } else {
              if (returnValue) {
                if (formExtraValue && !projectNameAdded) {
                  returnValue = `${formExtraValue} ${returnValue} ${thenBranch}`
                  projectNameAdded = true
                } else {
                  returnValue = `${returnValue} ${thenBranch}`
                }
              } else {
                if (!projectNameAdded) {
                  if (thenBranch && thenBranch !== '') {
                    if (callerFormName === EDIT_PROJECT_TIMETABLE_FORM){
                      // Dirty hack, but so is the rest of this entire file
                      returnValue = `${formExtraValue}`
                    } else {
                      returnValue = `${formExtraValue} ${thenBranch}`
                    }
                  } else {
                    returnValue = formExtraValue
                  }
                  projectNameAdded = true
                } else {
                  returnValue = thenBranch
                }
              }
            }
          } else {
            if (extraVariables && !projectNameAdded) {
              returnValue = formExtraValue
              projectNameAdded = true
            }
            if (thenBranch === '' && !extraVariables) {
              returnValue = false
            }
          }
          if (operator === NOT_EQUAL && comparisonValue !== realValue) {
            if (thenBranch === TRUE_STRING) {
              returnValue = true
              continue
            } else if (thenBranch === FALSE_STRING) {
              returnValue = false
              continue
            } else {
              if (returnValue) {
                returnValue = `${returnValue} ${thenBranch}`
              } else {
                returnValue = thenBranch
              }
            }
          }
        }
        if (comparisonValueType === 'number' || comparisonValueType === 'string') {
          const thenFormValue =
            formValues[thenBranch] === undefined
              ? projectUtils.findValueFromObject(formValues, thenBranch)
              : formValues[thenBranch]
          if (
            !formValue &&
            formValue !== false &&
            formValue !== '' &&
            comparisonValueType === 'number'
          ) {
            returnValue = false
            continue
          }

          if (operator === EQUAL && comparisonValue === formValue) {
            returnValue = thenFormValue || thenBranch
            continue
          }
          if (operator === NOT_EQUAL && comparisonValue !== formValue) {
            returnValue = thenFormValue || thenBranch
            continue
          }
          if (operator === BIGGER_THAN && formValue > comparisonValue) {
            if (thenBranch === 'True') {
              returnValue = true
            } else {
              returnValue = thenFormValue || thenBranch
            }
            break
          }
          if (operator === BIGGER_THAN && formValue <= comparisonValue) {
            returnValue = false
            continue
          }
        }
      }
    }
  }

  return returnValue
}
