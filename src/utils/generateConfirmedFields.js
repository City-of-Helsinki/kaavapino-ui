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
      rawKey.includes(phase)
    );

    const extendedPatterns = [...matchedPhases];

    if (rawKey.includes('lautakunnassa')) {
      extendedPatterns.push('lautakunta');
    }

    // Only include attribute keys that:
    //   - match the phase
    //   - AND are likely a deadline field (string date)
    const matchingKeys = Object.entries(attributeData)
      .filter(([key, value]) =>
        typeof value === 'string' && extendedPatterns.some(p => key.includes(p))
      )
      .map(([key]) => key);

    confirmedFields.push(...matchingKeys);
  });

  return [...new Set(confirmedFields)];
}