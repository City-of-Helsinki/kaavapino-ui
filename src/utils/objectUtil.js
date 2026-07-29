import { shouldDeadlineBeVisible } from "./projectVisibilityUtils";
import { generateConfirmedFields } from './generateConfirmedFields';
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
const phaseOrder = [
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
      for (const attribute of sec.attributes) {
        keyOrder.push(attribute.name);
        if (!attributeByName.has(attribute.name)) {
          attributeByName.set(attribute.name, attribute);
        }
      }
    }
  }

  // Enrich arr1 in a single linear pass
  arr1.forEach((item, i) => {
    const attribute = attributeByName.get(item.key);
    if (!attribute) return;
    item.distance_from_previous = attribute.distance_from_previous || null;
    item.distance_to_next       = attribute.distance_to_next || null;
    item.initial_distance       = attribute.initial_distance?.distance || null;
    item.date_type              = attribute.date_type ?? "arkipäivät";
    item.order                  = i;
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

  //Sort phase start end data by order const
  arr1 = sortPhaseData(arr1, phaseOrder)
  arr1 = bumpPhaseStartsToPrevEnd(arr1)
  //Return in order array ready for comparing next and previous value distances
  arr1 = arr1.filter(item => !item.key.includes("viimeistaan_lausunnot_") && !item.key.includes("viimeistaan_mielipiteet") && !item.key.includes("aloituskokous_suunniteltu_pvm_readonly")); //filter out has no next and prev values
  return arr1
}
//Sort by certain predetermined order
const sortPhaseData = (arr, order) => {
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

const bumpPhaseStartsToPrevEnd = (arr) => {
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

const cascadeDeadlineChange = ({ arr, isAdd, field, disabledDates, oldDate, movedDate, moveToPast, projectSize, attributeData, deadlineObjects = [] }) => {
  // Do not mutate dates that are (a) in the past or (b) confirmed via vahvista_* flags
  let confirmedFieldSet = new Set();
  try {
    confirmedFieldSet = new Set(generateConfirmedFields(attributeData, deadlineObjects));
  }
  catch {
    console.warn("Failed to generate confirmed fields. Confirmation-based locking will not be applied.");
  }

  // Attributes that should never be cascaded
  const IGNORED_ATTRIBUTES = [
    "kaynnistysvaihe_alkaa_pvm", "projektin_kaynnistys_pvm", "kaynnistys_paattyy_pvm", 
    "voimaantulo_pvm", "rauennut", "tullut_osittain_voimaan_pvm", "kumottu_pvm", "valtuusto_poytakirja_nahtavilla_pvm",
    "hyvaksymispaatos_valitusaika_paattyy", "valtuusto_hyvaksymiskuulutus_pvm", "hyvaksymispaatos_pvm"
  ]

  const isFrozen = (item) => {
    if (!item?.value) return false;
    const d = new Date(item.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!Number.isNaN(d) && d < today) return true;
    return confirmedFieldSet.has(item.key);
  };

  const getPreviousItem = (arr, index) => {
    let prevItem = null;
    if (arr[index].previous_deadline) {
      prevItem = arr.find(item => item.key === arr[index].previous_deadline);
    }
    if (!prevItem && index > 0) {
      prevItem = arr[index - 1];
    }
    return prevItem;
  }

  const adjustPhaseEndDates = (arr, i) => {
    const currentDeadline = arr[i];
    if (!currentDeadline.key.endsWith('paattyy_pvm') || currentDeadline.distance_from_previous !== undefined) {
      return;
    }
    const targetSubstring = currentDeadline.key.split('vaihe')[0];
    // Iterate backwards from the given index
    const res = findLastDeadlineInPhase(arr, i, targetSubstring);
    const differenceInTime = new Date(res) - new Date(currentDeadline.value);
    const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);
    if (differenceInDays >= 5) {
      currentDeadline.value = res;
      if (currentDeadline?.key?.includes("tarkistettuehdotusvaihe_paattyy_pvm")) {
        //Move hyvaksyminenvaihe_paattyy_pvm and voimaantulovaihe_paattyy_pvm as many days as tarkistettuehdotusvaihe_paattyy_pvm
        const items = arr.filter(el => el.key?.includes("hyvaksyminenvaihe_paattyy_pvm") || el.key?.includes("voimaantulovaihe_paattyy_pvm"));
        items.forEach(item => {
          const currentDate = new Date(item.value);
          currentDate.setDate(currentDate.getDate() + differenceInDays);
          item.value = currentDate.toISOString().split('T')[0];
        });
      }
    }
  }

  const handleDeadlineAdd = () => {
    // Move the nextItem and all following items forward if item minimum is exceeded
    for (let i = currentIndex; i < arr.length; i++) {
      if (isFrozen(arr[i]) || IGNORED_ATTRIBUTES.some(attr => arr[i].key.includes(attr))) {
        continue;
      }
      let newDate = new Date(arr[i].value);
      const prevItem = getPreviousItem(arr, i);

      // Skip cascade if no valid predecessor found
      if (!prevItem?.value) {
        continue;
      }

      if (prevItem.key.includes("paattyy") && (arr[i].key.includes("mielipiteet") || arr[i].key.includes("lausunnot"))) {
        //mielipiteet and paattyy is always the same value
        newDate = new Date(prevItem.value);
      }
      else {
        const currDate = new Date(arr[i].value);
        const cascadeGap = arr[i].distance_from_previous ?? 0;
          //Calculate difference between two dates and rule out holidays and set on date type specific allowed dates and keep minimum gaps
          const min_date = arr[i]?.date_type ? 
            timeUtil.dateDifference(
              arr[i].key, prevItem.value, arr[i].value, disabledDates?.date_types[arr[i]?.date_type]?.dates,
              disabledDates?.date_types?.disabled_dates?.dates, cascadeGap
            )
            : currDate;
          if (currDate < min_date) {
            newDate = new Date(min_date);
          }
      }
      // Update the array with the new date
      const finalValue = newDate.toISOString().split('T')[0];
      arr[i].value = finalValue;
      adjustPhaseEndDates(arr, i);
    }
  }

  const handleKylkMaaraaikaMove = (arr, i, movedDate, moveToPast, currentIndex) => {
    // On moving lautakunta maaraaika, adjust the next item (lautakunta date)
    const currentItem = arr[i];
    const nextItem = arr[i + 1];
    // Lautakunta maaraaika moving, set kylk date
    const lautakuntaGap = nextItem.initial_distance ?? nextItem.distance_from_previous ?? 21;
    const lautakuntaResult = timeUtil.findAllowedLautakuntaDate(movedDate, lautakuntaGap, disabledDates?.date_types[nextItem?.date_type]?.dates, false, disabledDates?.date_types[currentItem?.date_type]?.dates);
    nextItem.value = new Date(lautakuntaResult).toISOString().split('T')[0];

    // KAAV-3517 FIX: Backward cascade when moving kylk_maaraaika to past
    // The predecessor (phase start like tarkistettuehdotusvaihe_alkaa_pvm) must also move backwards
    // to maintain the minimum distance (distance_from_previous) from phase start to maaraaika

    // Note: above comment describes an illegal situation (previous deadlines must not move).
    // TODO: investigate if all this is really necessary.
    const phaseStartKey = derivePhaseStartKeyFromKylkMaaraaika(arr[currentIndex].key);
    const phaseStartIndex = arr.findIndex(item => item.key === phaseStartKey);
    if (moveToPast && phaseStartIndex !== -1) {
      const distance = currentItem.distance_from_previous ?? 6;
      const phaseStartAllowedDates = disabledDates?.date_types[arr[phaseStartIndex]?.date_type]?.dates;
      const maaraikaAllowedDates = disabledDates?.date_types[arr[currentIndex]?.date_type]?.dates; // Fallback
      const allowedDates = phaseStartAllowedDates?.length > 0 ? phaseStartAllowedDates : maaraikaAllowedDates;

      // Calculate required phase start: movedDate - distance work days
      // Phase starts typically don't have date_type, so we may need to calculate manually
      let newPhaseStartDate;
      if (allowedDates?.length > 0) {
        const requiredPhaseStart = timeUtil.findAllowedDate(movedDate, distance, allowedDates, true);
        newPhaseStartDate = new Date(requiredPhaseStart).toISOString().split('T')[0];
      } else {
        // Last fallback: simple calendar day subtraction (not work days, but better than nothing)
        const fallbackDate = new Date(movedDate);
        fallbackDate.setDate(fallbackDate.getDate() - (distance + Math.ceil(distance / 5) * 2)); // Rough work day estimate
        newPhaseStartDate = fallbackDate.toISOString().split('T')[0];
      }

      if (!newPhaseStartDate || new Date(newPhaseStartDate) > new Date(arr[phaseStartIndex].value)) {
        return; // No need to update if new phase start is later than current
      }
      arr[phaseStartIndex].value = newPhaseStartDate;

      // Also update phase end (paattyy) for the previous phase since phase start = previous phase end
      const prevPhaseEndKey = derivePreviousPhaseEndKey(phaseStartKey);
      const prevPhaseEndItem = arr.find(item => item.key === prevPhaseEndKey);
      // AT1.2.2/AT1.2.4: Never cascade backwards into käynnistys phase - it's user-editable exception
      if (prevPhaseEndKey !== 'kaynnistys_paattyy_pvm' && prevPhaseEndItem) {
        if (new Date(newPhaseStartDate) < new Date(prevPhaseEndItem.value)) {
          prevPhaseEndItem.value = newPhaseStartDate;
        }
      }
    }
  }

  const handleEsillaMaaraaikaMove = (arr, i, movedDate, disabledDates) => {
    const alkaaItem = arr[i + 1];
    const paattyyItem = arr[i + 2];
    const endAllowed = disabledDates?.date_types[paattyyItem?.date_type]?.dates || [];
    const alkaaGap = alkaaItem.initial_distance ?? alkaaItem.distance_from_previous ?? 14;
    const alkaaResult = timeUtil.findAllowedDate(movedDate, alkaaGap, disabledDates?.date_types[arr[i]?.date_type]?.dates, false);
    alkaaItem.value = new Date(alkaaResult).toISOString().split('T')[0];

    let timespan = 0;
    //Keep the same timespan between alkaa and paattyy if both are defined
    if (endAllowed.length && alkaaItem?.value && paattyyItem?.value) {
      const start = endAllowed.findIndex(d => d >= alkaaItem?.value);
      const end = endAllowed.findIndex(d => d >= paattyyItem?.value);
      if (start !== -1 && end !== -1 && end >= start) timespan = end - start;
    }
    const val = endAllowed.findIndex(d => d >= alkaaItem.value);
    let kept = (val !== -1 && val + timespan < endAllowed.length) ? endAllowed[val + timespan] : null;
    if (!kept) {
      const paattyyGap = paattyyItem.initial_distance ?? paattyyItem.distance_from_previous ?? 14;
      kept = timeUtil.findAllowedDate(alkaaItem.value, paattyyGap, endAllowed, false);
    }
    paattyyItem.value = new Date(kept).toISOString().split('T')[0];
  }

  const handleDeadlineMove = ( arr, i, movedDate, disabledDates, moveToPast, projectSize, prevItem) => {
    let indexToContinue = 0;
    const currentItem = arr[i];
    let newDate = new Date(currentItem.value);

    const kylkMaaraaikaKeys = ["kylk_maaraaika", "kylk_aineiston_maaraaika", "_lautakunta_aineiston_maaraaika"];
    if (kylkMaaraaikaKeys.some(key => currentItem?.key?.includes(key))) {
      handleKylkMaaraaikaMove(arr, i, movedDate, moveToPast, currentIndex);
      indexToContinue = i + 1;
    }
    else if (currentItem.key?.includes("paattyy") || (["XL", "L"].includes(projectSize) && currentItem?.key.includes("nahtavilla_alkaa"))) {
      indexToContinue = i;
    }
    else if (currentItem?.key?.includes("lautakunnassa") && !currentItem?.key?.includes("lautakunnassa_") || currentItem?.key?.includes("alkaa")) {
      // Backward cascade to maaraaika using previous_deadline
      const maaraaikaResult = timeUtil.findAllowedDate(
        movedDate, currentItem.initial_distance, disabledDates?.date_types[prevItem?.date_type]?.dates, true
      );
      prevItem.value = new Date(maaraaikaResult).toISOString().split('T')[0];
      indexToContinue = i;
    }
    else if (currentItem?.key?.includes("maaraaika")) {
      //Maaraaika moving, set esillaolo alkaa & paattyy
      handleEsillaMaaraaikaMove(arr, i, movedDate, disabledDates);
      indexToContinue = i + 2;
    }
    return {newDate, indexToContinue}; // Return the index to continue cascading from
  }

  // Find the index of the next item where dates should start being pushed
  const currentIndex = arr.findIndex(item => item.key === field);
  if (currentIndex === -1) {
    console.warn(`Field ${field} not found in the array. No cascading applied.`);
    return arr;
  }
  let indexToContinue = 0;
  if (isAdd) {
    handleDeadlineAdd();
  }
  // Save original values before mutation to prevent cascading against just-updated values
  const originalValues = arr.map(item => item.value);

  for (let i = currentIndex; i < arr.length; i++) {
    const currentItem = arr[i];
    if (isFrozen(currentItem) || IGNORED_ATTRIBUTES.some(attr => currentItem.key.includes(attr))) {
      continue;
    }
    let newDate = new Date(currentItem.value);
    const prevItem = getPreviousItem(arr, i);

    if (prevItem?.key?.includes("paattyy") && currentItem?.key?.includes("mielipiteet")) {
      newDate = new Date(prevItem.value);
    }
    else if (i === currentIndex) {
      // Handle the moved item itself
      const result = handleDeadlineMove(arr, i, movedDate, disabledDates, moveToPast, projectSize, prevItem);
      newDate = result.newDate;
      indexToContinue = result.indexToContinue;
    }
    else if (!moveToPast && i > indexToContinue) {
      // Find predecessor by previous_deadline
      let prevItemIdx = i - 1;
      if (currentItem.previous_deadline) {
        const foundIdx = arr.findIndex(item => item.key === currentItem.previous_deadline);
        if (foundIdx !== -1) prevItemIdx = foundIdx;
      }

      // Only push forward if there's an actual overlap (use original values to prevent cascade chain reactions)
      const prevDate = new Date(originalValues[prevItemIdx]);
      const currDate = new Date(originalValues[i]);
      const minimumGap = currentItem.distance_from_previous ?? 0;

      // Skip cross-phase cascade for non-boundary deadlines
      // Only phase boundaries (alkaa_pvm/paattyy_pvm) cascade across phase transitions
      const currPhase = getPhasePrefix(currentItem.key);
      const prevPhase = getPhasePrefix(arr[prevItemIdx]?.key);
      const isCrossPhase = currPhase && prevPhase && currPhase !== prevPhase;
      const currIsPhaseBoundary = isPhaseBoundary(currentItem.key);

      // Skip cascade if cross-phase transition and not a phase boundary
      if (isCrossPhase && !currIsPhaseBoundary) {
        // Don't modify newDate - keep the original value
      }
      else if (prevDate >= currDate && currentItem?.date_type) {
        const nextAllowedDate = timeUtil.dateDifference(
          currentItem.key, originalValues[prevItemIdx], originalValues[i],
          disabledDates?.date_types[currentItem?.date_type]?.dates,
          disabledDates?.date_types?.disabled_dates?.dates, minimumGap
        )
        newDate = new Date(nextAllowedDate);
      }
    }
    currentItem.value = newDate.toISOString().split('T')[0];
    adjustPhaseEndDates(arr, i);
  }
  
  sortPhaseData(arr, phaseOrder)
  arr = bumpPhaseStartsToPrevEnd(arr)
  return arr
}


const findLastDeadlineInPhase = (arr, index, targetPhase) => {
  let targetStrings = [targetPhase];
  if (targetPhase === "tarkistettuehdotus") {
    targetStrings = ["tarkistettu_ehdotus"]
  }
  else if (targetPhase === "ehdotus") {
    targetStrings = ["ehdotuksen", "kaavaehdotus", "ehdotus"]
  }
  for (let i = index - 1; i >= 0; i--) {
    for (const variant of targetStrings) {
      if ((arr[i].key.includes(variant) && !arr[i].key.endsWith('_pvm')) &&
        !(targetPhase === "ehdotus" && arr[i].key.includes("tarkistettu_ehdotus"))) {
        return arr[i].value;
      }
    }
  }
  return null;
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
  cascadeDeadlineChange,
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
  exported.findLastDeadlineInPhase = findLastDeadlineInPhase
  exported.expectedOrder = phaseOrder
  exported.findDeadlineInDeadlines = findDeadlineInDeadlines
  exported.findDeadlineInDeadlineSections = findDeadlineInDeadlineSections
}

export default exported;