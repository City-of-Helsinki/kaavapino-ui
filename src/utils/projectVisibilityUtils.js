import { includes, get } from 'lodash'
import projectUtils from './projectUtils'
import textUtil from './textUtil'
// Field returns info whether field given as a parameter should be shown or not.

export const vis_bool_group_map = Object.freeze({
  'kaynnistys_1': null,
  'periaatteet_esillaolokerta_1': 'jarjestetaan_periaatteet_esillaolo_1',
  'periaatteet_esillaolokerta_2': 'jarjestetaan_periaatteet_esillaolo_2',
  'periaatteet_esillaolokerta_3': 'jarjestetaan_periaatteet_esillaolo_3',
  'periaatteet_lautakuntakerta_1': 'periaatteet_lautakuntaan_1',
  'periaatteet_lautakuntakerta_2': 'periaatteet_lautakuntaan_2',
  'periaatteet_lautakuntakerta_3': 'periaatteet_lautakuntaan_3',
  'periaatteet_lautakuntakerta_4': 'periaatteet_lautakuntaan_4',
  'oas_esillaolokerta_1': 'jarjestetaan_oas_esillaolo_1',
  'oas_esillaolokerta_2': 'jarjestetaan_oas_esillaolo_2',
  'oas_esillaolokerta_3': 'jarjestetaan_oas_esillaolo_3',
  'luonnos_esillaolokerta_1': 'jarjestetaan_luonnos_esillaolo_1',
  'luonnos_esillaolokerta_2': 'jarjestetaan_luonnos_esillaolo_2',
  'luonnos_esillaolokerta_3': 'jarjestetaan_luonnos_esillaolo_3',
  'luonnos_lautakuntakerta_1': 'kaavaluonnos_lautakuntaan_1',
  'luonnos_lautakuntakerta_2': 'kaavaluonnos_lautakuntaan_2',
  'luonnos_lautakuntakerta_3': 'kaavaluonnos_lautakuntaan_3',
  'luonnos_lautakuntakerta_4': 'kaavaluonnos_lautakuntaan_4',
  'ehdotus_nahtavillaolokerta_1': 'kaavaehdotus_nahtaville_1',
  'ehdotus_nahtavillaolokerta_2': 'kaavaehdotus_uudelleen_nahtaville_2',
  'ehdotus_nahtavillaolokerta_3': 'kaavaehdotus_uudelleen_nahtaville_3',
  'ehdotus_nahtavillaolokerta_4': 'kaavaehdotus_uudelleen_nahtaville_4',
  'ehdotus_lautakuntakerta_1': 'kaavaehdotus_lautakuntaan_1',
  'ehdotus_lautakuntakerta_2': 'kaavaehdotus_lautakuntaan_2',
  'ehdotus_lautakuntakerta_3': 'kaavaehdotus_lautakuntaan_3',
  'ehdotus_lautakuntakerta_4': 'kaavaehdotus_lautakuntaan_4',
  'tarkistettu_ehdotus_lautakuntakerta_1': 'tarkistettu_ehdotus_lautakuntaan_1',
  'tarkistettu_ehdotus_lautakuntakerta_2': 'tarkistettu_ehdotus_lautakuntaan_2',
  'tarkistettu_ehdotus_lautakuntakerta_3': 'tarkistettu_ehdotus_lautakuntaan_3',
  'tarkistettu_ehdotus_lautakuntakerta_4': 'tarkistettu_ehdotus_lautakuntaan_4',
  'hyvaksyminen_1': null,
  'voimaantulo_1': null}
);

/**
 * Get the date field names associated with a deadline group.
 * Used to clear date fields when a group is deleted, preventing stale data on re-add.
 * 
 * @param {string} deadlineGroup - e.g., 'periaatteet_esillaolokerta_1'
 * @returns {string[]} - Array of date field names to clear
 */
export const getDateFieldsForDeadlineGroup = (deadlineGroup) => {
  if (!deadlineGroup) return [];
  
  const fields = [];
  
  // Parse the deadline group to extract phase, type, and index
  // Examples: 'periaatteet_esillaolokerta_1', 'ehdotus_nahtavillaolokerta_2', 'luonnos_lautakuntakerta_1'
  const parts = deadlineGroup.split('_');
  if (parts.length < 2) return [];
  
  // Handle tarkistettu_ehdotus specially (two-word phase name)
  let phase, type, indexNum;
  if (deadlineGroup.startsWith('tarkistettu_ehdotus')) {
    phase = 'tarkistettu_ehdotus';
    type = parts[2]?.replace('kerta', ''); // e.g., 'lautakunta' from 'lautakuntakerta'
    indexNum = parseInt(parts[3], 10);
  } else {
    phase = parts[0]; // e.g., 'periaatteet'
    type = parts[1]?.replace('kerta', ''); // e.g., 'esillaolo' from 'esillaolokerta'
    indexNum = parseInt(parts[2], 10);
  }
  
  if (!phase || !type || isNaN(indexNum)) return [];
  
  // Build suffix for indexed fields (_2, _3, _4) - _1 has no suffix
  const suffix = indexNum > 1 ? `_${indexNum}` : '';
  
  if (type === 'esillaolo') {
    fields.push(`milloin_${phase}_esillaolo_alkaa${suffix}`);
    fields.push(`milloin_${phase}_esillaolo_paattyy${suffix}`);
    fields.push(`${phase}_esillaolo_aineiston_maaraaika${suffix}`);
  } else if (type === 'lautakunta') {
    // Different phases have different naming conventions
    if (phase === 'periaatteet') {
      fields.push(`milloin_${phase}_lautakunnassa${suffix}`);
      fields.push(`${phase}_kylk_aineiston_maaraaika${suffix}`);
    } else {
      fields.push(`milloin_kaava${phase}_lautakunnassa${suffix}`);
      fields.push(`kaava${phase}_kylk_aineiston_maaraaika${suffix}`);
    }
  } else if (type === 'nahtavillaolo') {
    // Only for ehdotus phase
    // NOTE: Includes size variants - _pieni (XS/S/M) OR _iso (L/XL), never both
    // Cleanup deletes whichever exists
    if (phase === 'ehdotus') {
      fields.push(`ehdotus_nahtaville_aineiston_maaraaika${suffix}`);
      fields.push(`milloin_ehdotuksen_nahtavilla_alkaa_pieni${suffix}`);  // XS/S/M only
      fields.push(`milloin_ehdotuksen_nahtavilla_alkaa_iso${suffix}`);    // L/XL only
      fields.push(`milloin_ehdotuksen_nahtavilla_paattyy${suffix}`);
      fields.push(`viimeistaan_lausunnot_ehdotuksesta${suffix}`);
    }
  }
  
  return fields;
};

/**
 * Get all subsequent deadline groups that should also be removed when removing a numbered group.
 * For example, removing 'ehdotus_nahtavillaolokerta_3' should also remove 'ehdotus_nahtavillaolokerta_4'.
 * This ensures the timeline groups stay in sequence (can't have 1, 2, 4 without 3).
 * 
 * @param {string} deadlineGroup - The deadline group being removed, e.g., 'ehdotus_nahtavillaolokerta_3'
 * @returns {string[]} - Array of subsequent deadline groups to also remove
 */
export const getSubsequentDeadlineGroups = (deadlineGroup) => {
  if (!deadlineGroup) return [];
  
  // Extract the base name and index number
  // Examples: 'ehdotus_nahtavillaolokerta_3' -> base='ehdotus_nahtavillaolokerta', index=3
  // 'tarkistettu_ehdotus_lautakuntakerta_2' -> base='tarkistettu_ehdotus_lautakuntakerta', index=2
  const lastUnderscoreIndex = deadlineGroup.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) return [];
  
  const baseName = deadlineGroup.substring(0, lastUnderscoreIndex);
  const currentIndex = parseInt(deadlineGroup.substring(lastUnderscoreIndex + 1), 10);
  
  if (isNaN(currentIndex)) return [];
  
  // Find all groups in the map that match the base name and have a higher index
  const subsequentGroups = [];
  for (const groupName of Object.keys(vis_bool_group_map)) {
    const groupLastUnderscore = groupName.lastIndexOf('_');
    if (groupLastUnderscore === -1) continue;
    
    const groupBaseName = groupName.substring(0, groupLastUnderscore);
    const groupIndex = parseInt(groupName.substring(groupLastUnderscore + 1), 10);
    
    if (groupBaseName === baseName && !isNaN(groupIndex) && groupIndex > currentIndex) {
      subsequentGroups.push(groupName);
    }
  }
  
  // Sort by index ascending (e.g., _3, _4, _5...)
  subsequentGroups.sort((a, b) => {
    const aIndex = parseInt(a.substring(a.lastIndexOf('_') + 1), 10);
    const bIndex = parseInt(b.substring(b.lastIndexOf('_') + 1), 10);
    return aIndex - bIndex;
  });
  
  return subsequentGroups;
};

export const showField = (field, formValues, currentName) => {
  let returnValue = false

  if (!field) {
    return true
  }

  const getValue = variable => {
    if (!formValues) {
      return null
    }
    const lastIndex = currentName ? currentName.lastIndexOf('.') : -1

    const fieldsetPart = currentName ? currentName.substring(0, lastIndex) + '.' : ''

    let currentValue = get(formValues, `${fieldsetPart}${variable}`)
    
    if  ( currentValue === undefined ) {
      currentValue = projectUtils.findValueFromObject( formValues, variable)
    }

    return currentValue
  }

  if (field.hide_conditions && field.hide_conditions.length > 0) {
    const results = []
    field.hide_conditions.forEach(hideCondition => {
      const { variable } = hideCondition
      const { operator } = hideCondition
      const comparisonValue = hideCondition.comparison_value
      const comparisonValueType = hideCondition.comparison_value_type

      if (comparisonValueType === 'boolean') {
        let value = getValue(variable)

        let realValue = false

        if (value === true || value === false) {
          realValue = value
        } else {
          realValue = value !== undefined
        }

        if (operator === '==') {
          if (realValue === comparisonValue) {
            results.push(true)
          } else {
            results.push(false)
          }
        }
      }
    })
    const hasTrue = includes(results, true)

    if (!hasTrue) {
      returnValue = true
    }
  } 
  else if (field && field.visibility_conditions && field.visibility_conditions.length > 0) 
  {
    field.visibility_conditions.forEach(visibilityCondition => {
      const { variable } = visibilityCondition
      const { operator } = visibilityCondition
      const comparisonValue = visibilityCondition.comparison_value
      const comparisonValueType = visibilityCondition.comparison_value_type

      if (comparisonValueType === 'list<string>') {
        if (comparisonValue.includes(getValue(variable))) {
          returnValue = true
          return
        }
      }

      if (comparisonValueType === 'boolean') {
        const value = getValue(variable)
        let realValue = false

        if (value === true || value === false) {
          realValue = value
        } else {
          realValue = value !== undefined
        }
        if (operator === '==' && comparisonValue === realValue) {
          returnValue = true
          return
        }
        if (operator === '!=' && comparisonValue !== realValue) {
          returnValue = true
          return
        }
      }
      if (comparisonValueType === 'string' || comparisonValueType === 'number') {
        if (operator === '==' && comparisonValue === getValue(variable)) {
          returnValue = true
          return
        }
        if (comparisonValueType === 'number') {
          let value = getValue(variable)
          if (!value) {
            value = 0
          }

          if (operator === '!=' && comparisonValue !== +value) {
            returnValue = true
          }
        } else {
          if (operator === '!=' && comparisonValue !== getValue(variable)) {
            returnValue = true
          }
        }
      }
    })
  } 
  else {
    returnValue = true
  }

  return returnValue
}

export const getVisibilityBoolName = (deadlineGroup) => {
  return vis_bool_group_map[deadlineGroup] || null;
};

export const getVisBoolsByPhaseName = (phase_name) => {
  phase_name = phase_name.toLowerCase().split(' ').join('_');
  return Object.entries(vis_bool_group_map)
    .filter(([group,]) => group.startsWith(phase_name))
    .map(([, bool]) => bool)
};

export const getPhaseNameByVisBool = (boolName) => {
  for (const [key, value] of Object.entries(vis_bool_group_map)) {
    if (value === boolName) {
      if (key.includes("tarkistettu_ehdotus")) {
        return "tarkistettu_ehdotus"
      }
      return key.split('_')[0]
    }
  }
  return null
}

export const shouldDeadlineBeVisible = (deadlineName, deadlineGroup, attributeData) => {
  // Project size specific special cases
  const projectSize = attributeData["kaavaprosessin_kokoluokka"];
  if (projectSize) {
    if (projectSize !== "XL" && (deadlineGroup?.includes("periaatteet") || deadlineGroup?.includes("luonnos"))) {
      return false;
    }
    if ( ["XS","S","M"].includes(projectSize) && (
      deadlineGroup?.startsWith("ehdotus_lautakuntakerta") || deadlineName?.includes("nahtavilla_alkaa_iso"))) {
        return false;
    }
    if (["L", "XL"].includes(projectSize) && (
      deadlineName?.startsWith("ehdotus_nahtaville_aineiston_maaraaika") || deadlineName?.includes("nahtavilla_alkaa_pieni"))) {
      return false;
    }
  }
  if( (deadlineGroup?.includes("periaatteet") && attributeData?.periaatteet_luotu === false) ||
       deadlineGroup?.includes("luonnos") && attributeData?.luonnos_luotu === false) {
    return false;
  }
  // Check visibility bools
  const visBool = getVisibilityBoolName(deadlineGroup);
  if (!visBool) {
    return true;
  }
  const visBoolVal = attributeData[visBool];
  if (visBoolVal === undefined) {
    // Sometimes visibility bool is missing from data for deadlines that are always assumed to exist.
    // (First deadline in the element group). In this case the dl should be shown.
    return deadlineGroup.endsWith("_1")
  }
  return visBoolVal;
}

// Helper function to check if dates are confirmed
export const isDeadlineConfirmed = (formValues, deadlineGroup, returnField, breakAtFirst) => {
    // ReturnField true is used when deleting phase and making sure confirmation is deleted too.
    // Extract the number from deadlineGroup if it exists
    const extractDigitsFromEnd = (str) => {
      if (!str) return null;
      const digits = str.split('').reverse().filter(char => !isNaN(char) && char !== ' ').reverse().join('');
      return digits || null;
    };

    const matchNumber = extractDigitsFromEnd(deadlineGroup);
    let confirmationKey;

    const baseKeys = {
      "tarkistettu_ehdotus": "vahvista_tarkistettu_ehdotus_lautakunnassa",
      "ehdotus_pieni": "vahvista_ehdotus_esillaolo_pieni",
      "ehdotus_nahtavillaolokerta": "vahvista_ehdotus_esillaolo",
      "ehdotus_esillaolo": "vahvista_ehdotus_esillaolo",
      "ehdotus_lautakunta": "vahvista_kaavaehdotus_lautakunnassa",
      "oas": "vahvista_oas_esillaolo_alkaa",
      "periaatteet_esillaolokerta": "vahvista_periaatteet_esillaolo_alkaa",
      "periaatteet_lautakuntakerta": "vahvista_periaatteet_lautakunnassa",
      "luonnos_esillaolokerta": "vahvista_luonnos_esillaolo_alkaa",
      "luonnos_lautakuntakerta": "vahvista_kaavaluonnos_lautakunnassa"
    };

    for (const key in baseKeys) {
      if (deadlineGroup.includes(key)) {
        if (matchNumber && matchNumber === "1") {
          // If number is 1, use the base key
          confirmationKey = baseKeys[key];
          if(breakAtFirst){
            break;
          }
        } else if (matchNumber) {
          // If number is bigger, construct the confirmationKey using the number
          confirmationKey = `${baseKeys[key]}_${matchNumber}`;
        } else {
          // If no number, use the base key
          confirmationKey = baseKeys[key];
        }
        break;
      }
    }
    const returnValue = returnField ? { key: confirmationKey, value: formValues[confirmationKey] } : formValues[confirmationKey];
    return returnValue;
  };

  // Helper: does current phase have at least one confirmed deadline
  export const isCurrentPhaseConfirmed = (attribute_data) => {
    if (!attribute_data || !attribute_data.kaavan_vaihe) return false;

    // Remove leading numbering like "3. " then normalize (lowercase, remove spaces)
    // Also remove a possible leading 'XL.' (roman numeral / size marker) prefix
    const raw = attribute_data.kaavan_vaihe.replace(/^(?:[\d]+\.|XL\.)\s*/i, '');
    // Use shared utility to normalize Scandinavian characters
    let phase = textUtil.replaceScandics(raw).toLowerCase().trim();
    // Exception: keep tarkistettu_ehdotus with underscore (do NOT concatenate)
    if (phase === 'tarkistettu ehdotus') {
      phase = 'tarkistettu_ehdotus';
    } else {
      // Other phases: remove spaces entirely
      phase = phase.replace(/\s+/g, '');
    }

    // These phases should bypass confirmation requirement
    if (phase === 'kaynnistys' || phase === 'hyvaksyminen' || phase === 'voimaantulo') {
      return true;
    }

    // Collect candidate deadline groups for this phase
    const groupKeys = Object.keys(vis_bool_group_map).filter(group => {
      if (group.startsWith('tarkistettu_ehdotus')) {
        return phase === 'tarkistettu_ehdotus';
      }
      const firstToken = group.split('_')[0];
      return firstToken === phase;
    });

    if (groupKeys.length === 0) {
      return false; // No groups -> block
    }

    const visibleGroups = groupKeys.filter(g => shouldDeadlineBeVisible(null, g, attribute_data));
    for (const g of visibleGroups) {
      if (isDeadlineConfirmed(attribute_data, g, false, true)) {
        return true;
      }
    }
    return false;
  };
