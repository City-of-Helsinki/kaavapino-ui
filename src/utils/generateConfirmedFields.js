const PHASE_ALIASES = {
  periaatteet: ['periaatteet'],
  oas: ['oas'],
  luonnos: ['luonnos', 'kaavaluonnos'],
  ehdotus: ['ehdotus', 'kaavaehdotus'],
  tarkistettu_ehdotus: ['tarkistettu_ehdotus']
};

const SPECIAL_CASES = [
  // Ehdotus phase
  'viimeistaan_lausunnot_ehdotuksesta',
  'viimeistaan_lausunnot_ehdotuksesta_2',
  'viimeistaan_lausunnot_ehdotuksesta_3',
  'viimeistaan_lausunnot_ehdotuksesta_4',
  'milloin_ehdotuksen_nahtavilla_paattyy',
  'milloin_ehdotuksen_nahtavilla_paattyy_2',
  'milloin_ehdotuksen_nahtavilla_paattyy_3',
  'milloin_ehdotuksen_nahtavilla_paattyy_4',
  'milloin_ehdotuksen_nahtavilla_alkaa_iso',
  'milloin_ehdotuksen_nahtavilla_alkaa_iso_2',
  'milloin_ehdotuksen_nahtavilla_alkaa_iso_3',
  'milloin_ehdotuksen_nahtavilla_alkaa_iso_4',
  'milloin_ehdotuksen_nahtavilla_alkaa_pieni',
  'milloin_ehdotuksen_nahtavilla_alkaa_pieni_2',
  'milloin_ehdotuksen_nahtavilla_alkaa_pieni_3',
  'milloin_ehdotuksen_nahtavilla_alkaa_pieni_4',
  'kaavaehdotus_nahtaville_1',
  'kaavaehdotus_uudelleen_nahtaville_2',
  'kaavaehdotus_uudelleen_nahtaville_3',
  'kaavaehdotus_uudelleen_nahtaville_4',
  // Periaatteet phase
  'viimeistaan_mielipiteet_periaatteista',
  'viimeistaan_mielipiteet_periaatteista_2',
  'viimeistaan_mielipiteet_periaatteista_3'
];

function isConfirmationKey(key) {
  return key.startsWith('vahvista_');
}

function isPhaseDate(key) {
  // Phase start/end dates that shouldn't be in confirmed fields
  return key.endsWith('vaihe_alkaa_pvm') || 
         key.endsWith('vaihe_paattyy_pvm') ||
         key.endsWith('_paattyy_pvm') ||
         key === 'projektin_kaynnistys_pvm';
}

function isVisibilityBoolean(key) {
  // Visibility booleans like jarjestetaan_oas_esillaolo_1
  // BUT NOT aineiston_maaraaika fields (e.g., ehdotus_nahtaville_aineiston_maaraaika)
  if (key.includes('aineiston_maaraaika')) return false;

  return key.startsWith('jarjestetaan_') || 
         key.includes('_nahtaville_') ||
         key.includes('_lautakuntaan_') ||
         key.endsWith('_luotu');
}

function isMetadataField(key) {
  // Metadata fields that shouldn't be in confirmed fields
  return key.startsWith('lautakunta_paatti_') ||  // Decision fields
         key.startsWith('onko_') ||                // Question booleans
         key.includes('_fieldset');                // Fieldset fields (handled separately)
}

function isSpecialCaseForPhase(key, phase) {
  if (phase === 'ehdotus') {
    return key.includes('ehdotuksen_nahtavilla') || 
           key.includes('lausunnot_ehdotuksesta') ||
           key.includes('kaavaehdotus_nahtaville') ||
           key.includes('kaavaehdotus_uudelleen_nahtaville');
  }
  if (phase === 'periaatteet') {
    return key.includes('periaatteista');
  }
  return false;
}

function getPhaseAndIndexFromConfirmationKey(confirmationKey) {
  // Extract phase name and index from confirmation key
  // Examples:
  // vahvista_oas_esillaolo_alkaa -> {phase: 'oas', type: 'esillaolo', index: '1'}
  // vahvista_luonnos_esillaolo_alkaa_2 -> {phase: 'luonnos', type: 'esillaolo', index: '2'}
  // vahvista_kaavaluonnos_lautakunnassa -> {phase: 'luonnos', type: 'lautakunta', index: '1'}
  // vahvista_ehdotus_esillaolo -> {phase: 'ehdotus', type: 'esillaolo', index: '1'}
  // vahvista_ehdotus_esillaolo_3 -> {phase: 'ehdotus', type: 'esillaolo', index: '3'}

  const match = confirmationKey.match(/^vahvista_(.+)$/);
  if (!match) return null;

  const remaining = match[1];

  // Extract index from end
  const indexMatch = remaining.match(/_(\d+)$/);
  const index = indexMatch ? indexMatch[1] : '1';

  // Determine type
  const type = remaining.includes('lautakunnassa') ? 'lautakunta' : 'esillaolo';

  // Extract phase
  let phase = remaining
    .replace(/_esillaolo.*$/, '')
    .replace(/_lautakunnassa.*$/, '')
    .replace(/^kaava/, ''); // Remove 'kaava' prefix

  return { phase, type, index };
}

// Helper: Check if key should be filtered out
function shouldFilterKey(key) {
  return isConfirmationKey(key) || isPhaseDate(key) || isVisibilityBoolean(key) || isMetadataField(key);
}

// Helper: Check if alias matches the key (at start or end)
function aliasMatchesKey(key, alias) {
  if (key.startsWith('milloin_')) {
    // For milloin_ keys, alias must be first component after milloin_
    return key.startsWith(`milloin_${alias}_`);
  }
  
  if (key.startsWith('viimeistaan_')) {
    // For viimeistaan_ keys, check after viimeistaan_ prefix
    // viimeistaan_mielipiteet_periaatteista -> matches 'periaatteet' alias
    // viimeistaan_lausunnot_ehdotuksesta -> matches 'ehdotus' alias
    const afterPrefix = key.substring('viimeistaan_'.length);
    return afterPrefix.includes(alias);
  }

  // Special case: aineiston_maaraaika and kylk_maaraaika fields can start with phase alias without underscore
  // Examples:
  //   luonnosaineiston_maaraaika
  //   oas_esillaolo_aineiston_maaraaika
  //   periaatteet_lautakunta_aineiston_maaraaika
  //   ehdotus_kylk_aineiston_maaraaika / ehdotus_kylk_maaraaika
  //   kaavaluonnos_kylk_aineiston_maaraaika / kaavaluonnos_kylk_maaraaika
  //   tarkistettu_ehdotus_kylk_maaraaika
  if (key.includes('aineiston_maaraaika') || key.includes('kylk_maaraaika')) {
    // Match if key starts with alias (with or without underscore)
    if (key.startsWith(alias)) return true;
    if (key.startsWith(`${alias}_`)) return true;
    // OR if key contains _alias_ pattern
    if (key.includes(`_${alias}_`)) return true;
    // OR for compound patterns like ehdotus_kylk, kaavaluonnos_kylk, tarkistettu_ehdotus_kylk
    // Check if the key matches the pattern {alias}_kylk or {alias}_lautakunta
    const maaraaikaPattern = new RegExp(`^${alias.replace('_', '_?')}_(kylk|lautakunta|esillaolo)_`);
    if (maaraaikaPattern.test(key)) return true;
  }

  // For other keys, alias must be at the very start followed by underscore
  // OR at the end as _alias (with optional numeric suffix)
  // This ensures "ehdotus" matches "ehdotus_kylk_..." but not "tarkistettu_ehdotus_..."
  if (key.startsWith(`${alias}_`)) return true;
  if (key.endsWith(`_${alias}`)) return true;
  // Check for numeric suffix: _alias_1, _alias_2, etc.
  const indexMatch = /_\d+$/.exec(key);
  if (indexMatch && key.substring(0, indexMatch.index).endsWith(`_${alias}`)) return true;
  return false;
}

// Helper: Extract index from attribute key (defaults to '1')
function extractKeyIndex(key) {
  const keyIndexMatch = /_(\d+)$/.exec(key);
  return keyIndexMatch ? keyIndexMatch[1] : '1';
}

// Helper: Check if key matches the type (esillaolo vs lautakunta)
function keyMatchesType(key, type) {
  // Aineiston määräajat ja KYLK määräajat:
  // Jos kentässä on _esillaolo_, se kuuluu vain esilläoloon
  // Jos kentässä on _lautakunta_, se kuuluu vain lautakuntaan
  // Jos kentässä on nahtavilla JA aineiston_maaraaika, se kuuluu esilläoloon (esim. ehdotus_nahtaville_aineiston_maaraaika)
  // Jos kentässä ei ole mitään näistä markereista (esim. luonnosaineiston_maaraaika), se kuuluu VAIN lautakuntaan
  if (key.includes('aineiston_maaraaika') || key.includes('kylk_maaraaika')) {
    // Check which type the field explicitly belongs to
    const hasEsillaolo = key.includes('_esillaolo_');
    const hasLautakunta = key.includes('_lautakunta_');
    const hasNahtaville = key.includes('nahtaville'); // ehdotus_nahtaville_aineiston_maaraaika
    const hasNahtavilla = key.includes('nahtavilla'); // milloin_ehdotuksen_nahtavilla_paattyy
    
    if (hasEsillaolo && type !== 'esillaolo') return false;
    if (hasLautakunta && type !== 'lautakunta') return false;
    
    // If field contains nahtaville/nahtavilla + aineiston_maaraaika, it belongs to esillaolo (nähtävilläolo = display phase)
    if ((hasNahtaville || hasNahtavilla) && key.includes('aineiston_maaraaika')) {
      return type === 'esillaolo';
    }
    
    // If no explicit marker, it belongs to lautakunta only
    if (!hasEsillaolo && !hasLautakunta && !hasNahtaville && !hasNahtavilla) {
      return type === 'lautakunta';
    }
    
    return true;
  }
  
  // Mielipiteet ja lausunnot kuuluvat AINA esilläoloon
  if (key.includes('mielipiteet') || key.includes('lausunnot')) {
    return type === 'esillaolo';
  }
  
  // Lautakunta-kentät
  if (type === 'lautakunta') {
    // Lautakunta-vahvistus: vain milloin_*_lautakunnassa ja aineiston_maaraaika
    return !(key.includes('esillaolo') || key.includes('nahtavilla')) && 
           (key.includes('lautakunta') || key.includes('lautakunnassa'));
  }
  
  // Esilläolo-kentät
  if (type === 'esillaolo') {
    // Esilläolo-vahvistus: milloin_*_esillaolo_alkaa/paattyy, nahtavilla, mielipiteet, lausunnot
    // EI lautakunta-kenttiä (paitsi aineiston_maaraaika joka hyväksytään ylhäällä)
    return !(key.includes('lautakunta') || key.includes('lautakunnassa'));
  }
  
  return true;
}

// Helper: Check if field should be added based on all criteria
function shouldAddField(key, alias, index, type, attributeData) {
  if (!Object.hasOwn(attributeData, key)) return false;
  if (shouldFilterKey(key)) return false;
  if (!aliasMatchesKey(key, alias)) return false;

  const keyIndex = extractKeyIndex(key);
  if (keyIndex !== index) return false;

  return keyMatchesType(key, type);
}

function addAliasFields(confirmedFields, attributeData, aliases, confirmationInfo) {
  // Only add fields that match the phase AND index from the confirmation key
  const { type, index } = confirmationInfo;

  for (const alias of aliases) {
    for (const key in attributeData) {
      if (shouldAddField(key, alias, index, type, attributeData)) {
        confirmedFields.add(key);
      }
    }
  }
}

// Helper: Check if special case key should be included based on phase and type
function shouldIncludeSpecialCase(key, phase, type, attributeData) {
  if (!(key in attributeData)) return false;
  if (!isSpecialCaseForPhase(key, phase)) return false;
  
  // For ehdotus and periaatteet phases: special cases belong to esillaolo, not lautakunta
  if ((phase === 'ehdotus' || phase === 'periaatteet') && type !== 'esillaolo') {
    return false;
  }
  
  return true;
}

// Helper: Extract index from special case key (handling _iso/_pieni suffixes)
function extractSpecialCaseIndex(key) {
  // First remove size suffix if present (_iso or _pieni)
  const keyWithoutSize = key.replace(/_(iso|pieni)(_\d+)?$/, (match, p1, p2) => p2 || '');
  const keyIndexMatch = /_(\d+)$/.exec(keyWithoutSize);
  return keyIndexMatch ? keyIndexMatch[1] : '1';
}

function addSpecialCaseFields(confirmedFields, attributeData, confirmationInfo) {
  const { phase, type, index } = confirmationInfo;

  for (const key of SPECIAL_CASES) {
    if (!shouldIncludeSpecialCase(key, phase, type, attributeData)) {
      continue;
    }

    const keyIndex = extractSpecialCaseIndex(key);
    if (keyIndex === index) {
      confirmedFields.add(key);
    }
  }
}

export function generateConfirmedFields(attributeData, confirmationAttributeNames) {
  const confirmedFields = new Set();

  confirmationAttributeNames.forEach(confirmationKey => {
    // Skip outdated paattyy confirmation attributes
    if (confirmationKey.includes('paattyy')) {
      return;
    }
    // Only process if confirmation field exists AND is set to true
    if (!attributeData[confirmationKey] || attributeData[confirmationKey] !== true) {
      return;
    }

    const confirmationInfo = getPhaseAndIndexFromConfirmationKey(confirmationKey);
    if (!confirmationInfo) return;
    
    const aliases = PHASE_ALIASES[confirmationInfo.phase] || [confirmationInfo.phase];
    addAliasFields(confirmedFields, attributeData, aliases, confirmationInfo);
    addSpecialCaseFields(confirmedFields, attributeData, confirmationInfo);
  });

  // Filter out unwanted keys and fieldset fields
  const filteredFields = Array.from(confirmedFields).filter(key => {
    if (isConfirmationKey(key)) return false;
    if (isPhaseDate(key)) return false;
    if (isVisibilityBoolean(key)) return false;
    if (isMetadataField(key)) return false;
    if (key.includes('_fieldset')) return false; // Remove fieldset fields
    return true;
  });

  return filteredFields.sort((a, b) => a.localeCompare(b));
}