import { isDeadlineConfirmed } from './projectVisibilityUtils';

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