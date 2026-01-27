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
    return key.includes('ehdotuksen_nahtavilla') || key.includes('lausunnot_ehdotuksesta');
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

  // For other keys, alias must be at the very start OR at the end as _alias
  // This prevents "ehdotus" from matching "tarkistettu_ehdotus_kylk_maaraaika"
  const startsWithAlias = key.startsWith(alias);
  const endsWithAlias = key.endsWith(`_${alias}`) || new RegExp(String.raw`_${alias}(_\d+)?$`).exec(key);
  return startsWithAlias || endsWithAlias;
}

// Helper: Extract index from attribute key (defaults to '1')
function extractKeyIndex(key) {
  const keyIndexMatch = /_(\d+)$/.exec(key);
  return keyIndexMatch ? keyIndexMatch[1] : '1';
}

// Helper: Check if key matches the type (esillaolo vs lautakunta)
function keyMatchesType(key, type) {
  if (type === 'esillaolo' && (key.includes('lautakunta') || key.includes('lautakunnassa'))) {
    return false;
  }
  if (type === 'lautakunta' && (key.includes('esillaolo') || key.includes('nahtavilla'))) {
    return false;
  }
  return true;
}

function addAliasFields(confirmedFields, attributeData, aliases, confirmationInfo) {
  // Only add fields that match the phase AND index from the confirmation key
  const { type, index } = confirmationInfo;

  for (const alias of aliases) {
    for (const key in attributeData) {
      if (!Object.hasOwn(attributeData, key)) continue;
      if (shouldFilterKey(key)) continue;
      if (!aliasMatchesKey(key, alias)) continue;

      const keyIndex = extractKeyIndex(key);

      // Match exact index for both esillaolo and lautakunta
      if (keyIndex === index) {
        if (keyMatchesType(key, type)) {
          confirmedFields.add(key);
        }
      }
    }
  }
}

function addSpecialCaseFields(confirmedFields, attributeData, confirmationInfo) {
  const { phase, type, index } = confirmationInfo;

  for (const key of SPECIAL_CASES) {
    if (!(key in attributeData)) continue;
    if (!isSpecialCaseForPhase(key, phase)) continue;

    // For ehdotus phase: special cases belong to esillaolo (nahtavilla), not lautakunta
    // Only add ehdotus special cases if type is 'esillaolo'
    if (phase === 'ehdotus' && type !== 'esillaolo') {
      continue;
    }

    // Extract index from special case key
    // For ehdotus: milloin_ehdotuksen_nahtavilla_alkaa_iso -> index '1'
    //              milloin_ehdotuksen_nahtavilla_alkaa_iso_2 -> index '2'
    // For periaatteet: viimeistaan_mielipiteet_periaatteista -> index '1'
    //                  viimeistaan_mielipiteet_periaatteista_2 -> index '2'

    // First remove size suffix if present (_iso or _pieni)
    const keyWithoutSize = key.replace(/_(iso|pieni)(_\d+)?$/, '$2');
    const keyIndexMatch = /_(\d+)$/.exec(keyWithoutSize);
    const keyIndex = keyIndexMatch ? keyIndexMatch[1] : '1';

    // Only add if the index matches
    if (keyIndex === index) {
      confirmedFields.add(key);
    }
  }
}

function addFieldsetFields(confirmedFields, attributeKeys) {
  for (const key of attributeKeys) {
    if (key.endsWith('_fieldset')) {
      confirmedFields.add(key);
    }
  }
}

export function generateConfirmedFields(attributeData, confirmationAttributeNames) {
  const confirmedFields = new Set();

  confirmationAttributeNames.forEach(confirmationKey => {
    // Skip outdated paattyy confirmation attributes
    if (confirmationKey.includes('paattyy')) return;
    if (!attributeData[confirmationKey]) return;

    const confirmationInfo = getPhaseAndIndexFromConfirmationKey(confirmationKey);
    if (!confirmationInfo) return;

    const aliases = PHASE_ALIASES[confirmationInfo.phase] || [confirmationInfo.phase];
    addAliasFields(confirmedFields, attributeData, aliases, confirmationInfo);
    addSpecialCaseFields(confirmedFields, attributeData, confirmationInfo);
  });

  addFieldsetFields(confirmedFields, Object.keys(attributeData));

  const filteredFields = Array.from(confirmedFields).filter(
    key => !isConfirmationKey(key) && !isPhaseDate(key) && !isVisibilityBoolean(key) && !isMetadataField(key)
  );

  return filteredFields.sort((a, b) => a.localeCompare(b));
}