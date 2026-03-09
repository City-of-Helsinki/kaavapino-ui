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
const extractFieldSetValues = (fieldsetArray) => {
  if (!Array.isArray(fieldsetArray)) {
    return { withLabels: [], valuesOnly: [] };
  }

  const arrayValues = [];
  const valuesOnly = [];
  let index = 1;

  for (const fieldsetObject of fieldsetArray) {
    // Skip non-object entries
    if (!fieldsetObject || typeof fieldsetObject !== 'object') {
      continue;
    }

    for (const fieldName in fieldsetObject) {
      if (!Object.hasOwn(fieldsetObject, fieldName)) {
        continue;
      }

      const fieldValue = fieldsetObject[fieldName];

      // Handle Quill Delta format (rich text editor)
      if (fieldValue?.ops && Array.isArray(fieldValue.ops)) {
        for (const op of fieldValue.ops) {
          if (op.insert) {
            arrayValues.push(`fieldset-${index}`, `${fieldName}: ${op.insert}`);
            valuesOnly.push(op.insert);
            index++;
          }
        }
      }
    }
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
export const formatFieldValue = (fieldValue) => {
  let arrayValues = [];
  let textValue = '';
  let copyText = '';

  if (!fieldValue) {
    return { text: 'Tieto puuttuu', copyText: '' };
  }

  // Handle array values
  if (Array.isArray(fieldValue) && fieldValue.length > 0) {
    const firstItem = fieldValue[0];

    // Case 1: Quill Delta format (rich text)
    if (firstItem?.ops && Array.isArray(firstItem.ops)) {
      for (const op of firstItem.ops) {
        if (op?.insert) {
          arrayValues.push(op.insert);
        }
      }
      textValue = arrayValues.join('');
      copyText = textValue;
    }
    // Case 2: Fieldset format (nested objects)
    else if (typeof firstItem === 'object' && firstItem !== null) {
      const { withLabels, valuesOnly } = extractFieldSetValues(fieldValue);
      textValue = withLabels.join(' ');
      copyText = valuesOnly.join('\n'); // Copy only the actual values, not labels
    }
    // Case 3: Simple array
    else {
      textValue = fieldValue.join(', ');
      copyText = textValue;
    }
  }
  // Handle primitive values
  else {
    textValue = String(fieldValue);
    copyText = textValue;
  }

  // Handle boolean values
  if (textValue.includes('true') || textValue.includes('false')) {
    textValue = textValue === 'true' ? 'Kyllä' : 'Ei';
    copyText = textValue;
  }

  // Handle empty values
  if (textValue === '' || textValue === 'undefined' || textValue === 'null') {
    textValue = 'Tieto puuttuu';
    copyText = '';
  }

  return { text: textValue, copyText };
};

// Legacy exports for backward compatibility (if needed)
export const getFieldSetValues = extractFieldSetValues;
export const formatErrorValue = formatFieldValue;

export default {
  formatFieldValue,
  extractFieldSetValues,
  // Legacy names (deprecated)
  getFieldSetValues: extractFieldSetValues,
  formatErrorValue: formatFieldValue
};
