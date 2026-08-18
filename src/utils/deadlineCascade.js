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

const cascadeDeadlineChange = ({ arr, field, disabledDates, projectSize, attributeData, deadlineObjects = [] }) => {
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

  // Find the index of the next item where dates should start being pushed
  const currentIndex = arr.findIndex(item => item.key === field);
  if (currentIndex === -1) {
    console.warn(`Field ${field} not found in the array. No cascading applied.`);
    return arr;
  }
  let indexToContinue = 0;

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
    }
    currentItem.value = newDate.toISOString().split('T')[0];
    adjustPhaseEndDates(arr, i);
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
