import { shouldDeadlineBeVisible } from "./projectVisibilityUtils";
import timeUtil from "./timeUtil";

//Phase main start and end value order should always be the same
export const phaseOrder = [
  'projektin_kaynnistys_pvm',
  'kaynnistys_paattyy_pvm',
  'periaatteetvaihe_alkaa_pvm',
  'periaatteetvaihe_paattyy_pvm',
  'oasvaihe_alkaa_pvm',
  'oasvaihe_paattyy_pvm',
  'luonnosvaihe_alkaa_pvm',
  'luonnosvaihe_paattyy_pvm',
  'ehdotusvaihe_alkaa_pvm',
  'ehdotusvaihe_paattyy_pvm',
  'tarkistettuehdotusvaihe_alkaa_pvm',
  'tarkistettuehdotusvaihe_paattyy_pvm',
  'hyvaksyminenvaihe_alkaa_pvm',
  'hyvaksyminenvaihe_paattyy_pvm',
  'voimaantulovaihe_alkaa_pvm',
  'voimaantulovaihe_paattyy_pvm'
];

const phaseStartEndAttributes = {
  "Käynnistys": ["projektin_kaynnistys_pvm", "kaynnistys_paattyy_pvm"],
  "Periaatteet": ["periaatteetvaihe_alkaa_pvm", "periaatteetvaihe_paattyy_pvm"],
  "OAS": ["oasvaihe_alkaa_pvm", "oasvaihe_paattyy_pvm"],
  "Luonnos": ["luonnosvaihe_alkaa_pvm", "luonnosvaihe_paattyy_pvm"],
  "Ehdotus": ["ehdotusvaihe_alkaa_pvm", "ehdotusvaihe_paattyy_pvm"],
  "Tarkistettu ehdotus": ["tarkistettuehdotusvaihe_alkaa_pvm", "tarkistettuehdotusvaihe_paattyy_pvm"],
  "Hyväksyminen": ["hyvaksyminenvaihe_alkaa_pvm", "hyvaksyminenvaihe_paattyy_pvm"],
  "Voimaantulo": ["voimaantulovaihe_alkaa_pvm", "voimaantulovaihe_paattyy_pvm"]
};

const getHighestNumberedObject = (obj1) => {
  // Helper function to extract the number from a content string
  const extractNumber = str => {
    // Find the last digit in the string
    let i = str.length - 1;
    while (i >= 0 && !/\d/.test(str[i])) {
      i--;
    }
    // Extract the number
    let numStr = '';
    while (i >= 0 && /\d/.test(str[i])) {
      numStr = str[i] + numStr;
      i--;
    }
    return numStr ? parseInt(numStr, 10) : -Infinity; // Return -Infinity if no number is found
  };

  // If 'asd_x' objects exist, find the one with the highest number
  if (obj1.length > 0) {
    return obj1.reduce((maxObj, currentObj) =>
      extractNumber(currentObj.content) > extractNumber(maxObj.content) ? currentObj : maxObj
    );
  }

  // Return null if no valid objects are found
  return null;
};

const getMinObject = (latestObject) => {
  // Iterate over the keys of the object
  for (let key in latestObject) {
    // Check if the value is an array
    if (Array.isArray(latestObject[key]) && latestObject[key].length > 0) {
      // Access the first object in the array
      let firstObject = latestObject[key][0];
      return firstObject.name
    }
  }
  return null;
}

const generateDateStringArray = (updatedAttributeData) => {
  const updateAttributeArray = [];

  // Process only the keys with date strings
  Object.keys(updatedAttributeData)
    .filter(key => timeUtil.isDate(updatedAttributeData[key])) // Filter only date keys
    .map(key => ({ key, date: new Date(updatedAttributeData[key]), value: updatedAttributeData[key] })) // Map keys to real Date objects and values
    .forEach(item => {
      updateAttributeArray.push({ key: item.key, value: item.value }); // Push each sorted key-value pair into the array
    });

  return updateAttributeArray
}

const mergeAndUpdateDlArrays = (arr1, arr2, deadlineSections) => {

  const map2 = new Map(arr2.map(item => [item.key, item.value]));
  const arr1ByKey = new Map(arr1.map(item => [item.key, item]));

  // Update existing arr1 entries in place, append new ones
  for (const [key, value] of map2) {
    const existing = arr1ByKey.get(key);
    if (existing) {
      existing.value = value;
    } else {
      arr1.push({ key, value });
    }
  }

  const keyOrder = [];
  const attributeByName = new Map();

  for (const section of deadlineSections) {
    for (const sec of section.sections) {
      const phaseStart = phaseStartEndAttributes[section.title]?.[0];
      keyOrder.push(phaseStart);
      for (const attribute of sec.attributes) {
        keyOrder.push(attribute.name);
        if (!attributeByName.has(attribute.name)) {
          attributeByName.set(attribute.name, attribute);
        }
      }
      keyOrder.push(phaseStartEndAttributes[section.title]?.[1]); // Add phase end attribute
    }
  }

  // Enrich arr1 in a single linear pass
  arr1.forEach((item, i) => {
    if (phaseOrder.includes(item.key)) {
      item.distance_from_previous = 0;
      //item.order = i;
      return;
    }
    const attribute = attributeByName.get(item.key);
    if (!attribute) return;
    item.distance_from_previous = attribute.distance_from_previous || null;
    item.distance_to_next       = attribute.distance_to_next || null;
    item.initial_distance       = attribute.initial_distance?.distance || null;
    item.date_type              = attribute.date_type ?? "arkipäivät";
    //item.order                  = i;
  });

  // Sort arr1 based on the keyOrder extracted from deadlineSections
  arr1.sort((a, b) => {
    const indexA = keyOrder.indexOf(a.key);
    const indexB = keyOrder.indexOf(b.key);

    // If both keys exist in keyOrder, sort based on their index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only one key exists in keyOrder, prioritize that one
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // If neither key exists in keyOrder, maintain their original order
    return 0;
  });

  //Return in order array ready for comparing next and previous value distances
  arr1 = arr1.filter(item => !item.key.includes("viimeistaan_lausunnot_") && !item.key.includes("viimeistaan_mielipiteet") && !item.key.includes("aloituskokous_suunniteltu_pvm_readonly")); //filter out has no next and prev values
  return arr1
}
// TODO: remove (already done in mergeAndUpdateDlArrays) and use that function instead
export const sortPhaseData = (arr, order) => {
  arr.sort((a, b) => {
    // check for the 'order' property
    const aHasOrder = Object.hasOwn(a, 'order');
    const bHasOrder = Object.hasOwn(b, 'order');

    // If both items have 'order', keep their relative positions
    if (aHasOrder && bHasOrder) {
      return 0; // Maintain original order for these items
    }
    // If only one of them has 'order', prioritize that one to stay in place
    if (aHasOrder) return -1;
    if (bHasOrder) return 1;

    // Otherwise, sort based on the provided order array
    return order.indexOf(a.key) - order.indexOf(b.key);
  });
  return arr
}

// TODO: delete this function as unused
export const bumpPhaseStartsToPrevEnd = (arr) => {
  const filteredArr = arr.filter(item => phaseOrder.includes(item.key));
  // Ensure each subsequent value is equal to or greater than the previous one
  for (let i = 1; i < filteredArr.length; i++) {
    if (filteredArr[i - 1].key.includes("paattyy_pvm") && filteredArr[i].key.includes("alkaa_pvm")) {
      // Convert values to Date objects for comparison
      const previousValue = new Date(filteredArr[i - 1].value);
      const currentValue = new Date(filteredArr[i].value);

      // Adjust the current value if it's less than the previous value
      if (currentValue < previousValue) {
        filteredArr[i].value = filteredArr[i - 1].value;
      }
    }
  }
  // Replace the original elements in arr with updated elements from filteredArr
  const result = arr.map(item => {
    const updatedItem = filteredArr.find(filteredItem => filteredItem.key === item.key);
    return updatedItem || item;
  });
  return result
}

// Function to update original object by comparing keys
const updateOriginalObject = (originalObj, updatedArr) => {
  updatedArr.forEach(item => {
    if (Object.hasOwn(originalObj, item.key)) {
      originalObj[item.key] = item.value; // Update value if key exists
    }
  });
  return originalObj;
}

// Helper function to compare values
const compareObjectValues = (key, value1, value2) => {
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    return findDifferencesInObjects(value1, value2).map(diff => ({
      key: `${key}.${diff.key}`, // Nesting the key to show hierarchy
      obj1: diff.obj1,
      obj2: diff.obj2
    })); // Recursively compare if both are objects
  } else if (value1 !== value2) {
    return [{ key, obj1: value1, obj2: value2 }]; // Return an array of differences
  }
  return []; // No difference
}
// compare 2 objects and get differences and return them in array
const findDifferencesInObjects = (obj1, obj2) => {
  let differences = [];

  // Compare properties of obj1 and obj2
  for (let key in obj1) {
    if (Object.hasOwn(obj1, key)) {
      const diff = compareObjectValues(key, obj1[key], obj2[key]);
      differences = [...differences, ...diff];
    }
  }
  // Check for properties that are in obj2 but not in obj1
  for (let key in obj2) {
    if (Object.hasOwn(obj2, key) && !(key in obj1)) {
      differences.push({ key, obj1: undefined, obj2: obj2[key] });
    }
  }

  return differences;
}
// Function to find the item for example where item.name === inputName
const findMatchingName = (array, inputName, key) => {
  return array.find(item => item[key] === inputName);
};
// Function to find the item before the one for example where item.name === inputName
const findItem = (array, inputName, key, direction) => {
  //if direction is 1 then find next item or -1 for previous
  const index = array.findIndex(item => item[key] === inputName);
  // If index is valid and direction is either 1 (next) or -1 (previous)
  if (index !== -1) {
    const newIndex = index + direction;
    // Ensure the new index is within bounds of the array
    if (newIndex >= 0 && newIndex < array.length) {
      return array[newIndex]; // Return the next or previous item based on direction
    }
  }

  return null; // Return null if no next or previous item is found
};

const filterHiddenKeys = (attributeData, deadlines) => {
  return Object.entries(attributeData).reduce((acc, [key, value]) => {
    const dl = findDeadlineInDeadlines(key, deadlines);
    if (!dl || shouldDeadlineBeVisible(dl.deadline.attribute, dl.deadline.deadlinegroup, attributeData)) {
      acc[key] = value;
    }
    return acc
  }, {})
}

const filterHiddenKeysUsingSections = (attributeData, deadlineSections) => {
  return Object.entries(attributeData).reduce((acc, [key, value]) => {
    const dl = findDeadlineInDeadlineSections(key, deadlineSections);
    if (dl) {
      // Deadline found in sections - use standard visibility check
      if (shouldDeadlineBeVisible(dl.name, dl.attributegroup, attributeData)) {
        acc[key] = value;
      }
    } else {
      // Numbered deadline keys not in sections - infer visibility from attribute data
      const inferredVisibility = inferVisibilityForUnmappedDeadline(key, attributeData);
      if (inferredVisibility !== false) {
        acc[key] = value;
      }
    }
    return acc
  }, {})
}

/**
 * Infer visibility for deadline keys not present in deadlineSections.
 * This handles numbered variants (_2, _3, _4) that may not be in the schema but exist in stored data.
 * 
 * @param {string} key - The attribute key (e.g., "luonnosaineiston_maaraaika_3")
 * @param {object} attributeData - The form/attribute data containing visibility bools
 * @returns {boolean|null} - false if definitely hidden, true/null if should be included
 */
const inferVisibilityForUnmappedDeadline = (key, attributeData) => {
  // Skip visibility bool keys themselves - they should never be filtered
  if (key.startsWith('jarjestetaan_') || key.match(/_lautakuntaan_\d+$/) || key.match(/nahtaville_\d+$/)) {
    return true;
  }
  
  // Extract the suffix number if present (e.g., "_3" from "luonnosaineiston_maaraaika_3")
  const suffixMatch = key.match(/_(\d+)$/);
  if (!suffixMatch) {
    return true;  // No numbered suffix - not a variant, include it
  }
  
  const index = suffixMatch[1];
  
  // Patterns mapped to visibility bool templates
  // Template uses {index} placeholder
  const patternToVisBool = [
    // Luonnos esilläolo
    { patterns: ['luonnosaineiston_maaraaika', 'luonnos_esillaolo', 'mielipiteet_luonnos'], 
      visBool: 'jarjestetaan_luonnos_esillaolo_{index}' },
    // Luonnos lautakunta  
    { patterns: ['kaavaluonnos_lautakunnassa', 'kaavaluonnos_kylk'], 
      visBool: 'kaavaluonnos_lautakuntaan_{index}' },
    // Periaatteet esilläolo
    { patterns: ['periaatteet_esillaolo', 'mielipiteet_periaatteista'], 
      visBool: 'jarjestetaan_periaatteet_esillaolo_{index}' },
    // Periaatteet lautakunta
    { patterns: ['periaatteet_lautakunnassa', 'periaatteet_lautakunta_aineiston'], 
      visBool: 'periaatteet_lautakuntaan_{index}' },
    // OAS esilläolo
    { patterns: ['oas_esillaolo', 'mielipiteet_oas'], 
      visBool: 'jarjestetaan_oas_esillaolo_{index}' },
    // Ehdotus lautakunta
    { patterns: ['kaavaehdotus_lautakunnassa', 'ehdotus_kylk'], 
      visBool: 'kaavaehdotus_lautakuntaan_{index}' },
    // Tarkistettu ehdotus lautakunta
    { patterns: ['tarkistettu_ehdotus_lautakunnassa', 'tarkistettu_ehdotus_kylk'], 
      visBool: 'tarkistettu_ehdotus_lautakuntaan_{index}' },
  ];
  
  for (const mapping of patternToVisBool) {
    if (mapping.patterns.some(p => key.includes(p))) {
      const visBool = mapping.visBool.replace('{index}', index);
      if (attributeData[visBool] === false) {
        return false;
      }
      return null;  // Pattern matched, but visibility bool is not false
    }
  }
  
  // Ehdotus nähtävilläolo - special case with different bool names
  const nahtavillaPatterns = ['ehdotuksen_nahtavilla', 'ehdotus_nahtaville', 'lausunnot_ehdotuksesta'];
  if (nahtavillaPatterns.some(p => key.includes(p))) {
    const visBool = index === '1' 
      ? `kaavaehdotus_nahtaville_${index}`
      : `kaavaehdotus_uudelleen_nahtaville_${index}`;
    if (attributeData[visBool] === false) {
      return false;
    }
    return null;
  }
  
  // No matching pattern found, include by default
  return null;
}

const findDeadlineInDeadlines = (deadlineName, deadlineObjects) => {
  for (const deadline of deadlineObjects) {
    if (deadlineName && deadline?.deadline?.attribute === deadlineName) {
      return deadline;
    }
  }
}

const findDeadlineInDeadlineSections = (deadlineName, deadlineSections) => {
  for (const phaseSection of deadlineSections) {
    if (!phaseSection?.sections[0]?.attributes) {
      return undefined;
    }
    for (const dlObject of phaseSection.sections[0].attributes) {
      if (dlObject.name === deadlineName) {
        return dlObject;
      }
    }
  }
}

const convertKey = {
  tarkasta_esillaolo_periaatteet_fieldset: 'milloin_periaatteet_esillaolo_alkaa',
  tarkasta_lautakunta_periaatteet_fieldset: 'milloin_periaatteet_lautakunnassa',
  tarkasta_esillaolo_oas_fieldset: 'milloin_oas_esillaolo_alkaa',
  tarkasta_esillaolo_luonnos_fieldset: 'milloin_luonnos_esillaolo_alkaa',
  tarkasta_lautakunta_luonnos_fieldset: 'milloin_kaavaluonnos_lautakunnassa',
  tarkasta_nahtavilla_ehdotus_fieldset: 'milloin_ehdotuksen_nahtavilla_alkaa_pieni',
  tarkasta_lautakunta_ehdotus_fieldset: 'milloin_kaavaehdotus_lautakunnassa',
  tarkasta_lautakunta_tarkistettu_ehdotus_fieldset: 'milloin_tarkistettu_ehdotus_lautakunnassa',
  merkitse_hyvaksymis_fieldset: 'hyvaksymispaatos_pvm',
  merkitse_muutoksenhaku_paivamaarat_fieldset: 'hyvaksymispaatos_valitusaika_paattyy',
  merkitse_voimaantulo_paivamaarat_fieldset: 'voimaantulo_pvm'
};

const convertKeyToMatching = (payload) => {
  const { name, ...rest } = payload;
  const value = convertKey[name] || name;
  return { ...rest, name: value };
};

const phaseID = [
  { id: [1, 7, 13, 19, 25], name: "Käynnistys" },
  { id: [26], name: "Periaatteet" },
  { id: [2, 8, 14, 20, 27], name: "OAS" },
  { id: [28], name: "Luonnos" },
  { id: [3, 9, 15, 21, 29], name: "Ehdotus" },
  { id: [4, 10, 16, 22, 30], name: "Tarkistettu ehdotus" },
  { id: [5, 11, 17, 23, 31], name: "Hyväksyminen" },
  { id: [6, 12, 18, 24, 32], name: "Voimaantulo" }
];

const convertPhaseIdToPhaseName = (id) => {
  const phase = phaseID.find(phase => phase.id.includes(id));
  return phase ? phase.name : null;
};

const convertPayloadValues = (payload) => {
  const convertedKeyPayload = convertKeyToMatching(payload);
  const phaseName = convertPhaseIdToPhaseName(payload.selectedPhase);
  return { ...convertedKeyPayload, selectedPhase: phaseName };
};

const exported = {
  getHighestNumberedObject,
  getMinObject,
  mergeAndUpdateDlArrays,
  generateDateStringArray,
  updateOriginalObject,
  findDifferencesInObjects,
  compareObjectValues,
  findMatchingName,
  findItem,
  filterHiddenKeys,
  convertKeyToMatching,
  convertPhaseIdToPhaseName,
  convertPayloadValues,
  filterHiddenKeysUsingSections
}

if (process.env.UNIT_TEST === "true") {
  exported.bumpPhaseStartsToPrevEnd = bumpPhaseStartsToPrevEnd
  exported.sortPhaseData = sortPhaseData
  exported.expectedOrder = phaseOrder
  exported.findDeadlineInDeadlines = findDeadlineInDeadlines
  exported.findDeadlineInDeadlineSections = findDeadlineInDeadlineSections
}

export default exported;