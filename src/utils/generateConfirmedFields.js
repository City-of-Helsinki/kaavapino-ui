function getSpecialCaseFields(phase, base, finalSuffix) {
  return [
    `milloin_${phase}_${base}${finalSuffix}`,
    `${phase}_lautakunta_aineiston_maaraaika${finalSuffix}`,
  ];
}

function getRegularFields(phase, group, finalSuffix, attributeData) {
  const fields = [
    `${phase}_${group}_aineiston_maaraaika${finalSuffix}`,
    `milloin_${phase}_${group}_alkaa${finalSuffix}`,
    `milloin_${phase}_${group}_paattyy${finalSuffix}`,
  ];
  return fields.filter(key => key in attributeData);
}

function addMielipiteetField(confirmedFields, seenPhases, phase, attributeData) {
  const mielipiteet = `viimeistaan_mielipiteet_${phase}`;
  if (!seenPhases.has(phase) && mielipiteet in attributeData) {
    confirmedFields.push(mielipiteet);
    seenPhases.add(phase);
  }
}

export function generateConfirmedFields(attributeData, confirmationAttributeNames, phaseNames) {
  const filteredConfirmationAttributeNames = confirmationAttributeNames.filter(
    key => key.includes('_alkaa') || key.includes('_lautakunnassa')
  );

  const confirmedFields = [];
  const seenPhases = new Set();

  for (const confirmationKey of filteredConfirmationAttributeNames) {
    if (!attributeData[confirmationKey]) continue;

    const rawKey = confirmationKey.replace(/^vahvista_/, '');
    const phase = phaseNames.find((p) => rawKey === p || rawKey.startsWith(p + '_'));
    if (!phase) continue;

    const suffixMatch = rawKey.match(/(_\d+)$/);
    const suffix = suffixMatch ? suffixMatch[1] : '';
    const finalSuffix = suffix === '_1' ? '' : suffix;

    const keyWithoutSuffix = suffix ? rawKey.slice(0, -suffix.length) : rawKey;
    const base = keyWithoutSuffix.replace(`${phase}_`, '');

    const parts = base.split('_');
    const group = parts[0];

    if (parts.length === 1) {
      confirmedFields.push(...getSpecialCaseFields(phase, base, finalSuffix));
      addMielipiteetField(confirmedFields, seenPhases, phase, attributeData);
      continue;
    }

    confirmedFields.push(...getRegularFields(phase, group, finalSuffix, attributeData));
    addMielipiteetField(confirmedFields, seenPhases, phase, attributeData);
  }

  return [...new Set(confirmedFields)];
}