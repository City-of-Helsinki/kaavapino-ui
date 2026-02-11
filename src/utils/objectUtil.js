import { shouldDeadlineBeVisible } from "./projectVisibilityUtils";
import timeUtil from "./timeUtil";

// Extract phase prefix from a deadline key to determine if deadlines are in the same phase
const getPhasePrefix = (key) => {
  if (!key) return null;
  // Phase boundary fields like "oasvaihe_alkaa_pvm" or "periaatteetvaihe_paattyy_pvm"
  if (key.includes('vaihe_')) return key.split('vaihe_')[0] + 'vaihe';
  // Phase-specific deadlines
  if (key.includes('periaatteet') || key.includes('periaatteista')) return 'periaatteet';
  if (key.includes('oas_') || key.includes('_oas')) return 'oas';
  if (key.includes('luonnos') || key.includes('kaavaluonnos')) return 'luonnos';
  if (key.includes('ehdotus') || key.includes('kaavaehdotus') || key.includes('ehdotuksesta')) return 'ehdotus';
  if (key.includes('tarkistettu_ehdotus') || key.includes('tarkistettuehdotus')) return 'tarkistettu_ehdotus';
  if (key.includes('hyvaksyminen') || key.includes('hyvaksymis')) return 'hyvaksyminen';
  if (key.includes('voimaantulo')) return 'voimaantulo';
  if (key.includes('kaynnistys')) return 'kaynnistys';
  return null; // Unknown phase
};

// Check if a key is a phase boundary field (alkaa_pvm or paattyy_pvm)
const isPhaseBoundary = (key) => {
  if (!key) return false;
  return key.endsWith('_alkaa_pvm') || key.endsWith('_paattyy_pvm');
};

// KAAV-3517: Derive the phase start key from a kylk_maaraaika key
// Maps e.g. "tarkistettu_ehdotus_kylk_maaraaika" → "tarkistettuehdotusvaihe_alkaa_pvm"
const derivePhaseStartKeyFromKylkMaaraaika = (key) => {
  if (!key) return null;
  
  // Map from kylk_maaraaika patterns to phase start keys
  const mappings = {
    'tarkistettu_ehdotus_kylk_maaraaika': 'tarkistettuehdotusvaihe_alkaa_pvm',
    'ehdotus_kylk_aineiston_maaraaika': 'ehdotusvaihe_alkaa_pvm',
    'kaavaluonnos_kylk_aineiston_maaraaika': 'luonnosvaihe_alkaa_pvm',
    'periaatteet_lautakunta_aineiston_maaraaika': 'periaatteetvaihe_alkaa_pvm',
  };

  // Direct mapping first
  if (mappings[key]) return mappings[key];

  // Fallback pattern matching for variations
  if (key.includes('tarkistettu_ehdotus') && (key.includes('kylk_maaraaika') || key.includes('kylk_aineiston_maaraaika'))) {
    return 'tarkistettuehdotusvaihe_alkaa_pvm';
  }
  if (key.includes('ehdotus') && !key.includes('tarkistettu') && (key.includes('kylk_maaraaika') || key.includes('kylk_aineiston_maaraaika'))) {
    return 'ehdotusvaihe_alkaa_pvm';
  }
  if ((key.includes('luonnos') || key.includes('kaavaluonnos')) && (key.includes('kylk_maaraaika') || key.includes('kylk_aineiston_maaraaika'))) {
    return 'luonnosvaihe_alkaa_pvm';
  }
  if (key.includes('periaatteet') && (key.includes('lautakunta_aineiston_maaraaika') || key.includes('kylk_maaraaika'))) {
    return 'periaatteetvaihe_alkaa_pvm';
  }

  return null;
};

// KAAV-3517: Derive the previous phase end key from a phase start key
// Maps e.g. "tarkistettuehdotusvaihe_alkaa_pvm" → "ehdotusvaihe_paattyy_pvm"
const derivePreviousPhaseEndKey = (phaseStartKey) => {
  if (!phaseStartKey) return null;

  const phaseBoundaryPairs = {
    'tarkistettuehdotusvaihe_alkaa_pvm': 'ehdotusvaihe_paattyy_pvm',
    'ehdotusvaihe_alkaa_pvm': 'luonnosvaihe_paattyy_pvm', // Only when luonnos phase exists
    'luonnosvaihe_alkaa_pvm': 'oasvaihe_paattyy_pvm',
    'oasvaihe_alkaa_pvm': 'periaatteetvaihe_paattyy_pvm', // Only when periaatteet phase exists
    'periaatteetvaihe_alkaa_pvm': 'kaynnistys_paattyy_pvm',
    'hyvaksyminenvaihe_alkaa_pvm': 'tarkistettuehdotusvaihe_paattyy_pvm',
    'voimaantulovaihe_alkaa_pvm': 'hyvaksyminenvaihe_paattyy_pvm',
  };

  return phaseBoundaryPairs[phaseStartKey] || null;
};

//Phase main start and end value order should always be the same
const order = [
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

// Function to extract the number after the last underscore and return the object with the larger number
const getNumberFromString = (arr) => {
  let largestObject = null;
  let largestNumber = -Infinity;

  arr.forEach(obj => {
    const match = obj.attributegroup.match(/_(\d+)$/); // Match digits after the last underscore
    if (match) {
      const number = parseInt(match[1], 10); // Get the number
      if (number > largestNumber) { // Compare with the current largest number
        largestNumber = number;
        largestObject = obj;
      }
    }
  });

  return largestObject; // Return the object with the largest number
}

const findValuesWithStrings = (arr, str1, str2, str3, str4) => {
  let arrOfObj = arr.filter(obj => obj.name.includes(str1) && obj.name.includes(str2) && obj.name.includes(str3) && obj.name.includes(str4));
  // Get the object with the largest number from the array
  const largest = getNumberFromString(arrOfObj);
  return largest
};

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

const compareAndUpdateArrays = (arr1, arr2, deadlineSections) => {
  let changes = [];
  // Convert arr2 to a map for easier lookups
  const map2 = new Map(arr2.map(item => [item.key, item.value]));

  // Iterate through arr1 and update values if a matching key is found in arr2
  for (let i = 0; i < arr1.length; i++) {
    const key = arr1[i].key;
    const value1 = arr1[i].value;

    if (map2.has(key)) {
      const value2 = map2.get(key);

      // If values differ, update the value in arr1 and record the change
      if (value1 !== value2) {
        changes.push({
          key: key,
          oldValue: value1,
          newValue: value2
        });
        arr1[i].value = value2; // Update the value in arr1
      }
    }
  }

  // Check for keys in arr2 that are missing in arr1
  for (let [key, value2] of map2) {
    if (!arr1.find(item => item.key === key)) {
      changes.push({
        key: key,
        oldValue: 'Not found in first array',
        newValue: value2
      });
      // Optionally, add the missing key-value pair to arr1
      arr1.push({ key: key, value: value2 });
    }
  }
  // Adding distance_from_previous and distance_to_next to arr1 from deadlineSections
  for (let i = 0; i < arr1.length; i++) {
    const arr1Key = arr1[i].key;

    // Iterate over each section in deadlineSections
    for (let section of deadlineSections) {
      // Iterate over each attribute in section's attributes array
      for (let sec of section.sections) {
        for (let attribute of sec.attributes) {
          if (attribute.name === arr1Key) {
            // Found a match, now add distance_from_previous and distance_to_next
            arr1[i].distance_from_previous = attribute?.distance_from_previous || null;
            arr1[i].distance_to_next = attribute?.distance_to_next || null;
            arr1[i].initial_distance = attribute?.initial_distance?.distance || null
            arr1[i].date_type = attribute?.date_type ?? "arkipäivät";
            arr1[i].order = i;
            break; // Exit the loop once the match is found
          }
        }
      }
    }
  }

  // Extract the order of keys (names) from deadlineSections
  //DeadlineSections has the correct order always
  let keyOrder = [];
  for (let section of deadlineSections) {
    for (let sec of section.sections) {
      for (let attribute of sec.attributes) {
        keyOrder.push(attribute.name);  // Get the order of names
      }
    }
  }

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

  //Sort phase start end data by order const
  arr1 = sortPhaseData(arr1, order)
  //Return in order array ready for comparing next and previous value distances
  arr1 = arr1.filter(item => !item.key.includes("viimeistaan_lausunnot_") && !item.key.includes("viimeistaan_mielipiteet") && !item.key.includes("aloituskokous_suunniteltu_pvm_readonly")); //filter out has no next and prev values
  return arr1
}
//Sort by certain predetermined order
const sortPhaseData = (arr, order) => {
  arr.sort((a, b) => {
    // check for the 'order' property
    const aHasOrder = Object.prototype.hasOwnProperty.call(a, 'order');
    const bHasOrder = Object.prototype.hasOwnProperty.call(b, 'order');

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

  arr = increasePhaseValues(arr)
  return arr
}

const increasePhaseValues = (arr) => {
  const filteredArr = arr.filter(item => order.includes(item.key));
  // Ensure each subsequent value is equal to or greater than the previous one
  for (let i = 1; i < filteredArr.length; i++) {
    if (filteredArr[i - 1].key.includes("paattyy_pvm") && filteredArr[i].key.includes("alkaa_pvm") || filteredArr[i].key.includes("kaynnistys_pvm")) {
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
    return updatedItem ? updatedItem : item;
  });
  return result
}

const checkForDecreasingValues = (arr, isAdd, field, disabledDates, oldDate, movedDate, moveToPast, projectSize, attributeData) => {


  // Lock logic: do not mutate dates that are (a) in the past or (b) confirmed via vahvista_* flags
  // attributeData is the filtered attribute_data object (only visible fields) so we can inspect confirmation flags
  let confirmedFieldSet = null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (attributeData) {
    try {
      // Lazy load to avoid circular deps (generateConfirmedFields depends on constants only)
      const { confirmationAttributeNames } = require('./constants');
      const { generateConfirmedFields } = require('./generateConfirmedFields');
      // Phase names that have confirmation flags (exclude kaynnistys, hyvaksyminen, voimaantulo as per saga usage)
      const phaseNames = ['periaatteet', 'oas', 'luonnos', 'ehdotus', 'tarkistettu_ehdotus'];
      confirmedFieldSet = new Set(generateConfirmedFields(attributeData, confirmationAttributeNames, phaseNames));
    }
    catch (e) {
      // Fail silently – if generation fails we simply don't lock by confirmation (past locking still applies)
    }
  }
  // Helper to decide if an item should be frozen
  const isLocked = (item) => {
    if (!item?.value) return false;
    const d = new Date(item.value);
    if (!isNaN(d) && d < today) return true;
    return confirmedFieldSet ? confirmedFieldSet.has(item.key) : false;
  };
  // Find the index of the next item where dates should start being pushed
  const currentIndex = arr.findIndex(item => item.key === field);
  let indexToContinue = 0
  // If adding items
  if (isAdd) {
    // Move the nextItem and all following items forward if item minium is exceeded
    for (let i = currentIndex; i < arr.length; i++) {
      if (isLocked(arr[i])) continue; // skip locked items entirely
      if (!arr[i].key.includes("voimaantulo_pvm") && !arr[i].key.includes("rauennut") && !arr[i].key.includes("kumottu_pvm") && !arr[i].key.includes("tullut_osittain_voimaan_pvm")
        && !arr[i].key.includes("valtuusto_poytakirja_nahtavilla_pvm") && !arr[i].key.includes("hyvaksymispaatos_valitusaika_paattyy") && !arr[i].key.includes("valtuusto_hyvaksymiskuulutus_pvm")
        && !arr[i].key.includes("hyvaksymispaatos_pvm")) {
        let newDate = new Date(arr[i].value);
        // Note: initial_distance is for initial project generation; cascade operations use distance_from_previous
        // miniumGap is kept for compatibility with non-cascade operations within this loop
        const miniumGap = arr[i].initial_distance ?? arr[i].distance_from_previous ?? 0
        
        if (arr[i - 1].key.includes("paattyy") && arr[i].key.includes("mielipiteet") || arr[i - 1].key.includes("paattyy") && arr[i].key.includes("lausunnot")) {
          //mielipiteet and paattyy is always the same value
          newDate = new Date(arr[i - 1].value);
        }
        else {
          // Only push forward if there's an actual overlap
          const prevDate = new Date(arr[i - 1].value);
          const currDate = new Date(arr[i].value);
          const hasOverlap = prevDate >= currDate;
          
          if (hasOverlap) {
            // Use distance_from_previous for cascade; initial_distance is only for project generation
            const cascadeGap = arr[i].distance_from_previous ?? miniumGap;
            //Calculate difference between two dates and rule out holidays and set on date type specific allowed dates and keep minium gaps
            newDate = arr[i]?.date_type ? timeUtil.dateDifference(arr[i].key, arr[i - 1].value, arr[i].value, disabledDates?.date_types[arr[i]?.date_type]?.dates, disabledDates?.date_types?.disabled_dates?.dates, cascadeGap, projectSize, true) : newDate
          }
          else {
            // No overlap - keep current date unchanged
          }
        }
        // Update the array with the new date
        newDate.setDate(newDate.getDate());
        const finalValue = newDate.toISOString().split('T')[0];
        
        arr[i].value = finalValue;
        //Move phase start and end dates
        if (arr[i].distance_from_previous === undefined && arr[i].key.endsWith('_pvm') && arr[i].key.includes("_paattyy_")) {
          const targetSubstring = arr[i].key.split('vaihe')[0];
          // Iterate backwards from the given index
          const res = reverseIterateArray(arr, i, targetSubstring)
          const differenceInTime = new Date(res) - new Date(arr[i].value)
          const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);
          if (differenceInDays >= 5) {
            arr[i].value = res
            if (arr[i]?.key?.includes("tarkistettuehdotusvaihe_paattyy_pvm")) {
              //Move hyvaksyminenvaihe_paattyy_pvm and voimaantulovaihe_paattyy_pvm as many days as tarkistettuehdotusvaihe_paattyy_pvm
              const items = arr.filter(el => el.key?.includes("hyvaksyminenvaihe_paattyy_pvm") || el.key?.includes("voimaantulovaihe_paattyy_pvm"));
              if (items) {
                items.forEach(item => {
                  const currentDate = new Date(item.value);
                  currentDate.setDate(currentDate.getDate() + differenceInDays);
                  item.value = currentDate.toISOString().split('T')[0];
                });
              }
            }
          }
        }
      }
    }
  }
  else if (currentIndex !== -1) {
    // Save original values before mutation to prevent cascading against just-updated values
    const originalValues = arr.map(item => item.value);

    for (let i = currentIndex; i < arr.length; i++) {
      if (isLocked(arr[i])) continue; // do not move locked items
      if (!arr[i].key.includes("voimaantulo_pvm") && !arr[i].key.includes("rauennut") && !arr[i].key.includes("kumottu_pvm") && !arr[i].key.includes("tullut_osittain_voimaan_pvm")
        && !arr[i].key.includes("valtuusto_poytakirja_nahtavilla_pvm") && !arr[i].key.includes("hyvaksymispaatos_valitusaika_paattyy") && !arr[i].key.includes("valtuusto_hyvaksymiskuulutus_pvm")
        && !arr[i].key.includes("hyvaksymispaatos_pvm")) {
        let newDate = new Date(arr[i].value);
        if (arr[i - 1]?.key?.includes("paattyy") && arr[i]?.key?.includes("mielipiteet")) {
          //mielipiteet and paattyy is always the same value
          newDate = new Date(arr[i - 1].value);
        }
        else {
          //Paattyy and nahtavillaolo l-xl are independent of other values
          if (
            ((projectSize === "XS" || projectSize === "S" || projectSize === "M") && i === currentIndex) ||
            ((projectSize === "XL" || projectSize === "L") && i === currentIndex)
          ) {
            //Make next or previous or previous and 1 after previous dates follow the moved date if needed
            if (arr[currentIndex]?.key?.includes("kylk_maaraaika") || arr[currentIndex]?.key?.includes("kylk_aineiston_maaraaika") || arr[currentIndex]?.key?.includes("_lautakunta_aineiston_maaraaika")) {
              //maaraika in lautakunta moving - forward cascade to lautakunnassa
              const lautakuntaResult = timeUtil.findAllowedLautakuntaDate(movedDate, arr[i + 1].initial_distance, disabledDates?.date_types[arr[i + 1]?.date_type]?.dates, false, disabledDates?.date_types[arr[i]?.date_type]?.dates);
              arr[i + 1].value = new Date(lautakuntaResult).toISOString().split('T')[0];
              indexToContinue = i + 1
              
              // KAAV-3517 FIX: Backward cascade when moving kylk_maaraaika to past
              // The predecessor (phase start like tarkistettuehdotusvaihe_alkaa_pvm) must also move backwards
              // to maintain the minimum distance (distance_from_previous) from phase start to maaraaika
              if (moveToPast) {
                const phaseStartKey = derivePhaseStartKeyFromKylkMaaraaika(arr[currentIndex].key);
                if (phaseStartKey) {
                  const phaseStartIndex = arr.findIndex(item => item.key === phaseStartKey);
                  if (phaseStartIndex !== -1) {
                    const distance = arr[currentIndex].distance_from_previous ?? 6; // default 6 work days per database_deadline_rules.md
                    const phaseStartAllowedDates = disabledDates?.date_types[arr[phaseStartIndex]?.date_type]?.dates;
                    
                    // Calculate required phase start: movedDate - distance work days
                    // Phase starts typically don't have date_type, so we may need to calculate manually
                    let newPhaseStartDate;
                    if (phaseStartAllowedDates && phaseStartAllowedDates.length > 0) {
                      const requiredPhaseStart = timeUtil.findAllowedDate(movedDate, distance, phaseStartAllowedDates, true);
                      newPhaseStartDate = new Date(requiredPhaseStart).toISOString().split('T')[0];
                    } else {
                      // Fallback: calculate by subtracting work days manually
                      // Use the maaraaika's date_type allowed dates to count backwards
                      const maaraikaAllowedDates = disabledDates?.date_types[arr[currentIndex]?.date_type]?.dates;
                      if (maaraikaAllowedDates && maaraikaAllowedDates.length > 0) {
                        const requiredPhaseStart = timeUtil.findAllowedDate(movedDate, distance, maaraikaAllowedDates, true);
                        newPhaseStartDate = new Date(requiredPhaseStart).toISOString().split('T')[0];
                      } else {
                        // Last fallback: simple calendar day subtraction (not work days, but better than nothing)
                        const fallbackDate = new Date(movedDate);
                        fallbackDate.setDate(fallbackDate.getDate() - (distance + Math.ceil(distance / 5) * 2)); // Rough work day estimate
                        newPhaseStartDate = fallbackDate.toISOString().split('T')[0];
                      }
                    }
                    
                    // Only update if new phase start is earlier than current
                    if (new Date(newPhaseStartDate) < new Date(arr[phaseStartIndex].value)) {
                      arr[phaseStartIndex].value = newPhaseStartDate;
                      
                      // Also update phase end (paattyy) for the previous phase since phase start = previous phase end
                      const prevPhaseEndKey = derivePreviousPhaseEndKey(phaseStartKey);
                      if (prevPhaseEndKey) {
                        const prevPhaseEndIndex = arr.findIndex(item => item.key === prevPhaseEndKey);
                        if (prevPhaseEndIndex !== -1 && new Date(newPhaseStartDate) < new Date(arr[prevPhaseEndIndex].value)) {
                          arr[prevPhaseEndIndex].value = newPhaseStartDate;
                        }
                      }
                    }
                  }
                }
              }
            }
            else if (arr[currentIndex]?.key?.includes("paattyy") || ((projectSize === "XL" || projectSize === "L") && (arr[currentIndex]?.key.includes("nahtavilla_alkaa") || arr[currentIndex]?.key.includes("nahtavilla_paattyy")))) {
              newDate = new Date(arr[i].value);
              indexToContinue = i
            }
            else if (arr[currentIndex]?.key?.includes("lautakunnassa") && !arr[currentIndex]?.key?.includes("lautakunnassa_") || arr[currentIndex]?.key?.includes("alkaa")) {
              //lautakunta and alkaa values
              const maaraaikaResult = timeUtil.findAllowedDate(movedDate, arr[i].initial_distance, disabledDates?.date_types[arr[i - 1]?.date_type]?.dates, true);
              arr[i - 1].value = new Date(maaraaikaResult).toISOString().split('T')[0];
              indexToContinue = i
            }
            else if (arr[currentIndex]?.key?.includes("maaraaika")) {
              //Maaraiaka moving
              const oldStartISO = arr[i + 1]?.value;
              const oldEndISO = arr[i + 2]?.value;
              const endAllowed = disabledDates?.date_types[arr[i + 2]?.date_type]?.dates || [];
              const alkaaResult = timeUtil.findAllowedDate(movedDate, arr[i + 1].initial_distance, disabledDates?.date_types[arr[i]?.date_type]?.dates, false);
              arr[i + 1].value = new Date(alkaaResult).toISOString().split('T')[0];
              indexToContinue = i + 1
              if (!arr[currentIndex]?.key?.includes("kylk_maaraaika") && !arr[currentIndex]?.key?.includes("kylk_aineiston_maaraaika") && !arr[currentIndex]?.key?.includes("_lautakunta_aineiston_maaraaika") && !arr[currentIndex]?.key?.includes("lautakunnassa") && arr[currentIndex]?.key?.includes("maaraaika")) {
                let timespan = 0;
                //Keep the same timespan between alkaa and paattyy if both are defined
                if (endAllowed.length && oldStartISO && oldEndISO) {
                  const start = endAllowed.findIndex(d => d >= oldStartISO);
                  const end = endAllowed.findIndex(d => d >= oldEndISO);
                  if (start !== -1 && end !== -1 && end >= start) timespan = end - start;
                }
                const val = endAllowed.findIndex(d => d >= arr[i + 1].value);
                let kept = (val !== -1 && val + timespan < endAllowed.length) ? endAllowed[val + timespan] : null;
                if (!kept) {
                  kept = timeUtil.findAllowedDate(arr[i + 1].value, arr[i + 2].initial_distance, endAllowed, false);
                }
                arr[i + 2].value = new Date(kept).toISOString().split('T')[0];
                indexToContinue = i + 2
              }
            }
          }
          else {
            if (!moveToPast && i > indexToContinue) {
              // Only push forward if there's an actual overlap (use original values to prevent cascade chain reactions)
              const prevDate = new Date(originalValues[i - 1]);
              const currDate = new Date(originalValues[i]);
              // Use distance_from_previous (minimum distance) for moving dates
              const miniumGap = arr[i].distance_from_previous ?? 0
              
              // Skip cross-phase cascade for non-boundary deadlines
              // Only phase boundaries (alkaa_pvm/paattyy_pvm) cascade across phase transitions
              const currPhase = getPhasePrefix(arr[i].key);
              const prevPhase = getPhasePrefix(arr[i - 1]?.key);
              const isCrossPhase = currPhase && prevPhase && currPhase !== prevPhase;
              const currIsPhaseBoundary = isPhaseBoundary(arr[i].key);
              
              // Skip cascade if cross-phase transition and not a phase boundary
              if (isCrossPhase && !currIsPhaseBoundary) {
                // Don't modify newDate - keep the original value
              }
              else if (prevDate >= currDate) {
                //Calculate difference between two dates and rule out holidays and set on date type specific allowed dates and keep minium gaps
                newDate = arr[i]?.date_type ? timeUtil.dateDifference(arr[i].key, originalValues[i - 1], originalValues[i], disabledDates?.date_types[arr[i]?.date_type]?.dates, disabledDates?.date_types?.disabled_dates?.dates, miniumGap, projectSize, false) : newDate
                newDate = new Date(newDate)
              }
            }
          }
        }
        // Update the array with the new date
        newDate.setDate(newDate.getDate());
        arr[i].value = newDate.toISOString().split('T')[0];
        //Move phase start and end dates
        if (arr[i].distance_from_previous === undefined && arr[i].key.endsWith('_pvm') && arr[i].key.includes("_paattyy_")
          && !arr[i].key.includes("voimaantulo_pvm") && !arr[i].key.includes("rauennut") && !arr[i].key.includes("kumottu_pvm") && !arr[i].key.includes("tullut_osittain_voimaan_pvm")) {
          const targetSubstring = arr[i].key.split('vaihe')[0];
          // Iterate backwards from the given index
          const res = reverseIterateArray(arr, i, targetSubstring)
          const differenceInTime = new Date(res) - new Date(arr[i].value)
          const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);
          if (differenceInDays >= 5) {
            arr[i].value = res
            if (arr[i]?.key?.includes("tarkistettuehdotusvaihe_paattyy_pvm")) {
              //Move hyvaksyminenvaihe_paattyy_pvm and voimaantulovaihe_paattyy_pvm as many days as tarkistettuehdotusvaihe_paattyy_pvm
              const items = arr.filter(el => el.key?.includes("hyvaksyminenvaihe_paattyy_pvm") || el.key?.includes("voimaantulovaihe_paattyy_pvm"));
              if (items) {
                items.forEach(item => {
                  const currentDate = new Date(item.value);
                  currentDate.setDate(currentDate.getDate() + differenceInDays);
                  item.value = currentDate.toISOString().split('T')[0];
                });
              }
            }
          }
        }
      }
    }
  }
  sortPhaseData(arr, order)



  return arr
}

const reverseIterateArray = (arr, index, target) => {
  let targetString = target
  if (target === "tarkistettuehdotus") {
    //other values in array at tarkistettu ehdotus phase are with _ but phase values are without
    targetString = "tarkistettu_ehdotus"
  }
  else if (target === "ehdotus") {
    targetString = ["ehdotuksen", "kaavaehdotus", "ehdotus"]
  }
  for (let i = index - 1; arr.length >= 0 && i >= 0; i--) {
    // Check if 'distance_from_previous' attribute does not exist and if the key contains the target substring
    if (target === "ehdotus") {
      for (let j = 0; j < targetString.length; j++) {
        if (!arr[i].key.includes('tarkistettu_ehdotus') && !arr[i].key.endsWith('_pvm') && arr[i].key.includes(targetString[j])) {
          return arr[i].value;
        }
      }
    }
    else if (arr[i].key.includes(targetString) && !arr[i].key.endsWith('_pvm')) {
      return arr[i].value;
    }
  }
  return null; // Return null if no such key is found
}

// Function to update original object by comparing keys
const updateOriginalObject = (originalObj, updatedArr) => {
  updatedArr.forEach(item => {
    if (Object.prototype.hasOwnProperty.call(originalObj, item.key)) {
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
      } else if (key.includes('luonnos') || key.includes('kaavaluonnos')) {
        console.log('[KAAV-DEBUG] FILTERED OUT (in sections, not visible):', key, value, 'group:', dl.attributegroup);
      }
    } else {
      // Deadline NOT in sections - check if it's a numbered variant that should be filtered
      // KAAV-3492 FIX: Numbered deadline keys (_2, _3, _4) not in deadlineSections
      // must still respect visibility bools to prevent stale dates from affecting cascade
      const inferredVisibility = inferVisibilityForUnmappedDeadline(key, attributeData);
      if (inferredVisibility !== false) {
        acc[key] = value;
      } else if (key.includes('luonnos') || key.includes('kaavaluonnos')) {
        console.log('[KAAV-DEBUG] FILTERED OUT (unmapped, inferred false):', key, value);
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
  findValuesWithStrings,
  compareAndUpdateArrays,
  checkForDecreasingValues,
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
  exported.getNumberFromString = getNumberFromString
  exported.increasePhaseValues = increasePhaseValues
  exported.sortPhaseData = sortPhaseData
  exported.reverseIterateArray = reverseIterateArray
  exported.expectedOrder = order
  exported.findDeadlineInDeadlines = findDeadlineInDeadlines
  exported.findDeadlineInDeadlineSections = findDeadlineInDeadlineSections
}

export default exported;