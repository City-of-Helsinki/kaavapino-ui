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

  function isSpecialCaseForPhase(key, phase) {
    if (phase === 'ehdotus') {
      return key.includes('ehdotuksen_nahtavilla') || key.includes('lausunnot_ehdotuksesta');
    }
    if (phase === 'periaatteet') {
      return key.includes('periaatteista');
    }
    return false;
  }

  export function generateConfirmedFields(attributeData, confirmationAttributeNames, phaseNames) {
    const confirmedFields = new Set();
    const attributeKeys = Object.keys(attributeData);

    for (const confirmationKey of confirmationAttributeNames) {
      if (confirmationKey.includes('paattyy')) continue; // skip outdated
      if (!attributeData[confirmationKey]) continue;
      const match = confirmationKey.match(/^vahvista_([a-z0-9_]+)$/);
      if (!match) continue;
      const phasePart = match[1];
      const phase = phaseNames.find(p => phasePart === p || phasePart.startsWith(p + '_'));
      if (!phase) continue;
      const aliases = PHASE_ALIASES[phase] || [phase];

      // Add all fields containing any alias substring
      for (const alias of aliases) {
        for (const key of attributeKeys) {
          if (key.includes(alias)) {
            confirmedFields.add(key);
          }
        }
      }

      // Add special-case fields for this phase
      for (const key of SPECIAL_CASES) {
        if (key in attributeData && isSpecialCaseForPhase(key, phase)) {
          confirmedFields.add(key);
        }
      }
    }

    // Add *_fieldset fields if present
    for (const key of attributeKeys) {
      if (key.endsWith('_fieldset')) {
        confirmedFields.add(key);
      }
    }

    // Remove confirmation attributes from the result
    const filteredFields = Array.from(confirmedFields).filter(
      key => !isConfirmationKey(key)
    );

    return filteredFields.sort((a, b) => a.localeCompare(b));
  }