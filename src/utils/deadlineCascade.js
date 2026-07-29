import { generateConfirmedFields } from './generateConfirmedFields';
import timeUtil from './timeUtil';
import { phaseOrder, sortPhaseData, bumpPhaseStartsToPrevEnd } from './objectUtil';

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

const exported = {
  cascadeDeadlineChange
}

if (process.env.UNIT_TEST === "true") {
  exported.findLastDeadlineInPhase = findLastDeadlineInPhase
}

export default exported;
