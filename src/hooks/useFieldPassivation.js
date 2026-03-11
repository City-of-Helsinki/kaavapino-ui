import { useSelector } from 'react-redux'
import { formErrorListSelector, connectionErrorFieldsSelector } from '@/selectors/projectSelector'
import { networkSelector } from '@/selectors/networkSelector'

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
 * @param {boolean} hasNetworkError - Whether the network is currently down (passivates all fields)
 * @returns {boolean} - True if the field should be disabled due to errors in other fields
 */
export const shouldPassivateField = (fieldName, formErrors = [], connectionErrorFields = [], includeConnectionErrors = true, hasNetworkError = false) => {
  // If network is down, passivate ALL fields to prevent editing
  if (hasNetworkError) {
    return true
  }
  
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
 * IMPORTANT: Field passivation only applies to the main project edit form (editProjectForm).
 * Other forms like new project creation should not use passivation.
 * 
 * @param {string} fieldName - The name of the field to check for passivation
 * @param {Object} options - Optional configuration
 * @param {boolean} options.includeConnectionErrors - Whether to consider connection errors (default: true)
 * @param {string} options.formName - The name of the form (from redux-form meta.form)
 * @returns {boolean} - True if the field should be disabled due to errors in other fields
 * 
 * @example
 * // Full passivation (validation + connection errors) - only in editProjectForm
 * const shouldDisable = useFieldPassivation(input.name, { formName: meta.form })
 * 
 * @example
 * // Only validation errors (for simple fields)
 * const shouldDisable = useFieldPassivation(name, { includeConnectionErrors: false, formName: meta.form })
 */
export const useFieldPassivation = (fieldName, options = {}) => {
  const { includeConnectionErrors = true, formName } = options
  
  // Only apply passivation to the main project edit form
  const ALLOWED_FORMS = ['editProjectForm'];
  const isAllowedForm = formName && ALLOWED_FORMS.includes(formName);
  
  const formErrors = useSelector(formErrorListSelector) || []
  const connectionErrorFields = useSelector(connectionErrorFieldsSelector) || []
  const network = useSelector(networkSelector)
  
  // If not in an allowed form, never passivate
  if (!isAllowedForm) {
    return false;
  }
  
  // Check if network is down (status='error' means network error, hasError is derived flag)
  const hasNetworkError = network?.status === 'error'
  
  const shouldPassivate = shouldPassivateField(fieldName, formErrors, connectionErrorFields, includeConnectionErrors, hasNetworkError)
  
  return shouldPassivate
}
