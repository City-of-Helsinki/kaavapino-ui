/**
 * Dispatch decision logic for timeline updates
 * 
 * Extracted from EditProjectTimetableModal.componentDidUpdate for testability.
 * Determines if updateDateTimeline should be dispatched based on form value changes.
 * 
 * @param {Array} newObjectArray - Array of differences from findDifferencesInObjects
 * @param {boolean} validatingStarted - Whether validation is currently in progress
 * @param {boolean} isGroupAdd - Whether a group is being added (visibility bool changed to true)
 * @returns {{ shouldDispatch: boolean, addingNew: boolean }} - Whether to dispatch and if it's a new add
 */
export function shouldDispatchTimelineUpdate(newObjectArray, validatingStarted, isGroupAdd = false) {
  // No differences to process
  if (newObjectArray.length === 0) {
    return { shouldDispatch: false, addingNew: false, reason: 'empty_array' };
  }

  // Skip if validation is in progress (prevents cascade loops)
  if (validatingStarted) {
    return { shouldDispatch: false, addingNew: false, reason: 'validating' };
  }

  // Skip confirmation field changes
  if (newObjectArray[0]?.key?.includes("vahvista")) {
    return { shouldDispatch: false, addingNew: false, reason: 'confirmation_field' };
  }

  // If this is a group add, always dispatch with addingNew=true (handles re-add scenarios)
  if (isGroupAdd) {
    return { shouldDispatch: true, addingNew: true, reason: 'group_add' };
  }

  const obj1 = newObjectArray[0]?.obj1;
  const obj2 = newObjectArray[0]?.obj2;

  // Both undefined - this is the buggy "no dispatch" case for re-adds
  // Without isGroupAdd check above, this incorrectly triggers for re-adds with old dates
  if (typeof obj1 === "undefined" && typeof obj2 === "undefined") {
    return { shouldDispatch: false, addingNew: false, reason: 'both_undefined' };
  }

  // New value being added (obj1 undefined, obj2 is string)
  if (typeof obj1 === "undefined" && typeof obj2 === "string") {
    return { shouldDispatch: true, addingNew: true, reason: 'new_value' };
  }

  // Check second object too (for multi-field changes)
  if (newObjectArray[1] && typeof newObjectArray[1]?.obj1 === "undefined" && typeof newObjectArray[1]?.obj2 === "string") {
    return { shouldDispatch: true, addingNew: true, reason: 'new_value_second' };
  }

  // Date modification (both exist and differ)
  if (typeof obj1 === "string" && typeof obj2 === "string" && obj1 !== obj2) {
    return { shouldDispatch: true, addingNew: false, reason: 'date_modified' };
  }

  // Default: no dispatch
  return { shouldDispatch: false, addingNew: false, reason: 'no_match' };
}

/**
 * CURRENT BUGGY LOGIC (for comparison in tests)
 * This replicates the exact condition at EditProjectTimetableModal line 172-182
 */
export function shouldDispatchTimelineUpdateBuggy(newObjectArray, validatingStarted, isGroupAdd = false) {
  // Current buggy condition - IGNORES isGroupAdd
  if (
    newObjectArray.length === 0 || 
    (typeof newObjectArray[0]?.obj1 === "undefined" && typeof newObjectArray[0]?.obj2 === "undefined") ||
    newObjectArray[0]?.key?.includes("vahvista") || 
    validatingStarted
  ) {
    return { shouldDispatch: false, addingNew: false, reason: 'no_dispatch_branch' };
  } 
  else if (
    (typeof newObjectArray[0]?.obj1 === "undefined" && typeof newObjectArray[0]?.obj2 === "string") || 
    (newObjectArray[1] && typeof newObjectArray[1]?.obj1 === "undefined" && typeof newObjectArray[1]?.obj2 === "string")
  ) {
    return { shouldDispatch: true, addingNew: true, reason: 'adding_new' };
  }
  
  // Fall through - no dispatch (THIS IS THE BUG for re-add with old dates!)
  return { shouldDispatch: false, addingNew: false, reason: 'fall_through' };
}
