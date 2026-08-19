import { generateConfirmedFields } from './generateConfirmedFields';
import { phaseOrder } from './objectUtil';
import { findFirstAllowedDate, findPastDateWithGap } from './timeUtil';

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
}

const getGapDateType = (deadline) => {
  // Workaround for finding the date type for the minimum distance calculation.
  // This should be provided by backend but is currently unavailable.
  // The string-matching approach is brittle and should be replaced as soon as data is available.

  // The date type refers to the type of days in TO the deadline from the previous deadline
  // Which is not always the same as the date_type of the deadline itself.
  if (deadline.key?.includes("esillaolo_alkaa")) return "työpäivät";
  if (deadline.key?.includes("esillaolo_paattyy")) return "esilläolopäivät";
  if (deadline.key?.includes("lautakunnassa")) return "työpäivät";
  return deadline?.date_type || null;
}

const cascadeDeadlineChange = ({ dlArray, field, disabledDates, projectSize, attributeData, deadlineObjects = [], lockedGroup=null }) => {
  const arr = structuredClone(dlArray);
  // Do not mutate dates that are (a) in the past or (b) confirmed via vahvista_* flags
  const confirmedFieldSet = new Set(generateConfirmedFields(attributeData, deadlineObjects));
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

  const handleKylkMaaraaikaMove = (arr, i) => {
    // On moving lautakunta maaraaika, adjust the next item (lautakunta date)
    const maaraaikaItem = arr[i];
    const lautakuntaItem = arr[i + 1];
    const lautakuntaGap = lautakuntaItem.initial_distance ?? lautakuntaItem.distance_from_previous ?? 21;
    const gapDates = disabledDates?.date_types?.työpäivät?.dates;
    const allowedDates = disabledDates?.date_types[lautakuntaItem?.date_type]?.dates;
    const lautakuntaResult = findFirstAllowedDate(maaraaikaItem.value, lautakuntaGap, gapDates, allowedDates);
    lautakuntaItem.value = new Date(lautakuntaResult).toISOString().split('T')[0];
  }

  const handleLautakuntaMove = (arr, i, disabledDates) => {
    const currentItem = arr[i];
    const prevItem = getPreviousItem(arr, i);
    const gapType = getGapDateType(currentItem);
    const allowedDates = disabledDates?.date_types[gapType]?.dates || [];
    const maaraaikaResult = findPastDateWithGap(currentItem.value, currentItem.initial_distance, allowedDates);

    if (maaraaikaResult) {
      const maikaObject = { ...prevItem, value: maaraaikaResult};
      const enforcedMaaraaika = enforceMinimumGap(maikaObject, getPreviousItem(arr, i-1), disabledDates);
      prevItem.value = enforcedMaaraaika.toISOString().split('T')[0];
    }
    const lautakuntaResult = enforceMinimumGap(currentItem, prevItem, disabledDates, true);
    currentItem.value = lautakuntaResult?.toISOString().split('T')[0] || currentItem.value;
  }

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
    alkaaItem.value = new Date(alkaaResult).toISOString().split('T')[0];

    const paattyyGap = paattyyItem.initial_distance ?? paattyyItem.distance_from_previous ?? 14;
    const paattyyGapType = getGapDateType(paattyyItem);
    const paattyyGapDates = disabledDates?.date_types[paattyyGapType]?.dates;
    const paattyyAllowedDates = disabledDates?.date_types[paattyyItem?.date_type]?.dates || paattyyGapDates;
    const gap = Math.max(initialEsillaoloDiff, paattyyGap);
    const newPaattyyValue = findFirstAllowedDate(alkaaItem.value, gap, paattyyGapDates, paattyyAllowedDates);
    if (newPaattyyValue) {
      paattyyItem.value = new Date(newPaattyyValue).toISOString().split('T')[0];
    }
  }

  const handleDeadlineMove = ( arr, i, disabledDates, projectSize, prevItem) => {
    let indexToContinue = i;
    const currentItem = arr[i];

    const kylkMaaraaikaKeys = ["kylk_maaraaika", "kylk_aineiston_maaraaika", "_lautakunta_aineiston_maaraaika"];
    if (kylkMaaraaikaKeys.some(key => currentItem?.key?.includes(key))) {
      const enforcedDate = enforceMinimumGap(currentItem, getPreviousItem(arr, i), disabledDates);
      currentItem.value = enforcedDate.toISOString().split('T')[0];
      handleKylkMaaraaikaMove(arr, i);
      indexToContinue = i + 1;
    }
    else if (currentItem.key?.includes("paattyy") || (["XL", "L"].includes(projectSize) && currentItem?.key.includes("nahtavilla_alkaa"))) {
      // TODO: remove this branch and ensure the next elifs work as intended
      const enforcedDate = enforceMinimumGap(currentItem, getPreviousItem(arr, i), disabledDates);
      currentItem.value = enforcedDate.toISOString().split('T')[0];
      indexToContinue = i;
    }
    else if (currentItem?.key?.includes("lautakunnassa") && !currentItem?.key?.includes("lautakunnassa_") || currentItem?.key?.includes("alkaa")) {
      // Backward cascade to maaraaika using previous_deadline
      handleLautakuntaMove(arr, i, disabledDates);
      indexToContinue = i;
    }
    else if (currentItem?.key?.includes("maaraaika")) {
      //Maaraaika moving, set esillaolo alkaa & paattyy
      const enforcedDate = enforceMinimumGap(currentItem, getPreviousItem(arr, i), disabledDates);
      currentItem.value = enforcedDate.toISOString().split('T')[0];
      handleEsillaMaaraaikaMove(arr, i, currentItem.value, disabledDates);
      indexToContinue = i + 2;
    }
    return {newDate: new Date(currentItem.value), indexToContinue};
  }

  const enforceMinimumGap = (currentItem, prevItem, disabledDates, forceMinimumGap = false) => {
    const minimumGap = currentItem.distance_from_previous ?? 0;
    const allowedDates = disabledDates?.date_types[currentItem?.date_type]?.dates || [];
    const gapType = getGapDateType(currentItem);
    const gapDates = gapType ? disabledDates?.date_types[gapType]?.dates : allowedDates;
    const preferredDate = forceMinimumGap ? null : currentItem.value;
    const nextAllowedDate = findFirstAllowedDate(prevItem.value, minimumGap, gapDates, allowedDates, preferredDate);
    return new Date(nextAllowedDate);
  }

  // When a locked item is encountered, backtrack and adjust previous items
  // to ensure they don't violate the minimum gap constraints with respect to the locked item.
  const backtrackDeadlines = (arr, lockedItemIndex) => {
    let forwardItem = arr[lockedItemIndex]
    for (let j = lockedItemIndex-1; j >= Math.max(movedItemIndex - 1, 0); j--) {
      const currentItem = arr[j];
      const allowedType = forwardItem?.date_type || "arkipäivät"
      const allowedDates = disabledDates?.date_types[allowedType]?.dates || [];
      const gapType = getGapDateType(forwardItem);
      const gapDates = gapType ? disabledDates?.date_types[gapType]?.dates : allowedDates;
      const fixedDate = findPastDateWithGap(forwardItem.value, forwardItem.distance_from_previous || 0, gapDates)
      const shouldAdjust = fixedDate < currentItem.value;
      if (j === movedItemIndex -1) {
        console.log(`Backtracking stopped at index ${j} for field ${currentItem.key}.`);
        if (shouldAdjust) {
          throw new Error(`Cannot backtrack ${currentItem.key} to satisfy minimum gap with locked field ${forwardItem.key}.`);
        }
      }
      if (shouldAdjust) {
        currentItem.value = fixedDate;
      }
      forwardItem = currentItem;
    }
  }

  // Find the index of the next item where dates should start being pushed
  const movedItemIndex = arr.findIndex(item => item.key === field);
  if (movedItemIndex === -1) {
    console.warn(`Field ${field} not found in the array. No cascading applied.`);
    return arr;
  }

  const lockedElement = lockedGroup ? getFirstLockedElement(arr, lockedGroup, deadlineObjects) : null;
  if (lockedElement?.key === field){
    console.warn(`Field ${field} is locked. No cascading applied.`);
    return arr;
  }

  let indexToContinue = 0;

  for (let i = movedItemIndex; i < arr.length; i++) {
    const currentItem = arr[i];
    if (isFrozen(currentItem) || IGNORED_ATTRIBUTES.some(attr => currentItem.key.includes(attr))) {
      continue;
    }
    let newDate = new Date(currentItem.value);
    const prevItem = getPreviousItem(arr, i);

    if (prevItem?.key?.includes("paattyy") && currentItem?.key?.includes("mielipiteet")) {
      newDate = new Date(prevItem.value);
    }
    else if (i === movedItemIndex) {
      // Handle the moved item itself
      const result = handleDeadlineMove(arr, i, disabledDates, projectSize, prevItem);
      newDate = result.newDate;
      indexToContinue = result.indexToContinue;
    }
    else if (i > indexToContinue) {
      if (phaseOrder.includes(currentItem.key)) {
        // Set phase boundaries to previous dates end
        newDate = prevItem ? new Date(prevItem.value) : new Date(currentItem.value);
      }
      else {
        // For subsequent items, enforce minimum gap if moving forward
        newDate = enforceMinimumGap(currentItem, prevItem, disabledDates, false);
      }
      if (lockedElement && currentItem.key === lockedElement.key) {
        console.warn(`Encountered locked field ${lockedElement.key}. Stopping cascade.`);
        if (newDate > new Date(currentItem.value)) {
          //Begin backwards cascade
          backtrackDeadlines(arr, i);
        }
        break;
      }
    }
    currentItem.value = newDate.toISOString().split('T')[0];
  }
  return arr
}


export const setDefaultDatesForNewGroup = (dlObjects, formValues, allDates) => {
  dlObjects.forEach(dl => {
    if (dl.initial_distance?.base_deadline) {
      const baseDate = formValues[dl.initial_distance.base_deadline] || formValues[dl.previous_deadline];
      const distance = dl.initial_distance.distance || dl.distance_from_previous || 0;
      if (baseDate) {
        const gapType = getGapDateType({ key: dl.name, date_type: dl.date_type });
        const gapDates = allDates?.[gapType]?.dates;
        const allowedDates = allDates?.[dl.date_type]?.dates || gapDates;
        const newDate = findFirstAllowedDate(baseDate, distance, gapDates, allowedDates);
        if (newDate) {
          formValues[dl.name] = newDate
        }
      }
    }
  });
};


const exported = {
  cascadeDeadlineChange
}

if (process.env.UNIT_TEST === "true") {
  exported.findLastDeadlineInPhase = findLastDeadlineInPhase
}

export default exported;
