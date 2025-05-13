export function generateConfirmedFields(attributeData, confirmationAttributeNames, phaseNames) {
  const confirmedFields = [];
  const seenPhases = new Set();

  confirmationAttributeNames.forEach((confirmationKey) => {
    if (!attributeData[confirmationKey]) return;

    const rawKey = confirmationKey.replace(/^vahvista_/, '');
    const phase = phaseNames.find((p) => rawKey === p || rawKey.startsWith(p + '_'));
    if (!phase) return;

    const suffixMatch = rawKey.match(/(_\d+)$/);
    const suffix = suffixMatch ? suffixMatch[1] : '';
    const finalSuffix = suffix === '_1' ? '' : suffix;

    const keyWithoutSuffix = suffix ? rawKey.slice(0, -suffix.length) : rawKey;
    const base = keyWithoutSuffix.replace(`${phase}_`, '');

    const parts = base.split('_');
    let group = parts[0];
    let type = parts[1];

    if (parts.length === 1) {
      // Special case like vahvista_periaatteet_lautakunnassa
      const field1 = `milloin_${phase}_${base}${finalSuffix}`;
      const field2 = `${phase}_lautakunta_aineiston_maaraaika${finalSuffix}`;

      confirmedFields.push(field1);
      confirmedFields.push(field2);

      return;
    }

    // Regular case
    const aineisto = `${phase}_${group}_aineiston_maaraaika${finalSuffix}`;
    const alkaa = `milloin_${phase}_${group}_alkaa${finalSuffix}`;
    const paattyy = `milloin_${phase}_${group}_paattyy${finalSuffix}`;
    const mielipiteet = `viimeistaan_mielipiteet_${phase}`;

    [aineisto, alkaa, paattyy].forEach((key) => {
      if (key in attributeData) {
        confirmedFields.push(key);
      }
    });

    if (!seenPhases.has(phase) && mielipiteet in attributeData) {
      confirmedFields.push(mielipiteet);
      seenPhases.add(phase);
    }
  });

  return [...new Set(confirmedFields)];
}