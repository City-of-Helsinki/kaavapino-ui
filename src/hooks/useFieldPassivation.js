import { useSelector } from 'react-redux'
import { formErrorListSelector, connectionErrorFieldsSelector } from '@/selectors/projectSelector'

/**
 * Determines if a field should be passivated (disabled) due to errors in other fields.
 * 
 * According to UX60.2.5 specification: When validation errors or connection errors exist in the form,
 * all fields EXCEPT the one(s) with errors should be passivated (disabled) to guide user focus
 * to fix the errors first.
 * 
 * @param {string} fieldName - The name of the field to check for passivation
 * @param {Array<string>} formErrors - List of field names with validation errors
 * @param {Array<string>} connectionErrorFields - List of field names with connection errors
 * @param {boolean} includeConnectionErrors - Whether to consider connection errors (default: true)
 * @returns {boolean} - True if the field should be disabled due to errors in other fields
 */
export const shouldPassivateField = (fieldName, formErrors = [], connectionErrorFields = [], includeConnectionErrors = true) => {
  // Check if other fields have validation errors (not this field)
  const hasOtherFieldErrors = formErrors.length > 0 && !formErrors.includes(fieldName)
  
  if (!includeConnectionErrors) {
    return hasOtherFieldErrors
  }
  
  // Check if other fields have connection errors (not this field)
  const hasOtherConnectionErrors = connectionErrorFields.length > 0 && !connectionErrorFields.includes(fieldName)
  
  return hasOtherFieldErrors || hasOtherConnectionErrors
}

/**
 * Custom hook to determine if a field should be passivated (disabled) due to errors in other fields.
 * 
 * According to UX60.2.5 specification: When validation errors or connection errors exist in the form,
 * all fields EXCEPT the one(s) with errors should be passivated (disabled) to guide user focus
 * to fix the errors first.
 * 
 * @param {string} fieldName - The name of the field to check for passivation
 * @param {Object} options - Optional configuration
 * @param {boolean} options.includeConnectionErrors - Whether to consider connection errors (default: true)
 * @returns {boolean} - True if the field should be disabled due to errors in other fields
 * 
 * @example
 * // Full passivation (validation + connection errors)
 * const shouldDisable = useFieldPassivation(input.name)
 * 
 * @example
 * // Only validation errors (for simple fields)
 * const shouldDisable = useFieldPassivation(name, { includeConnectionErrors: false })
 */
export const useFieldPassivation = (fieldName, options = {}) => {
  const { includeConnectionErrors = true } = options
  
  const formErrors = useSelector(formErrorListSelector) || []
  const connectionErrorFields = useSelector(connectionErrorFieldsSelector) || []
  
  const shouldPassivate = shouldPassivateField(fieldName, formErrors, connectionErrorFields, includeConnectionErrors)
  
  return shouldPassivate
}
