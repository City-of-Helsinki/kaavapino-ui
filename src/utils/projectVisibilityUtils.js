import { includes, get } from 'lodash'
import projectUtils from './projectUtils'
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
export const isDeadlineConfirmed = (formValues, deadlineGroup, returnField) => {
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
