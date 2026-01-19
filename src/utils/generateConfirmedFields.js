export function generateConfirmedFields(attributeData, confirmationAttributeNames, phaseNames) {
  const confirmedFields = [];
  const seenPhases = new Set();
  // Track if first esillaolo (no suffix or _1) is confirmed for each phase
  const firstEsillaoloConfirmedPhases = new Set();

  // Phase name to phase START boundary field mapping
  // Note: Only START is protected - END must remain flexible for adding more esilläolos
  const phaseStartMap = {
    'periaatteet': 'periaatteetvaihe_alkaa_pvm',
    'oas': 'oasvaihe_alkaa_pvm',
    'luonnos': 'luonnosvaihe_alkaa_pvm',
    'ehdotus': 'ehdotusvaihe_alkaa_pvm',
    'tarkistettu_ehdotus': 'tarkistettuehdotusvaihe_alkaa_pvm',
  };

  confirmationAttributeNames.forEach((confirmationKey) => {
    if (!attributeData[confirmationKey]) return;

    const rawKey = confirmationKey.replace(/^vahvista_/, '');
    const phase = phaseNames.find((p) => rawKey === p || rawKey.startsWith(p + '_'));
    if (!phase) return;

    const suffixMatch = rawKey.match(/(_\d+)$/);
    const suffix = suffixMatch ? suffixMatch[1] : '';
    const finalSuffix = suffix === '_1' ? '' : suffix;

    // Check if this is the first esillaolo (no suffix or _1 suffix)
    const isFirstEsillaolo = !suffix || suffix === '_1';
    if (isFirstEsillaolo && phaseStartMap[phase]) {
      firstEsillaoloConfirmedPhases.add(phase);
    }

    const keyWithoutSuffix = suffix ? rawKey.slice(0, -suffix.length) : rawKey;
    const base = keyWithoutSuffix.replace(`${phase}_`, '');

    const parts = base.split('_');
    const group = parts[0];

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

  // Add phase START boundary field when first esillaolo is confirmed
  // (phase END must remain flexible for adding more esilläolos)
  firstEsillaoloConfirmedPhases.forEach((phase) => {
    const startField = phaseStartMap[phase];
    if (startField && startField in attributeData) {
      confirmedFields.push(startField);
    }
  });

  return [...new Set(confirmedFields)];
}