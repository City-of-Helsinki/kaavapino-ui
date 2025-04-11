/**
 * Generate list of confirmed_fields for a project based on 'vahvista_*' flags
 * and known phase names. This ensures the backend will not overwrite
 * already-locked fields during deadline calculation.
 *
 * @param {Object} attributeData - The project's attribute_data object.
 * @param {string[]} confirmationAttributeNames - List of all 'vahvista_*' flags.
 * @param {string[]} phaseNames - Valid phase identifiers (e.g. 'periaatteet', 'luonnos').
 * @returns {string[]} - Unique list of attribute keys to mark as confirmed.
 */
export function generateConfirmedFields(attributeData, confirmationAttributeNames, phaseNames) {
  const confirmedFields = [];

  confirmationAttributeNames.forEach((confirmationKey) => {
    if (!attributeData[confirmationKey]) return;

    const rawKey = confirmationKey.replace(/^vahvista_/, '');

    const matchedPhases = phaseNames.filter((phase) =>
      rawKey.startsWith(phase + '_') || rawKey === phase
    );

    const matchingKeys = Object.keys(attributeData).filter((key) =>
      matchedPhases.some((phase) =>
        key.startsWith(phase + '_') || key === phase
      )
    );

    confirmedFields.push(...matchingKeys);
  });

  return [...new Set(confirmedFields)];
}