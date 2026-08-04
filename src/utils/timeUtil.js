import objectUtil from "./objectUtil";
import { getVisibilityBoolName } from "./projectVisibilityUtils";

  const isWeekend = (date) => {
      const day = new Date(date).getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  const getHighestVoimaantuloDate = (attributeValues) => {
    const datesToCompare = ["tullut_osittain_voimaan_pvm", "voimaantulo_pvm", "kumottu_pvm", "rauennut"]
    .map(dateField => attributeValues[dateField])
    .filter(Boolean)
    .map(date => new Date(date));
    let highestDate = datesToCompare.length ? new Date(Math.max(...datesToCompare)) : null;
    if (highestDate) {
      highestDate = formatDate(highestDate,false,false);
    }
    return highestDate
  }

  // Helper function to format a Date object to "YYYY-MM-DD"
  const formatDate = (date,addDay,addDayNumber) => {
    if(addDay){
      date.setDate(date.getDate() + addDayNumber);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Returns localized relative date string using provided t function; always plural for months/years.
	const formatRelativeDate = (timestamp, tFn) => {
		if(!timestamp){
			return ''
		}
		const updatedDate = new Date(timestamp)
		const now = new Date()
		
		// Reset time parts to compare only dates (not times)
		const updatedDateOnly = new Date(updatedDate.getFullYear(), updatedDate.getMonth(), updatedDate.getDate())
		const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		
		const oneDayMs = 24 * 60 * 60 * 1000
		const diffMs = nowDateOnly.getTime() - updatedDateOnly.getTime()
		const days = Math.floor(diffMs / oneDayMs)
		
    if (days <= 0) {
      return tFn ? tFn('relativeDates.today') : 'Today'
		}
    if (days === 1) {
      return tFn ? tFn('relativeDates.yesterday') : 'Yesterday'
		}
    if (days < 30) {
      return tFn ? tFn('relativeDates.days-ago', { count: days }) : `${days} days ago`
		}
		let months = (now.getFullYear() - updatedDate.getFullYear()) * 12 + (now.getMonth() - updatedDate.getMonth())
		if (months <= 0) {
			months = 1
		}
    if (months < 12) {
      const monthKey = months === 1 ? 'relativeDates.month-ago-singular' : 'relativeDates.month-ago'
      return tFn ? tFn(monthKey, { count: months }) : `${months} months ago`
		}
		const years = Math.floor(months / 12)
		const yearKey = years === 1 ? 'relativeDates.years-ago-singular' : 'relativeDates.years-ago'
    return tFn ? tFn(yearKey, { count: years }) : `${years} years ago`
	}

  // Helper function to check if a date is a holiday
  const isHoliday = (date,isInFilter,holidays) => {
    const dateStr = date.toISOString().split('T')[0]; // Convert to 'YYYY-MM-DD' format
    return isInFilter ? holidays.includes(dateStr) : !holidays.includes(dateStr);
  }

  const normalizeDate = (date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    return new Date(normalizedDate);
  }


// Check if a string is in "YYYY-MM-DD" format
const isDate = (value) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  return datePattern.test(value) && !isNaN(Date.parse(value));
}

const sortObjectByDate = (obj) => {
  const sortedArray = [];

  // Process and sort only the keys with date strings
  Object.keys(obj)
    .filter(key => isDate(obj[key])) // Filter only date keys
    .map(key => ({ key, date: new Date(obj[key]), value: obj[key] })) // Map keys to real Date objects and values
    .sort((a, b) => a.date - b.date) // Sort by Date objects
    .forEach(item => {
      sortedArray.push({ key: item.key, value: item.value }); // Push each sorted key-value pair into the array
    });

  return sortedArray; // Returning an array guarantees the order
}

// gapDates counts the minimum-gap distance from prevDate; allowedDates constrains the returned date.
export const findFirstAllowedDate = (prevDate, minimumGap, gapDates, allowedDates, preferredDate = null) => {
  if (!prevDate) {
    return null;
  }
  // Compute the earliest date that satisfies the minimum-gap requirement
  let earliest = prevDate;
  if (gapDates?.length > 0) {
    const prevIndex = gapDates.findIndex(d => d >= prevDate);
    if (prevIndex === -1) {
      return null;
    }
    const targetIndex = prevIndex + minimumGap;
    if (targetIndex >= gapDates.length) {
      return null;
    }
    earliest = gapDates[targetIndex];
  }
  const candidate = (preferredDate && preferredDate >= earliest) ? preferredDate : earliest;
  if (!allowedDates?.length) {
    return candidate;
  }
  return allowedDates.find(d => d >= candidate) ?? null;
}

export const findPastDateWithGap = (startingDate, gap, allowedDates) => {
  if (!startingDate || !allowedDates || allowedDates.length === 0 || gap < 0) {
    return null;
  }
  const startingIndex = allowedDates.findIndex(d => d >= startingDate);
  if (startingIndex === -1) {
    return null;
  }
  const targetIndex = startingIndex - gap;
  return (targetIndex >= 0) ? allowedDates[targetIndex] : allowedDates[0];
}

//Finds next possible date from from array if the value does not exist in it
const findNextPossibleValue = (array, value, addedDays) => {
  if (!Array.isArray(array) || typeof value !== 'string') {
    throw new TypeError('Invalid input. Provide an array of strings and a value as a string.');
  }
  let index = 0;
  // Directly find the given value or the next possible value
  for (const date of array) {
    if (date >= value) {
      if(addedDays){
        const targetIndex = index + addedDays;
        if (targetIndex >= 0 && targetIndex < array.length) {
          return array[targetIndex];
        } 
        else if (targetIndex < 0) {
          return array[0]; // or handle the case where the target index is out of bounds
        }
        else {
          return null; // or handle the case where the target index is out of bounds
        }
      }
      else{
        return date;
      }
    }
    index++;
  }

  // If no value is found, return null or a message
  return null;
}

const findNextPossibleBoardDate = (array, value) => {
  if (!Array.isArray(array) || typeof value !== 'string') {
    throw new TypeError('Invalid input. Provide an array of strings and a value as a string.');
  }

  let closestIndex = -1;

  // Find the next possible date in the array
  for (let i = 0; i < array.length; i++) {
    if (array[i] <= value) {
      closestIndex = i;
    } else {
      break;
    }
  }

  // If no closest date is found, return null
  if (closestIndex === -1) {
    return null;
  }

 // Return the next possible date (one index higher) if it exists, otherwise return the closest date
 return closestIndex < array.length - 1 ? array[closestIndex + 1] : array[closestIndex];
}

const getAllowedDatesForProjectStart = (name, formValues, previousItem, nextItem, dateTypes) => {
  const miniumDaysBetween = nextItem?.distance_from_previous;
  const dateToCompare = name.includes("kaynnistys_paattyy_pvm") ? formValues[previousItem?.name] : formValues[nextItem?.name];
  let newDisabledDates = dateTypes?.arkipäivät?.dates;
  const lastPossibleDateToSelect = name.includes("kaynnistys_paattyy_pvm") ? findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompare,miniumDaysBetween) : findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompare,-miniumDaysBetween);
  return name.includes("kaynnistys_paattyy_pvm") ? newDisabledDates.filter(date => date >= lastPossibleDateToSelect) : newDisabledDates.filter(date => date <= lastPossibleDateToSelect);
};

const getAllowedDatesForApproval = (name, formValues, matchingItem, dateTypes) => {
  const minimumDaysBetween = matchingItem?.distance_from_previous;
  const dateToCompare = name.includes("hyvaksymispaatos_pvm") ? formValues["hyvaksyminenvaihe_alkaa_pvm"] : formValues["voimaantulovaihe_alkaa_pvm"];
  const filteredDateToCompare = findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompare);
  // Add distance in working days
  const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.työpäivät?.dates, filteredDateToCompare, minimumDaysBetween);
  return dateTypes?.arkipäivät?.dates.filter(date => date >= firstPossibleDateToSelect);
};

const getAllowedDatesForLautakunta = (name, formValues, phaseName, matchingItem, previousItem, dateTypes) => {
  let dateToComparePast;
  let miniumDaysPast;
  let filteredDateToCompare;
  let firstPossibleDateToSelect;
  //Change to correct comparable phase name from tarkistettu ehdotus to tarkistettu_ehdotus
  phaseName = phaseName?.includes("tarkistettu") && "tarkistettu_" + phaseName.replace("tarkistettu ", "") || phaseName;

  // Check if esilläolo is OFF for this phase (first esilläolo specifically)
  // Use !value to match Excel condition !jarjestetaan_*_esillaolo_1 (handles false, undefined, null)
  // Only periaatteet and luonnos phases have esilläolo
  const hasEsillaolo = phaseName === "periaatteet" || phaseName === "luonnos";
  const esillaoloOff = hasEsillaolo && !formValues[`jarjestetaan_${phaseName}_esillaolo_1`];

  if (name.includes("_maaraaika")) {
    if (hasEsillaolo && esillaoloOff) {
      const phaseStartDate = `${phaseName}vaihe_alkaa_pvm`;
      dateToComparePast = formValues[phaseStartDate];
      // Excel: P1 + 5 / L1 + 5 when esilläolo OFF
      miniumDaysPast = matchingItem?.distance_from_previous || 5;
      firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToComparePast, miniumDaysPast);
    } else {
      dateToComparePast = formValues[previousItem?.name];
      // Excel: P4 + 5 / L5 + 5 when esilläolo ON
      miniumDaysPast = matchingItem?.distance_from_previous || 5;
      firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToComparePast, miniumDaysPast);
    }
    let newDisabledDates = dateTypes?.työpäivät?.dates;
    return newDisabledDates.filter(date => date >= firstPossibleDateToSelect);
  } else if (name.includes("_lautakunnassa")) {
    // Handle esilläolo OFF case for Periaatteet/Luonnos phases
    if (esillaoloOff) {
      // When esilläolo is OFF, calculate from maaraaika date (P6/L6)
      // Excel formula: P7 = P6 + 21, L7 = L6 + 21
      const maaraaikaKey = phaseName === "periaatteet" 
        ? "periaatteet_lautakunta_aineiston_maaraaika" 
        : "kaavaluonnos_kylk_aineiston_maaraaika";
      dateToComparePast = formValues[maaraaikaKey];
      // Use distance_from_previous for validation (the buffer zone)
      // Excel shows P6 + 21 / L6 + 21, so fallback is 21 workdays from maaraaika
      miniumDaysPast = matchingItem?.distance_from_previous || 21;
      filteredDateToCompare = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToComparePast, miniumDaysPast);
    } else {
      // Existing logic for when esilläolo is ON
      const isPastFirst = formValues[`jarjestetaan_${phaseName}_esillaolo_2`] || formValues[`${phaseName}_lautakuntaan_2`] || formValues[`kaava${phaseName}_lautakuntaan_2`];
      // For validation, use distance_from_previous (buffer zone), not additive formula
      // Excel: P4 + 27 / L5 + 27 when esilläolo ON
      miniumDaysPast = matchingItem?.distance_from_previous || 27;
      if ((phaseName === "periaatteet" || phaseName === "luonnos") && !isPastFirst) {
        dateToComparePast = formValues[previousItem?.previous_deadline] || formValues[previousItem?.initial_distance?.base_deadline];
        filteredDateToCompare = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToComparePast, miniumDaysPast);
      } else if (matchingItem?.name === "milloin_kaavaluonnos_lautakunnassa" || matchingItem?.name === "milloin_periaatteet_lautakunnassa") {
        const esillaoloKeys = Object.keys(formValues).filter(key => key.includes(`jarjestetaan_${phaseName}_esillaolo`) && formValues[key] === true);
        const highestEsillaoloKey = esillaoloKeys.reduce((highestNumber, currentKey) => {
          const match = /_(\d+)$/.exec(currentKey);
          const currentNumber = parseInt(match ? match[1] : 0, 10);
          return currentNumber > highestNumber ? currentNumber : highestNumber;
        }, 0);
        if (highestEsillaoloKey !== 1) {
          dateToComparePast = formValues[`milloin_${phaseName}_esillaolo_paattyy_${highestEsillaoloKey}`];
        }
        filteredDateToCompare = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToComparePast, miniumDaysPast);
      } else {
        dateToComparePast = formValues[matchingItem?.previous_deadline] || formValues[matchingItem?.initial_distance?.base_deadline];
        filteredDateToCompare = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToComparePast, miniumDaysPast);
      }
    }

    const firstPossibleDateToSelect = findNextPossibleBoardDate(dateTypes?.lautakunnan_kokouspäivät?.dates, filteredDateToCompare);
    let newDisabledDates = dateTypes?.lautakunnan_kokouspäivät?.dates;
    return newDisabledDates.filter(date => date >= firstPossibleDateToSelect);
  }
};

const getAllowedDatesForSizeXSXL = (name, formValues, matchingItem, dateTypes) => {
  if (name.includes("_maaraaika")) {
    const miniumDaysBetween = matchingItem?.distance_from_previous;
    const dateToCompare = formValues[matchingItem?.previous_deadline];
    let newDisabledDates = dateTypes?.työpäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToCompare, miniumDaysBetween);
    return newDisabledDates.filter(date => date >= firstPossibleDateToSelect);
  } else if (name.includes("_alkaa")) {
    const miniumDaysPast = matchingItem?.distance_from_previous;
    const miniumDaysFuture = matchingItem?.distance_to_next;
    const dateToComparePast = formValues[matchingItem?.previous_deadline];
    const dateToCompareFuture = formValues[matchingItem?.next_deadline];
    let newDisabledDates = dateTypes?.esilläolopäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.esilläolopäivät?.dates, dateToComparePast, miniumDaysPast);
    const lastPossibleDateToSelect = findNextPossibleValue(dateTypes?.esilläolopäivät?.dates, dateToCompareFuture, -miniumDaysFuture);
    return newDisabledDates.filter(date => date >= firstPossibleDateToSelect && date < lastPossibleDateToSelect);
  } else if (name.includes("_paattyy")) {
    const miniumDaysPast = matchingItem?.distance_from_previous;
    const dateToComparePast = formValues[matchingItem?.previous_deadline];
    let newDisabledDates = dateTypes?.esilläolopäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.esilläolopäivät?.dates, dateToComparePast, miniumDaysPast);
    return newDisabledDates.filter(date => date >= firstPossibleDateToSelect);
  }
};

const getHighestLautakuntaDate = (formValues, phaseName) => {
  // Only consider VISIBLE lautakunta dates for the given phase
  // Uses vis_bool_group_map via getVisibilityBoolName for dynamic lookup
  
  // Map phaseName to deadline group phase prefix
  const getDeadlineGroupPhase = (phase) => {
    if (phase === 'periaatteet') return 'periaatteet';
    if (phase === 'luonnos') return 'luonnos';
    if (phase === 'ehdotus') return 'ehdotus';
    if (phase === 'tarkistettu_ehdotus' || phase === 'tarkistettu ehdotus') return 'tarkistettu_ehdotus';
    return 'ehdotus'; // fallback
  };
  
  // Map phaseName to date field prefix (milloin_X_lautakunnassa)
  const getFieldPrefix = (phase) => {
    if (phase === 'periaatteet') return 'periaatteet';
    if (phase === 'luonnos') return 'kaavaluonnos';
    if (phase === 'ehdotus') return 'kaavaehdotus';
    if (phase === 'tarkistettu_ehdotus' || phase === 'tarkistettu ehdotus') return 'tarkistettu_ehdotus';
    return 'kaavaehdotus'; // fallback
  };
  
  const deadlineGroupPhase = getDeadlineGroupPhase(phaseName);
  const fieldPrefix = getFieldPrefix(phaseName);
  const lautakuntaFieldPattern = `milloin_${fieldPrefix}_lautakunnassa`;
  
  // Convert date field to deadline group and use getVisibilityBoolName from vis_bool_group_map
  const getVisibilityFlag = (fieldName) => {
    const regex = new RegExp(`^milloin_${fieldPrefix}_lautakunnassa(_([0-9]+))?$`);
    const match = fieldName.match(regex);
    if (!match) return null;
    const suffix = match[2] || '1';
    // Build deadline group: e.g., 'ehdotus_lautakuntakerta_1'
    const deadlineGroup = `${deadlineGroupPhase}_lautakuntakerta_${suffix}`;
    // Use vis_bool_group_map lookup
    return getVisibilityBoolName(deadlineGroup);
  };
  
  const lautakuntaKeys = Object.keys(formValues).filter(key => key.startsWith(lautakuntaFieldPattern));
  
  // Filter to only visible lautakunta instances using vis_bool_group_map
  const visibleKeys = lautakuntaKeys.filter(key => {
    const visibilityFlag = getVisibilityFlag(key);
    return visibilityFlag && formValues[visibilityFlag];
  });
  
  // Find the latest date value among VISIBLE lautakunta instances only
  let latestDate = null;
  visibleKeys.forEach(key => {
    const date = formValues[key];
    if (date && (!latestDate || date > latestDate)) {
      latestDate = date;
    }
  });
  
  return latestDate;
};


const getAllowedDatesForNahtavillaolo = (name, formValues, phaseName, matchingItem, dateTypes, projectSize) => {
  if (name.includes("_maaraaika")) {
    const miniumDaysBetween = matchingItem?.distance_from_previous;
    const dateToCompare = formValues[matchingItem?.previous_deadline];
    let newDisabledDates = dateTypes?.työpäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToCompare, miniumDaysBetween);
    return newDisabledDates.filter(date => date >= firstPossibleDateToSelect);
  } 
  else if (name.includes("_alkaa")) {
    let dateToComparePast
    if(projectSize === 'L' || projectSize === 'XL'){
      const isPastFirst = formValues[`kaava${phaseName}_uudelleen_nahtaville_2`]
      if(isPastFirst){
        dateToComparePast = formValues[matchingItem?.previous_deadline];
      }
      else{
        dateToComparePast = getHighestLautakuntaDate(formValues, phaseName);
        if (!dateToComparePast && phaseName === "ehdotus") {
          // First lk deleted (XL)
          dateToComparePast = formValues["ehdotusvaihe_alkaa_pvm"];
        }
      }
    }
    else{
      dateToComparePast = formValues[matchingItem?.previous_deadline];
    }
    const miniumDaysPast = matchingItem?.distance_from_previous;
    const miniumDaysFuture = matchingItem?.distance_to_next;
    const dateToCompareFuture = formValues[matchingItem?.next_deadline];
    let newDisabledDates = dateTypes?.arkipäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToComparePast, miniumDaysPast);
    const lastPossibleDateToSelect = findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompareFuture, -miniumDaysFuture);
    // If first > last (impossible range due to cascade timing), only enforce minimum constraint
    if (firstPossibleDateToSelect > lastPossibleDateToSelect) {
      return newDisabledDates.filter(date => date >= firstPossibleDateToSelect);
    }
    return newDisabledDates.filter(date => date >= firstPossibleDateToSelect && date < lastPossibleDateToSelect);
  } else if (name.includes("_paattyy") || name.includes("viimeistaan_lausunnot")) {
    const miniumDaysPast = matchingItem?.distance_from_previous;
    const dateToComparePast = formValues[matchingItem?.previous_deadline];
    let newDisabledDates = dateTypes?.arkipäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToComparePast, miniumDaysPast);
    return newDisabledDates.filter(date => date >= firstPossibleDateToSelect);
  }
};

const calculateAllowedDates = (nahtavillaolo, size, dateTypes, name, formValues, sectionAttributes, currentDeadline) => {
  const matchingItem = objectUtil.findMatchingName(sectionAttributes, name, "name");
  const previousItem = objectUtil.findItem(sectionAttributes, name, "name", -1);
  const nextItem = objectUtil.findItem(sectionAttributes, name, "name", 1);
  const phaseName = currentDeadline?.deadline?.phase_name?.toLowerCase();
  let allowedDates;
  if (name.includes("projektin_kaynnistys_pvm") || name.includes("kaynnistys_paattyy_pvm")) {
      allowedDates = getAllowedDatesForProjectStart(name, formValues, previousItem, nextItem, dateTypes);
  } else if (["hyvaksymispaatos_pvm", "tullut_osittain_voimaan_pvm", "voimaantulo_pvm", "kumottu_pvm", "rauennut"].includes(name)) {
      allowedDates = getAllowedDatesForApproval(name, formValues, matchingItem, dateTypes);
      return allowedDates; // Skip filtering past dates for approval dates
  } else if (name === "hyvaksymispaatos_valitusaika_paattyy" || name === "valitusaika_paattyy_hallinto_oikeus") {
      allowedDates = dateTypes?.arkipäivät?.dates;
  } else if (currentDeadline?.deadline?.deadlinegroup?.includes('lautakunta')) {
      allowedDates = getAllowedDatesForLautakunta(name, formValues, phaseName, matchingItem, previousItem, dateTypes);
  } else if (nahtavillaolo) {
      allowedDates = getAllowedDatesForNahtavillaolo(name, formValues, phaseName, matchingItem, dateTypes, size);
  } else {
      allowedDates = getAllowedDatesForSizeXSXL(name, formValues, matchingItem, dateTypes);
  }
  // Filter out past dates (before today)
  const todayStr = (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  })();
  return Array.isArray(allowedDates)
      ? allowedDates.filter(date => date >= todayStr)
      : [];
};

const syncPhaseEndDates = (data, previousPaattyyValues) => {
  // K1 = U1 sync: kaynnistysvaihe_alkaa_pvm always equals projektin_kaynnistys_pvm
  if (data['projektin_kaynnistys_pvm']) {
    data['kaynnistysvaihe_alkaa_pvm'] = data['projektin_kaynnistys_pvm'];
  }

  // Static pairs: viimeistaan lausunnot -> ehdotuksen nähtävillä päättyy variants
  const lausuntoPairs = [
    ["viimeistaan_lausunnot_ehdotuksesta", "milloin_ehdotuksen_nahtavilla_paattyy"],
    ["viimeistaan_lausunnot_ehdotuksesta_2", "milloin_ehdotuksen_nahtavilla_paattyy_2"],
    ["viimeistaan_lausunnot_ehdotuksesta_3", "milloin_ehdotuksen_nahtavilla_paattyy_3"],
    ["viimeistaan_lausunnot_ehdotuksesta_4", "milloin_ehdotuksen_nahtavilla_paattyy_4"]
  ];

  const validateAndNormalizeDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d) ? null : d.toISOString().slice(0, 10);
  };

  // For each lausunto -> paattyy pair, ensure lausunto is not earlier than paattyy
  // Also, if previousPaattyyValues is provided, sync lausunnot to match new paattyy if it changed
  lausuntoPairs.forEach(([lausunto_date, paattyy_date]) => {
    const validPaattyyDate = validateAndNormalizeDate(data[paattyy_date]);
    if (!validPaattyyDate) return;

    const currentLausuntoDate = validateAndNormalizeDate(data[lausunto_date]);
    if(!currentLausuntoDate || currentLausuntoDate < validPaattyyDate) {
      data[lausunto_date] = validPaattyyDate;
      return;
    }
    if (previousPaattyyValues) {
      // Called from reducer with pre-cascade snapshot: sync lausunnot when paattyy changed
      const prevPaattyy = validateAndNormalizeDate(previousPaattyyValues[paattyy_date]);
      if (prevPaattyy !== validPaattyyDate) {
        // Paattyy changed (any reason) -> force lausunnot to match new paattyy
        data[lausunto_date] = validPaattyyDate;
      }
    }
  });

    // Return latest (max) valid date among baseKey and its *_2..*_4 variants
  const getLatestDateValue = (baseKey) => {
    if (!baseKey) return null;

    // Map date base keys to one or more activation boolean prefixes.
    // For each numeric suffix n (1..4), a variant is active if at least one flag is true.
    // Base variant (suffix 1) is active when no flags exist. Secondary slots without flags are skipped (KAPI-202).
    const activationMap = {
      milloin_periaatteet_lautakunnassa: ["periaatteet_lautakuntaan"],
      milloin_kaavaluonnos_lautakunnassa: ["kaavaluonnos_lautakuntaan"],
      milloin_tarkistettu_ehdotus_lautakunnassa: ["tarkistettu_ehdotus_lautakuntaan"],
      milloin_kaavaehdotus_lautakunnassa: ["kaavaehdotus_lautakuntaan"],
      milloin_ehdotuksen_nahtavilla_paattyy: ["kaavaehdotus_nahtaville", "kaavaehdotus_uudelleen_nahtaville"],
      milloin_periaatteet_esillaolo_paattyy: ["jarjestetaan_periaatteet_esillaolo"],
      milloin_luonnos_esillaolo_paattyy: ["jarjestetaan_luonnos_esillaolo"],
      milloin_oas_esillaolo_paattyy: ["jarjestetaan_oas_esillaolo"],
      viimeistaan_mielipiteet_periaatteista: ["jarjestetaan_periaatteet_esillaolo"],
      viimeistaan_mielipiteet_luonnos: ["jarjestetaan_luonnos_esillaolo"],
      viimeistaan_lausunnot_ehdotuksesta: ["kaavaehdotus_nahtaville", "kaavaehdotus_uudelleen_nahtaville"]
    };

    const activationPrefixes = activationMap[baseKey] || [];

    // Suffix 1 uses baseKey directly; suffixes 2+ append _N
    const variantKey = (suffix) => suffix === 1 ? baseKey : `${baseKey}_${suffix}`;

    const isVariantActive = (suffix) => {
      const flagKeys = activationPrefixes
        .map(prefix => `${prefix}_${suffix}`)
        .filter(key => Object.hasOwn(data, key));
      if (flagKeys.length === 0) return suffix === 1;
      return flagKeys.some(key => data[key] === true);
    };

    const activeDates = [1, 2, 3, 4]
      .filter(isVariantActive)
      .map(suffix => validateAndNormalizeDate(data[variantKey(suffix)]))
      .filter(Boolean);

    return activeDates.length ? activeDates.reduce((a, b) => (b > a ? b : a), activeDates[0]) : null;
  };

  // Maps phase end dates to their controlling source(s) for cascade enforcement
  const phaseEndDeadlines = [
    ["periaatteetvaihe_paattyy_pvm", "milloin_periaatteet_lautakunnassa", "viimeistaan_mielipiteet_periaatteista"],
    ["oasvaihe_paattyy_pvm", "milloin_oas_esillaolo_paattyy"],
    ["luonnosvaihe_paattyy_pvm", "milloin_kaavaluonnos_lautakunnassa", "viimeistaan_mielipiteet_luonnos"],
    ["ehdotusvaihe_paattyy_pvm", "viimeistaan_lausunnot_ehdotuksesta"],
    ["tarkistettuehdotusvaihe_paattyy_pvm", "milloin_tarkistettu_ehdotus_lautakunnassa"],
  ];
  phaseEndDeadlines.forEach(([dst, srcBase, fallbackBase]) => {
    const latest = getLatestDateValue(srcBase) || getLatestDateValue(fallbackBase);
    if (latest) {
      data[dst] = latest;
    }
  });

  const orderedPhases = [
    { start: "kaynnistysvaihe_alkaa_pvm", end: "kaynnistys_paattyy_pvm" },
    { start: "periaatteetvaihe_alkaa_pvm", end: "periaatteetvaihe_paattyy_pvm"},
    { start: "oasvaihe_alkaa_pvm", end: "oasvaihe_paattyy_pvm" },
    { start: "luonnosvaihe_alkaa_pvm", end: "luonnosvaihe_paattyy_pvm"},
    { start: "ehdotusvaihe_alkaa_pvm", end: "ehdotusvaihe_paattyy_pvm" },
    { start: "tarkistettuehdotusvaihe_alkaa_pvm", end: "tarkistettuehdotusvaihe_paattyy_pvm" },
    { start: "hyvaksyminenvaihe_alkaa_pvm", end: "hyvaksyminenvaihe_paattyy_pvm" },
    { start: "voimaantulovaihe_alkaa_pvm", end: "voimaantulovaihe_paattyy_pvm" }
  ];
  
  const existingPhases = orderedPhases.filter(p => data[p.start] || data[p.end]);

  // Sync each phase start to the previous phase end
  for (let i = 1; i < existingPhases.length; i++) {
    const prev = existingPhases[i - 1];
    const cur = existingPhases[i];
    const prevEnd = validateAndNormalizeDate(data[prev.end]);
    const curStart = validateAndNormalizeDate(data[cur.start]);
    if (prevEnd && curStart) {
      data[cur.start] = prevEnd;
    }
  }
};

const exported = {
    isWeekend,
    formatDate,
    formatRelativeDate,
    sortObjectByDate,
    isDate,
    isHoliday,
    calculateAllowedDates,
    getHighestVoimaantuloDate,
    syncPhaseEndDates,
    findFirstAllowedDate,
    findPastDateWithGap
};
if (process.env.UNIT_TEST === 'true') {
    exported.findNextPossibleValue = findNextPossibleValue;
    exported.findNextPossibleBoardDate = findNextPossibleBoardDate;
    exported.getAllowedDatesForProjectStart = getAllowedDatesForProjectStart;
    exported.getAllowedDatesForApproval = getAllowedDatesForApproval;
    exported.getAllowedDatesForLautakunta = getAllowedDatesForLautakunta;
    exported.getAllowedDatesForSizeXSXL = getAllowedDatesForSizeXSXL;
    exported.getAllowedDatesForNahtavillaolo = getAllowedDatesForNahtavillaolo;
    exported.getHighestLautakuntaDate = getHighestLautakuntaDate;
}

export default exported;