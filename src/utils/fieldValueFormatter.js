/**
 * Utility functions for handling field values in error notifications and display contexts
 */

/**
 * Extracts and formats values from a fieldset object array.
 * Handles Quill Delta format (.ops arrays) and returns formatted string array.
 * 
 * Used internally by formatFieldValue() for fieldset-specific data extraction.
 * 
 * @param {Array<Object>} fieldsetArray - Array of fieldset objects
 * @returns {Object} { withLabels: Array<string>, valuesOnly: Array<string> }
 *   - withLabels: Formatted array with "fieldset-1", "name: value" labels
 *   - valuesOnly: Just the actual field values for copying
 * 
 * @example
 * // Input: [{ name: { ops: [{ insert: "John" }] }, age: { ops: [{ insert: "30" }] } }]
 * // Output: { 
 * //   withLabels: ["fieldset-1", "name: John", "fieldset-2", "age: 30"],
 * //   valuesOnly: ["John", "30"]
 * // }
 * 
 * @private
 */
const extractFieldsetObjectEntries = (fieldsetObject, startIndex) => {
  const withLabels = [];
  const valuesOnly = [];
  let index = startIndex;

  for (const fieldName in fieldsetObject) {
    if (!Object.hasOwn(fieldsetObject, fieldName)) continue;
    const fieldValue = fieldsetObject[fieldName];
    if (!fieldValue?.ops || !Array.isArray(fieldValue.ops)) continue;
    for (const op of fieldValue.ops) {
      if (op.insert) {
        withLabels.push(`fieldset-${index}`, `${fieldName}: ${op.insert}`);
        valuesOnly.push(op.insert);
        index++;
      }
    }
  }

  return { withLabels, valuesOnly, index };
};

const extractFieldSetValues = (fieldsetArray) => {
  if (!Array.isArray(fieldsetArray)) {
    return { withLabels: [], valuesOnly: [] };
  }

  const arrayValues = [];
  const valuesOnly = [];
  let index = 1;

  for (const fieldsetObject of fieldsetArray) {
    if (!fieldsetObject || typeof fieldsetObject !== 'object') continue;
    const result = extractFieldsetObjectEntries(fieldsetObject, index);
    arrayValues.push(...result.withLabels);
    valuesOnly.push(...result.valuesOnly);
    index = result.index;
  }

  return { withLabels: arrayValues, valuesOnly };
};

/**
 * Formats field value for display in error notifications and UI messages.
 * Handles multiple data formats: Quill Delta, fieldsets, booleans, and primitives.
 * 
 * This is the main public API for formatting any field value from the form.
 * Used when displaying error messages, copying field contents, etc.
 * 
 * @param {any} fieldValue - The field value to format (can be any type)
 * @returns {Object} { text: string, copyText: string }
 *   - text: Human-readable text for display in UI
 *   - copyText: Clean text for clipboard (values only, no labels)
 * 
 * @example
 * formatFieldValue([{ ops: [{ insert: "Hello" }] }])
 * // Returns: { text: "Hello", copyText: "Hello" }
 * 
 * formatFieldValue(true)
 * // Returns: { text: "Kyllä", copyText: "Kyllä" }
 * 
 * formatFieldValue([{ name: { ops: [{ insert: "John" }] } }])
 * // Returns: { text: "fieldset-1 name: John", copyText: "John" }
 */
const formatArrayValue = (fieldValue) => {
  const firstItem = fieldValue[0];
  if (firstItem?.ops && Array.isArray(firstItem.ops)) {
    const text = firstItem.ops.filter(op => op?.insert).map(op => op.insert).join('');
    return { text, copyText: text };
  }
  if (typeof firstItem === 'object' && firstItem !== null) {
    const { withLabels, valuesOnly } = extractFieldSetValues(fieldValue);
    return { text: withLabels.join(' '), copyText: valuesOnly.join('\n') };
  }
  const text = fieldValue.join(', ');
  return { text, copyText: text };
};

const normalizeBooleanAndEmpty = (text, copyText) => {
  if (text === 'true' || text === 'false') {
    const normalized = text === 'true' ? 'Kyllä' : 'Ei';
    return { text: normalized, copyText: normalized };
  }
  if (text === '' || text === 'undefined' || text === 'null') {
    return { text: 'Tieto puuttuu', copyText: '' };
  }
  return { text, copyText };
};

export const formatFieldValue = (fieldValue) => {
  if (!fieldValue) {
    return { text: 'Tieto puuttuu', copyText: '' };
  }

  let text = '';
  let copyText = '';

  if (Array.isArray(fieldValue) && fieldValue.length > 0) {
    ({ text, copyText } = formatArrayValue(fieldValue));
  } else {
    text = String(fieldValue);
    copyText = text;
  }

  return normalizeBooleanAndEmpty(text, copyText);
};

export default {
  formatFieldValue,
  extractFieldSetValues,
};
