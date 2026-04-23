/**
 * Utility functions for parsing Redux Form field names, especially fieldset fields.
 * 
 * Fieldset fields follow the naming pattern: "fieldsetName[index].fieldName"
 * Example: "muu_ohjelmakytkenta_fieldset[0].ohjelman_nimi"
 */

/**
 * Parses a fieldset field name into its components.
 * 
 * @param {string} fieldName - The full field name (e.g., "fieldset[0].field")
 * @returns {Object|null} Parsed components or null if not a fieldset field
 *   - fieldsetName: The name of the fieldset array (e.g., "fieldset")
 *   - index: The numeric index in the array (e.g., 0)
 *   - fieldName: The name of the field within the fieldset object (e.g., "field")
 * 
 * @example
 * parseFieldsetFieldName("muu_ohjelmakytkenta_fieldset[0].ohjelman_nimi")
 * // Returns: { fieldsetName: "muu_ohjelmakytkenta_fieldset", index: 0, fieldName: "ohjelman_nimi" }
 * 
 * parseFieldsetFieldName("regular_field")
 * // Returns: null
 */
export const parseFieldsetFieldName = (fieldName) => {
  if (!fieldName || typeof fieldName !== 'string') {
    return null;
  }

  const regex = /^(.+)\[(\d+)\]\.(.+)$/;
  const match = regex.exec(fieldName);
  if (!match) {
    return null;
  }

  const [, fieldsetName, index, fieldNamePart] = match;
  return {
    fieldsetName,
    index: Number.parseInt(index, 10),
    fieldName: fieldNamePart
  };
};

/**
 * Checks if a field name represents a fieldset field.
 * 
 * @param {string} fieldName - The field name to check
 * @returns {boolean} True if the field is a fieldset field, false otherwise
 * 
 * @example
 * isFieldsetField("fieldset[0].field") // true
 * isFieldsetField("regular_field")     // false
 */
export const isFieldsetField = (fieldName) => {
  if (!fieldName || typeof fieldName !== 'string') {
    return false;
  }
  return /^.+\[\d+\]\..+$/.test(fieldName);
};

/**
 * Extracts the fieldset prefix from a fieldset field name.
 * The prefix includes the fieldset name and index, but not the field name.
 * 
 * @param {string} fieldName - The full field name
 * @returns {string|null} The fieldset prefix (e.g., "fieldset[0]") or null
 * 
 * @example
 * getFieldsetPrefix("muu_ohjelmakytkenta_fieldset[0].ohjelman_nimi")
 * // Returns: "muu_ohjelmakytkenta_fieldset[0]"
 * 
 * getFieldsetPrefix("regular_field")
 * // Returns: null
 */
export const getFieldsetPrefix = (fieldName) => {
  if (!fieldName || typeof fieldName !== 'string') {
    return null;
  }

  const regex = /^(.*\[\d+\])\./;
  const match = regex.exec(fieldName);
  return match ? match[1] : null;
};

export default {
  parseFieldsetFieldName,
  isFieldsetField,
  getFieldsetPrefix
};
