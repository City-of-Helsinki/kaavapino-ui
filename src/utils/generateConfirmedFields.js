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

// Get all possible vaihe fields for a phase (with and without underscore)
function getVaiheFields(phase, attributeData) {
  const variants = [
    `${phase}vaihe_alkaa_pvm`,
    `${phase}vaihe_paattyy_pvm`,
    `${phase}_vaihe_alkaa_pvm`,
    `${phase}_vaihe_paattyy_pvm`
  ];
  const result = [];
  for (const key of variants) {
    if (key in attributeData) result.push(key);
  }
  return result;
}

// Get all timetable fields for a phase/group/suffix combination
function getGroupSuffixFields(phase, attributeData) {
  const fields = [];
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
        if (key in attributeData) fields.push(key);
      }
    }
  }
  return fields;
}

// Get special case fields for a phase
function getSpecialCaseFields(phase, attributeData) {
  const result = [];
  for (const key of SPECIAL_CASES) {
    if (key.includes(phase) && key in attributeData) {
      result.push(key);
    }
  }
  return result;
}

// Get all mielipiteet fields for a phase (with sta/ista/numeric suffixes)
function getMielipiteetFields(phase, attributeData, seenPhases) {
  const fields = [];
  const nums = ['', '_2', '_3', '_4'];
  for (const suffix of MIELIPITEET_SUFFIXES) {
    for (const num of nums) {
      const key = `viimeistaan_mielipiteet_${phase}${suffix}${num}`;
      if (!seenPhases.has(key) && key in attributeData) {
        fields.push(key);
        seenPhases.add(key);
      }
    }
  }
  return fields;
}

// Get all *_fieldset fields present in attributeData
function getFieldsetFields(attributeData, confirmedFields) {
  const result = [];
  for (const key of Object.keys(attributeData)) {
    if (key.endsWith('_fieldset') && !confirmedFields.includes(key)) {
      result.push(key);
    }
  }
  return result;
}

// Collect all fields that should be confirmed/locked for the backend
export function generateConfirmedFields(attributeData, confirmationAttributeNames, phaseNames) {
  let confirmedFields = [];
  const seenPhases = new Set();

  for (const confirmationKey of confirmationAttributeNames) {
    if (!confirmationKey.startsWith('vahvista_')) continue;
    const rawKey = confirmationKey.replace(/^vahvista_/, '');
    const phase = phaseNames.find(p => rawKey === p || rawKey.startsWith(p + '_'));
    if (!phase) continue;

    confirmedFields = confirmedFields.concat(
      getGroupSuffixFields(phase, attributeData),
      getVaiheFields(phase, attributeData),
      getSpecialCaseFields(phase, attributeData),
      getMielipiteetFields(phase, attributeData, seenPhases)
    );
  }

  // Add global special cases if present
  confirmedFields = confirmedFields.concat(
    SPECIAL_CASES.filter(
      key => key in attributeData && !confirmedFields.includes(key)
    )
  );

  // Add all *_fieldset fields if present
  confirmedFields = confirmedFields.concat(
    getFieldsetFields(attributeData, confirmedFields)
  );

  // Remove duplicates
  return [...new Set(confirmedFields)];
}