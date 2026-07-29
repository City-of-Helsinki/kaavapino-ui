import { generateConfirmedFields } from './generateConfirmedFields';
import timeUtil from './timeUtil';
import { phaseOrder, sortPhaseData, bumpPhaseStartsToPrevEnd } from './objectUtil';

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

    const alkaaGap = alkaaItem.initial_distance ?? alkaaItem.distance_from_previous ?? 14;
    const alkaaResult = timeUtil.findAllowedDate(movedDate, alkaaGap, disabledDates?.date_types[arr[i]?.date_type]?.dates, false);
    alkaaItem.value = new Date(alkaaResult).toISOString().split('T')[0];


    const startIndex = endAllowedDates.findIndex(d => d >= alkaaItem.value);
    const paattyyGap = paattyyItem.initial_distance ?? paattyyItem.distance_from_previous ?? 14;
    let newPaattyyValue = null;
    if (startIndex + initialEsillaoloDiff < endAllowedDates.length && initialEsillaoloDiff > paattyyGap) {
      // Maintain the same gap between alkaa and paattyy if possible
      newPaattyyValue = endAllowedDates[startIndex + initialEsillaoloDiff];
    } else {
      newPaattyyValue = timeUtil.findAllowedDate(alkaaItem.value, paattyyGap, endAllowedDates, false);
    }
    if (newPaattyyValue) {
      paattyyItem.value = new Date(newPaattyyValue).toISOString().split('T')[0];
    }
  }

  const handleDeadlineMove = ( arr, i, movedDate, disabledDates, moveToPast, projectSize, prevItem) => {
    let indexToContinue = 0;
    const currentItem = arr[i];
    if (currentItem.key === "tarkistettu_ehdotus_kylk_maaraaika") {
      console.log("date was " + currentItem.value);
    }
    let newDate = enforceMinimumGap(arr, i, originalValues, disabledDates);
    if (currentItem.key === "tarkistettu_ehdotus_kylk_maaraaika") {
      console.log("new date is now " + newDate.toISOString().split('T')[0]);
    }

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

  const enforceMinimumGap = (arr, i, originalValues, disabledDates) => {
    const currentItem = arr[i];
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

    if (prevDate.getTime() + minimumGap * 24 * 60 * 60 * 1000 >= currDate.getTime() && currentItem?.date_type) {
      const nextAllowedDate = timeUtil.dateDifference(
          currentItem.key, originalValues[prevItemIdx], originalValues[i],
          disabledDates?.date_types[currentItem?.date_type]?.dates,
          disabledDates?.date_types?.disabled_dates?.dates, minimumGap
      )
      return new Date(nextAllowedDate);
    }
    return new Date(currentItem.value);
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
    sortPhaseData(arr, phaseOrder)
    arr = bumpPhaseStartsToPrevEnd(arr)
    return arr
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
      // For subsequent items, enforce minimum gap if moving forward
      newDate = enforceMinimumGap(arr, i, originalValues, disabledDates);
    }
    currentItem.value = newDate.toISOString().split('T')[0];
    adjustPhaseEndDates(arr, i);
  }

  sortPhaseData(arr, phaseOrder)
  arr = bumpPhaseStartsToPrevEnd(arr)
  return arr
}

const exported = {
  cascadeDeadlineChange
}

if (process.env.UNIT_TEST === "true") {
  exported.findLastDeadlineInPhase = findLastDeadlineInPhase
}

export default exported;
