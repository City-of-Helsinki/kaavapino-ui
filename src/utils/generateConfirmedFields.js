import { isDeadlineConfirmed } from './projectVisibilityUtils';

/**
 * Generate a list of field names that have been confirmed (vahvistettu)
 * Uses the existing isDeadlineConfirmed utility to check confirmation status
 * @param {Object} attributeData - Project attribute data
 * @param {Array} deadlines - Array of deadline objects from project
 * @returns {Array} - Array of confirmed field names
 */
export function generateConfirmedFields(attributeData, deadlines) {
  const confirmedFields = [];
  
  for (const dl_object of deadlines) {
    const deadline = dl_object.deadline;
    if (deadline.deadlinegroup && isDeadlineConfirmed(attributeData, deadline.deadlinegroup)) {
      confirmedFields.push(deadline.attribute);
    }
  }
  
  return confirmedFields;
}