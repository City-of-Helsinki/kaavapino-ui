const SUFFIXES = ['', '_2', '_3', '_4', '_pieni', '_iso'];
const GROUPS = ['esillaolo', 'nahtaville', 'lautakunta', 'kylk'];
const MIELIPITEET_SUFFIXES = ['', 'sta', 'ista'];
const SPECIAL_CASES = [
  'ehdotus_nahtaville_aineiston_maaraaika',
  'milloin_ehdotuksen_nahtavilla_paattyy',
  'viimeistaan_lausunnot_ehdotuksesta',
  'luonnosaineiston_maaraaika',
  'kaavaluonnos_kylk_aineiston_maaraaika',
  'tarkistettu_ehdotus_kylk_maaraaika'
];

// Helper to get all possible vaihe fields for a phase (with and without underscore)
function getVaiheFields(phase, attributeData) {
  const variants = [
    `${phase}vaihe_alkaa_pvm`,
    `${phase}vaihe_paattyy_pvm`,
    `${phase}_vaihe_alkaa_pvm`,
    `${phase}_vaihe_paattyy_pvm`
  ];
  return variants.filter(key => key in attributeData);
}

// Helper to add mielipiteet fields with all suffixes
function addMielipiteetField(confirmedFields, seenPhases, phase, attributeData) {
  const nums = ['', '_2', '_3', '_4'];
  for (const suffix of MIELIPITEET_SUFFIXES) {
    for (const num of nums) {
      const key = `viimeistaan_mielipiteet_${phase}${suffix}${num}`;
      if (!seenPhases.has(key) && key in attributeData) {
        confirmedFields.push(key);
        seenPhases.add(key);
      }
    }
  }
}

// Helper to add all *_fieldset fields if present
function addFieldsetFields(confirmedFields, attributeData) {
  Object.keys(attributeData).forEach(key => {
    if (key.endsWith('_fieldset') && !confirmedFields.includes(key)) {
      confirmedFields.push(key);
    }
  });
}

// Main function
export function generateConfirmedFields(attributeData, confirmationAttributeNames, phaseNames) {
  const confirmedFields = [];
  const seenPhases = new Set();

  for (const confirmationKey of confirmationAttributeNames) {
    if (!confirmationKey.startsWith('vahvista_')) continue;

    let rawKey = confirmationKey.replace(/^vahvista_/, '');
    let phase = phaseNames.find((p) => rawKey === p || rawKey.startsWith(p + '_'));
    if (!phase) continue;

    // Try all suffixes and groups
    for (const group of GROUPS) {
      for (const suffix of SUFFIXES) {
        const possibleKeys = [
          `${phase}_${group}_aineiston_maaraaika${suffix}`,
          `milloin_${phase}_${group}_alkaa${suffix}`,
          `milloin_${phase}_${group}_paattyy${suffix}`,
          `milloin_${phase}_${group}_alkaa_pieni`,
          `milloin_${phase}_${group}_alkaa_iso`,
          `${phase}_${group}_aineiston_maaraaika_pieni`,
          `${phase}_${group}_aineiston_maaraaika_iso`
        ];
        for (const key of possibleKeys) {
          if (key in attributeData && !confirmedFields.includes(key)) {
            confirmedFields.push(key);
          }
        }
      }
    }

    // Add vaihe fields if present
    for (const key of getVaiheFields(phase, attributeData)) {
      if (!confirmedFields.includes(key)) {
        confirmedFields.push(key);
      }
    }

    // Add special cases for this phase
    for (const specialKey of SPECIAL_CASES) {
      if (specialKey.includes(phase) && specialKey in attributeData && !confirmedFields.includes(specialKey)) {
        confirmedFields.push(specialKey);
      }
    }

    // Add mielipiteet field if present
    addMielipiteetField(confirmedFields, seenPhases, phase, attributeData);
  }

  // Also add any other special cases you see in your data
  for (const specialKey of SPECIAL_CASES) {
    if (specialKey in attributeData && !confirmedFields.includes(specialKey)) {
      confirmedFields.push(specialKey);
    }
  }

  // Add all *_fieldset fields if present
  addFieldsetFields(confirmedFields, attributeData);

  return [...new Set(confirmedFields)];
}