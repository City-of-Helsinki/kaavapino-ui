import { generateConfirmedFields } from './generateConfirmedFields';
import { findFirstAllowedDate, findPastDateWithGap, getGapDateType, sortObjectByDate } from './timeUtil';
import objectUtil from '../utils/objectUtil'

const findLastDeadlineInPhase = (arr, index, targetPhase) => {
  let targetStrings = [targetPhase];
  if (targetPhase === "tarkistettuehdotus") {
    targetStrings = ["tarkistettu_ehdotus"];
  }
  else if (targetPhase === "ehdotus") {
    targetStrings = ["ehdotuksen", "kaavaehdotus", "ehdotus"];
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
};

const getFirstLockedElement = (arr, lockedGroup, deadlineObjects) => {
  for (const dl_object of deadlineObjects) {
    const deadline = dl_object.deadline;
    if (deadline.deadlinegroup === lockedGroup) {
      const item = arr.find(item => item.key === deadline.attribute);
      if (item) {
        return item;
      }
    }
  }
  return null;
};

export const prepareCascadeInput = (attributeData, deadlineSections) => {
    //Remove all keys that are still hidden in vistimeline so they are not moved in data and later saved
    const filteredAttributeData = objectUtil.filterHiddenKeysUsingSections(attributeData, deadlineSections);
    const origSortedData = sortObjectByDate(filteredAttributeData);
    // Generate array from filteredAttributeData for comparison
    const updateAttributeArray = objectUtil.generateDateStringArray(filteredAttributeData);
    //Compare for changes with dates in order sorted array
    const changes = objectUtil.mergeAndUpdateDlArrays(origSortedData, updateAttributeArray, deadlineSections);
    return [changes, filteredAttributeData];
};

export const cascadeDeadlineChange = ({ dlArray, field, movedFieldValue, disabledDates, attributeData, deadlineObjects = [], lockedGroup = null, pairedEndKey = null }) => {
  // Do not mutate dates that are (a) in the past or (b) confirmed via vahvista_* flags
  const confirmedFieldSet = new Set(generateConfirmedFields(attributeData, deadlineObjects));
  // Attributes that should never be cascaded
  const IGNORED_ATTRIBUTES = [
    "kaynnistysvaihe_alkaa_pvm", "projektin_kaynnistys_pvm",
    "voimaantulo_pvm", "rauennut", "tullut_osittain_voimaan_pvm", "kumottu_pvm", "valtuusto_poytakirja_nahtavilla_pvm",
    "hyvaksymispaatos_valitusaika_paattyy", "valtuusto_hyvaksymiskuulutus_pvm", "hyvaksymispaatos_pvm"
  ];

  const isFrozen = (item) => {
    if (!item?.value) return false;
    const today = new Date().toISOString().split('T')[0];
    if (item.value < today) return true;
    return confirmedFieldSet.has(item.key);
  };

  const getPreviousItem = (arr, index) => {
    if (index === 0) return null;
    let prevItem = null;
    if (arr[index].previous_deadline) {
      prevItem = arr.find(item => item.key === arr[index].previous_deadline);
      if (prevItem && arr.some(item => item.key === arr[index].previous_deadline + '_2')) {
        // When additional element groups are added, previous_deadline may be inaccurate (Backend limitation)
        // Previous item should be correct
        prevItem = arr[index - 1];
      }
    }

    if (!prevItem && index > 0) {
      prevItem = arr[index - 1];
    }
    return prevItem;
  };

  const handleKylkMaaraaikaMove = (arr, i) => {
    // On moving lautakunta maaraaika, adjust the next item (lautakunta date)
    const maaraaikaItem = arr[i];
    const lautakuntaItem = arr[i + 1];
    const lautakuntaGap = lautakuntaItem.initial_distance ?? lautakuntaItem.distance_from_previous ?? 21;
    const gapDates = disabledDates?.date_types?.työpäivät?.dates;
    const allowedDates = disabledDates?.date_types[lautakuntaItem?.date_type]?.dates;
    const lautakuntaResult = findFirstAllowedDate(maaraaikaItem.value, lautakuntaGap, gapDates, allowedDates);
    lautakuntaItem.value = lautakuntaResult;
  };

  const handleLautakuntaMove = (arr, i, disabledDates) => {
    const currentItem = arr[i];
    const prevItem = getPreviousItem(arr, i);
    const gapType = getGapDateType(currentItem);
    const gapDates = disabledDates?.date_types[gapType]?.dates || [];
    const maaraaikaResult = findPastDateWithGap(currentItem.value, currentItem.initial_distance, gapDates);

    if (maaraaikaResult) {
      const maikaObject = { ...prevItem, value: maaraaikaResult };
      const enforcedMaaraaika = enforceMinimumGap(maikaObject, getPreviousItem(arr, i - 1), disabledDates);
      prevItem.value = enforcedMaaraaika;
    }
    const lautakuntaResult = enforceMinimumGap(currentItem, prevItem, disabledDates, true);
    currentItem.value = lautakuntaResult ?? currentItem.value;
  };

  const handleEsillaMaaraaikaMove = (arr, i, movedDate, disabledDates) => {
    const alkaaItem = arr[i + 1];
    const paattyyItem = arr[i + 2];
    const endAllowedDates = disabledDates?.date_types[paattyyItem?.date_type]?.dates || [];

    let initialEsillaoloDiff = 0;
    //Keep the same timespan between alkaa and paattyy if both are defined
    if (endAllowedDates.length && alkaaItem?.value && paattyyItem?.value) {
      const start = endAllowedDates.findIndex(d => d >= alkaaItem?.value);
      const end = endAllowedDates.findIndex(d => d >= paattyyItem?.value);
      if (start !== -1 && end !== -1 && end >= start) initialEsillaoloDiff = end - start;
    }

    const alkaaGap = alkaaItem.initial_distance ?? alkaaItem.distance_from_previous ?? 13;
    const alkaaGapType = getGapDateType(alkaaItem);
    const alkaaGapDates = disabledDates?.date_types[alkaaGapType]?.dates;
    const alkaaAllowedDates = disabledDates?.date_types[alkaaItem?.date_type]?.dates || alkaaGapDates;
    const alkaaResult = findFirstAllowedDate(movedDate, alkaaGap, alkaaGapDates, alkaaAllowedDates);
    alkaaItem.value = alkaaResult;

    const paattyyGap = paattyyItem.initial_distance ?? paattyyItem.distance_from_previous ?? 14;
    const paattyyGapType = getGapDateType(paattyyItem);
    const paattyyGapDates = disabledDates?.date_types[paattyyGapType]?.dates;
    const paattyyAllowedDates = disabledDates?.date_types[paattyyItem?.date_type]?.dates || paattyyGapDates;
    const gap = Math.max(initialEsillaoloDiff, paattyyGap);
    const newPaattyyValue = findFirstAllowedDate(alkaaItem.value, gap, paattyyGapDates, paattyyAllowedDates);
    if (newPaattyyValue) {
      paattyyItem.value = newPaattyyValue;
    }
  };

  const measureDistance = (fromDate, toDate, gapDates) => {
    if (!gapDates?.length || !fromDate || !toDate) return null;
    const fromIdx = gapDates.findIndex(d => d >= fromDate);
    const toIdx = gapDates.findIndex(d => d >= toDate);
    if (fromIdx === -1 || toIdx === -1) return null;
    return toIdx - fromIdx;
  };

  // Gap to preserve between two items as they existed before this cascade run, floored at the minimum gap.
  const getPreservedGap = (currentItem, prevItem, minimumGap, gapDates) => {
    const origCurrent = originalByKey.get(currentItem.key);
    const origPrev = originalByKey.get(prevItem.key);
    const existingDistance = measureDistance(origPrev?.value, origCurrent?.value, gapDates);
    return existingDistance != null ? Math.max(minimumGap, existingDistance) : minimumGap;
  };

  // Preserved distance/gap-date-set between the moved (paired start) item and pairedEndKey;
  // populated by handlePairedDeadlineMove so backtrackDeadlines can reuse them.
  let pairedEndDistance = null;
  let pairedEndGapDates = null;
  let pairedEndAllowedDates = null;

  let previousMoved = false; // Moved date causes previous item to change (previous is maaraaika)

  const handlePairedDeadlineMove = (arr, i, movedFieldValue, disabledDates) => {
    const currentItem = arr[i];
    const pairedEndItem = arr.find(item => item.key === pairedEndKey);

    const endGapType = getGapDateType(pairedEndItem) || 'arkipäivät';
    pairedEndGapDates = disabledDates?.date_types[endGapType]?.dates;
    pairedEndAllowedDates = disabledDates?.date_types[pairedEndItem?.date_type]?.dates || pairedEndGapDates;
    pairedEndDistance = measureDistance(currentItem.value, pairedEndItem?.value, pairedEndGapDates);

    currentItem.value = movedFieldValue;
    const prevItem = getPreviousItem(arr, i);
    if (prevItem) {
      const enforcedMoved = enforceMinimumGap(currentItem, prevItem, disabledDates);
      currentItem.value = enforcedMoved ?? currentItem.value;
    }

    if (pairedEndItem && pairedEndDistance !== null) {
      const newEnd = findFirstAllowedDate(currentItem.value, pairedEndDistance, pairedEndGapDates, pairedEndAllowedDates);
      if (newEnd) pairedEndItem.value = newEnd;
    }

    return currentItem.value;
  };

  const handleDeadlineMove = (arr, i, movedFieldValue, disabledDates) => {
    let indexToContinue = i + 1;

    if (pairedEndKey) {
      const result = handlePairedDeadlineMove(arr, i, movedFieldValue, disabledDates);
      return { value: result, indexToContinue: indexToContinue + 1 };
    }

    const currentItem = arr[i];
    const prevItem = getPreviousItem(arr, i);
    currentItem.value = movedFieldValue;

    const kylkMaaraaikaKeys = ["kylk_maaraaika", "kylk_aineiston_maaraaika", "_lautakunta_aineiston_maaraaika"];

    if (kylkMaaraaikaKeys.some(key => currentItem?.key?.includes(key))) {
      const enforcedDate = enforceMinimumGap(currentItem, getPreviousItem(arr, i), disabledDates);
      currentItem.value = enforcedDate;
      handleKylkMaaraaikaMove(arr, i);
      indexToContinue += 1; // Skip the next item (lautakunta) since it was already adjusted
    }
    else if (prevItem?.key?.includes("maaraaika")) {
      handleLautakuntaMove(arr, i, disabledDates);
      previousMoved = true;
    }
    else if (currentItem?.key?.includes("maaraaika")) {
      //Maaraaika moving, set esillaolo alkaa & paattyy
      const enforcedDate = enforceMinimumGap(currentItem, getPreviousItem(arr, i), disabledDates);
      currentItem.value = enforcedDate;
      handleEsillaMaaraaikaMove(arr, i, currentItem.value, disabledDates);
      indexToContinue += 2; // Skip the next two items (esilla alkaa & paattyy) since they were already adjusted
    }
    else {
      // For any other deadlines not specifically handled, enforce the minimum gap
      const enforcedDate = enforceMinimumGap(currentItem, getPreviousItem(arr, i), disabledDates);
      currentItem.value = enforcedDate;
    }
    return { value: currentItem.value, indexToContinue };
  };

  const enforceMinimumGap = (currentItem, prevItem, disabledDates, forceMinimumGap = false, preserveDistance = false) => {
    const minimumGap = currentItem.distance_from_previous ?? 0;
    const allowedType = currentItem?.date_type || "arkipäivät";
    const allowedDates = disabledDates?.date_types[allowedType]?.dates || [];
    const gapType = getGapDateType(currentItem);
    const gapDates = gapType ? disabledDates?.date_types[gapType]?.dates : allowedDates;
    const effectiveGap = preserveDistance ? getPreservedGap(currentItem, prevItem, minimumGap, gapDates) : minimumGap;
    // Preserving distance must land exactly on prev+effectiveGap, not clamp to the item's own stale value.
    const preferredDate = (forceMinimumGap || preserveDistance) ? null : currentItem.value;
    const nextAllowedDate = findFirstAllowedDate(prevItem.value, effectiveGap, gapDates, allowedDates, preferredDate);
    return nextAllowedDate;
  };

  // When a locked item is encountered, backtrack and adjust previous items
  // to ensure they don't violate the minimum gap constraints with respect to the locked item.
  // forceMinimumGap: fallback mode used when preserved-gap backtracking couldn't fit; spaces every step at the minimum gap instead.
  const backtrackDeadlines = (arr, lockedItemIndex, forceMinimumGap = false) => {
    let forwardItem = arr[lockedItemIndex];
    const endIndex = Math.max(movedItemIndex - (previousMoved ? 2 : 1), 0);
    for (let j = lockedItemIndex - 1; j >= endIndex; j--) {
      const currentItem = arr[j];
      let fixedDate;
      // Reuse the preserved paired distance when stepping from paired end back to paired start.
      if (pairedEndKey && forwardItem?.key === pairedEndKey && currentItem.key === field && pairedEndDistance !== null && !forceMinimumGap) {
        const pairedStartAllowedDates = disabledDates?.date_types[currentItem?.date_type]?.dates || pairedEndGapDates;
        fixedDate = findPastDateWithGap(forwardItem.value, pairedEndDistance, pairedEndGapDates, pairedStartAllowedDates);
      } else {
        const allowedType = currentItem?.date_type || "arkipäivät";
        const allowedDates = disabledDates?.date_types[allowedType]?.dates;
        const gapType = getGapDateType(forwardItem) || "arkipäivät";
        const gapDates = disabledDates?.date_types[gapType]?.dates;
        const minimumGap = forwardItem.distance_from_previous || 0;
        // The locked item's own gap from its predecessor is never preserved, only the minimum applies
        const effectiveGap = (forceMinimumGap || (lockedElement && forwardItem.key === lockedElement.key))
          ? minimumGap
          : getPreservedGap(forwardItem, currentItem, minimumGap, gapDates);
        fixedDate = findPastDateWithGap(forwardItem.value, effectiveGap, gapDates, allowedDates);
      }
      const shouldAdjust = fixedDate < currentItem.value;
      if (j === endIndex && j !== 0 && shouldAdjust) {
        throw new Error(`Cannot backtrack ${currentItem.key} to satisfy ${forceMinimumGap ? "minimum" : "preserved"} gap with locked field ${forwardItem.key}.`);
      }
      if (shouldAdjust) {
        currentItem.value = fixedDate;
      }
      forwardItem = currentItem;
    }
  };

  const arr = structuredClone(dlArray);
  // Pre-mutation snapshot of the incoming values, used to measure distances that predate this cascade run.
  const originalByKey = new Map(dlArray.map(item => [item.key, item]));

  // Find the index of the next item where dates should start being pushed
  const movedItemIndex = arr.findIndex(item => item.key === field);
  if (movedItemIndex === -1) {
    console.warn(`Field ${field} not found in the array. No cascading applied.`);
    arr.push({ key: field, value: movedFieldValue });
    return arr;
  }

  const lockedElement = lockedGroup ? getFirstLockedElement(arr, lockedGroup, deadlineObjects) : null;
  if (lockedElement?.key === field) {
    console.warn(`Field ${field} is locked. No cascading applied.`);
    return arr;
  }

  // Handle the moved item itself
  const result = handleDeadlineMove(arr, movedItemIndex, movedFieldValue, disabledDates);
  arr[movedItemIndex].value = result.value;
  const indexToContinue = result.indexToContinue;

  for (let i = indexToContinue; i < arr.length; i++) {
    const currentItem = arr[i];
    if (isFrozen(currentItem) || IGNORED_ATTRIBUTES.some(attr => currentItem.key.includes(attr))) {
      continue;
    }
    let newDate;
    const prevItem = getPreviousItem(arr, i);

    if (prevItem?.key?.includes("paattyy") && currentItem?.key?.includes("mielipiteet")) {
      // Special case: in esillaolo, mielipiteet should match paattyy date (has no minimum gap)
      newDate = prevItem.value;
    }
    else if (lockedElement && currentItem.key === lockedElement.key) {
      // The locked item's own gap from its predecessor is never preserved, only the minimum applies
      newDate = enforceMinimumGap(currentItem, prevItem, disabledDates, false, false);
    }
    else {
      // For subsequent items, preserve their existing distance from the previous item, floored at the minimum gap
      newDate = enforceMinimumGap(currentItem, prevItem, disabledDates, false, true);
    }
    if (lockedElement && currentItem.key === lockedElement.key) {
      if (newDate > currentItem.value) {
        //Begin backwards cascade, preserving existing distances where possible
        try {
          const arrCopy = structuredClone(arr);
          backtrackDeadlines(arrCopy, i);
          return arrCopy;
        } catch {
          console.log("Retrying with minimum-gap-only spacing");
          // Failed due to locking, retry with minimum-gap-only spacing
          const arrCopy = structuredClone(arr);
          backtrackDeadlines(arrCopy, i, true);
          return arrCopy;
        }
      }
      break;
    }
    currentItem.value = newDate;
  }
  return arr;
};


export const setDefaultDatesForNewGroup = (dlObjects, formValues, allDates) => {
  dlObjects.forEach(dl => {
    if (!dl?.initial_distance) {
      return;
    }
    const baseDate = formValues[dl.initial_distance.base_deadline] || formValues[dl.previous_deadline];
    const distance = dl.initial_distance.distance || dl.distance_from_previous || 0;
    if (baseDate) {
      const gapType = getGapDateType({ key: dl.name, date_type: dl.date_type });
      const gapDates = allDates?.[gapType]?.dates;
      const allowedDates = allDates?.[dl.date_type]?.dates || gapDates;
      const newDate = findFirstAllowedDate(baseDate, distance, gapDates, allowedDates);
      if (newDate) {
        formValues[dl.name] = newDate;
      }
    } else {
      formValues[dl.name] = "1970-01-01" // Let deadlineCascade sort it out
    }
  });
};


const exported = {
  cascadeDeadlineChange,
  prepareCascadeInput
};

if (process.env.UNIT_TEST === "true") {
  exported.findLastDeadlineInPhase = findLastDeadlineInPhase;
}

export default exported;
