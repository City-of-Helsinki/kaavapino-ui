import objectUtil from "./objectUtil";
import { getVisibilityBoolName } from "./projectVisibilityUtils";

  const isWeekend = (date) => {
      const day = new Date(date).getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  const getHighestDate = (attributeValues) => {
    const datesToCompare = ["tullut_osittain_voimaan_pvm", "voimaantulo_pvm", "kumottu_pvm", "rauennut"]
    .map(dateField => attributeValues[dateField])
    .filter(date => date)
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
		const oneDayMs = 24 * 60 * 60 * 1000
		const diffMs = now.getTime() - updatedDate.getTime()
    if (diffMs < 0 || diffMs < oneDayMs) {
      return tFn ? tFn('relativeDates.today') : 'Today'
		}
		const days = Math.floor(diffMs / oneDayMs)
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

  // Function to get the date x weekdays earlier, excluding holidays
  const getPastDate = (startDate, validDaysToSubtract, isInFilter, excludedDays) => {
    let currentDate = new Date(startDate); // Start from the original date
    let subtractedDays = 0;

    // Loop until we have subtracted the required number of valid days
    while (subtractedDays < validDaysToSubtract) {
        currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day

        // Check if the current date is not a weekend and not a holiday
        if (!isWeekend(currentDate) && !isHoliday(currentDate,isInFilter,excludedDays)) {
            subtractedDays++; // Increment valid days counter
        }
    }
    return currentDate;
  }

  const calculateWeekdayDifference = (startDate, endDate) => {
    let end = new Date(endDate);
    let currentDate = new Date(startDate);
    let daysDifference = 1;
    let calculate = true

    // Loop from start date to end date
    while (calculate) {
        // Check if it's a weekday (Monday to Friday)
        if (!isWeekend(currentDate)) {
            daysDifference++;
        }
        
        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
        calculate = currentDate <= end
    }

    return daysDifference;
  }

  const normalizeDate = (date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    return new Date(normalizedDate);
  }

  const dateDifference = (cur, previousValue, currentValue, allowedDays, disabledDays, miniumGap, projectSize, addingNew) => {
    let previousDate = normalizeDate(previousValue);
    let currentDate = normalizeDate(currentValue);
    // Use database-provided minimum gap directly (from DeadlineDistance or Deadline models)
    let gap = miniumGap;

    if (previousDate >= currentDate) {
      currentDate = normalizeDate(previousDate);
      currentDate.setDate(currentDate.getDate() + gap);
    }

    let dateStr = currentDate.toISOString().split('T')[0];
    while (!allowedDays.includes(dateStr) || disabledDays.includes(dateStr) || calculateWeekdayDifference(previousDate, currentDate) < gap) {
      currentDate.setDate(currentDate.getDate() + 1);
      dateStr = currentDate.toISOString().split('T')[0];
    }

    let calendarDays = 0;
    let tempDate = normalizeDate(previousDate);
    if (previousDate < currentDate) {
      while (tempDate < new Date(currentDate)) {
        if (isWorkingDay(tempDate, allowedDays, disabledDays)) {
          calendarDays++;
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }
    }

    if (calendarDays < gap) {
      while (calendarDays <= gap) {
        if (isWorkingDay(currentDate, allowedDays, disabledDays)) {
          calendarDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      if (cur.includes("lautakunnassa")) {
        while (currentDate.getDay() !== 2 || !isWorkingDay(currentDate, allowedDays, disabledDays)) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Convert currentDate to the same format as the dates in the allowedDays array
    const formattedNewDate = currentDate.toISOString().split('T')[0];
    // Check that date is inside the allowedDays array
    if (!allowedDays.includes(formattedNewDate)) {
      // Find the next possible date from allowedDays because the date was not allowed
      const nextPossibleDate = allowedDays.find(date => new Date(date) > currentDate);
      if (nextPossibleDate) {
        currentDate = new Date(nextPossibleDate);
      }
    }

    return normalizeDate(currentDate);
  };

  const isWorkingDay = (date, allowedDays, holidays) => {
    const day = date.getDay();
    const formattedDate = formatDate(date);
    if (allowedDays.includes(formattedDate)) {
      return true;
    }
    return day !== 0 && day !== 6 && !holidays.includes(formattedDate);
  };

  const findAllowedLautakuntaDate = (newDate, miniumGap, allowedDays, moveToPast, maaraaikaAllowedDates) => {
    const gap = miniumGap;
    // Check for direct match in maaraaikaAllowedDates
    let maaraaikaMatch = maaraaikaAllowedDates.find(date => date === newDate);
    let maaraaikaDate;
    if (maaraaikaMatch) {
      const closestIndex = maaraaikaAllowedDates.indexOf(maaraaikaMatch);
      maaraaikaDate = moveToPast ? maaraaikaAllowedDates[closestIndex - gap] : maaraaikaAllowedDates[closestIndex + gap];
    }
    else{
      // Find the closest date from maaraaikaAllowedDates considering the miniumGap
      let closestDate = null;
      let smallestDiff = Infinity;

      maaraaikaAllowedDates.forEach(date => {
          const diff = new Date(date) - new Date(newDate);

          if (diff >= 0 && diff < smallestDiff) {
              smallestDiff = diff;
              closestDate = date;
          }
      });

      if (!closestDate) {
          return null; // Return null if no closest date is found
      }

      const closestIndex = maaraaikaAllowedDates.indexOf(closestDate);
      maaraaikaDate = moveToPast ? maaraaikaAllowedDates[closestIndex - gap] : maaraaikaAllowedDates[closestIndex + gap];
    }
    // Find the matching or closest date from allowedDays using the maaraaikaDate
    let match = allowedDays.find(date => date === maaraaikaDate);
    if (match) {
        return match;
    }

    // If no exact match is found, find the closest date from allowedDays
    let closestDate = null;
    let smallestDiff = Infinity;

    allowedDays.forEach(date => {
        const diff = new Date(date) - new Date(maaraaikaDate);

        if (diff >= 0 && diff < smallestDiff) {
            smallestDiff = diff;
            closestDate = date;
        }
    });

    return closestDate; // Return the closest date from allowedDays
  };

  const findAllowedDate = (newDate, miniumGap, allowedDays, moveToPast) => {
    //Find newDate from allowedDays, add miniumGap to it and return the date, moveToPast is reverse iteration of array

    const gap = miniumGap;
    // Check for direct match
    let match = allowedDays.find(date => date === newDate);
    if (match) {
      const matchIndex = allowedDays.indexOf(match);
      return moveToPast ? allowedDays[matchIndex - gap] : allowedDays[matchIndex + gap];
    }

    // Find the closest date if no exact match is found
    let closestDate = null;
    let smallestDiff = Infinity;

    allowedDays.forEach(date => {
      const diff = new Date(date) - new Date(newDate);

      if (diff >= 0 && diff < smallestDiff) {
        smallestDiff = diff;
        closestDate = date;
      }
    });

    if (closestDate) {
      const closestIndex = allowedDays.indexOf(closestDate);
      return moveToPast ? allowedDays[closestIndex - gap] : allowedDays[closestIndex + gap];
    }
  
    return null; // Return the date that meets the gap condition, or null if none
  };
  

  // Function to adjust dates if the difference is less than or equal to 5 days
  const adjustDates = (dataArray) => {
    for (let i = 0; i < dataArray.length - 1; i++) {
      const currentValue = dataArray[i].value;
      const nextValue = dataArray[i + 1].value;
      
      // Calculate the difference in days between current and next date
      let dateAndMin = dateDifference(currentValue, nextValue);

      if (dateAndMin <= 5) {

        // Add the difference to the next date
        const nextDate = new Date(nextValue);
        nextDate.setDate(nextDate.getDate() + dateAndMin); // Push next date forward by the difference

        // Update the next value in the array
        dataArray[i + 1].value = nextDate.toISOString().split('T')[0]; // Convert back to YYYY-MM-DD format

      }
    }
  }
  
  // Function to add days to a date and return in "YYYY-MM-DD" format
  const addDays = (type, date, days, disabledDates, excludeWeekends, origDate, allDisabledDates, initialDistance) => {
    let newDate = new Date(date);
    let originalDate = origDate ? new Date(origDate) : false;
    let filter = "";
    let isInFilter = true;
    let addDays = true;
    let finalDateStr;

    const setFilterAndInFilter = (type) => {
      if (["työpäivät", "esilläolopäivät", "arkipäivät", "lautakunta", "lautakunta_määräaika"].includes(type)) {
        filter = disabledDates;
        isInFilter = false;
      }
    };

    const calculateActualDifference = (originalDate, tempDate, workdays) => {
      let actualDifference = 0;
      let calculate = true
      while (calculate) {
        if (excludeWeekends && (originalDate.getDay() === 0 || originalDate.getDay() === 6)) {
          originalDate.setDate(originalDate.getDate() + 1);
        } else if (!checkArrayForValue(workdays, originalDate)) {
          originalDate.setDate(originalDate.getDate() + 1);
        } else {
          originalDate.setDate(originalDate.getDate() + 1);
          actualDifference++;
        }
        calculate = originalDate <= tempDate
      }
      return actualDifference + 4;
    };

    const adjustNewDate = (newDate, days) => {
      while (days > 0) {
        newDate.setDate(newDate.getDate() + 1);
        if (!excludeWeekends || (newDate.getDay() !== 0 && newDate.getDay() !== 6)) {
          days--;
        }
      }
    };

    const findNextValidDateAdd = (newDate, finalDateStr, filter, isInFilter) => {
      const isDateInFilter = (dateStr) => filter.includes(dateStr);
      while (isInFilter ? isDateInFilter(finalDateStr) : !isDateInFilter(finalDateStr)) {
        newDate.setDate(newDate.getDate() + 1);
        finalDateStr = formatDate(newDate);
      }
      return finalDateStr;
    };

    setFilterAndInFilter(type);

    if (["lautakunta", "lautakunta_määräaika"].includes(type)) {
      const workdays = allDisabledDates?.date_types?.työpäivät?.dates;
      let tempDate = new Date(newDate);

      if (originalDate && initialDistance) {
        let actualDifference = calculateActualDifference(originalDate, tempDate, workdays);
        if (actualDifference > initialDistance) {
          addDays = false;
        }
      }
    }

    if (type === "lautakunta_määräaika") {
      const resultPastDate = getPastDate(originalDate, initialDistance, isInFilter, filter);
      finalDateStr = formatDate(resultPastDate);
    } else {
      if (addDays) {
        adjustNewDate(newDate, days);
        finalDateStr = formatDate(newDate);
        finalDateStr = findNextValidDateAdd(newDate, finalDateStr, filter, isInFilter);
      } else {
        finalDateStr = date;
      }
    }

    return finalDateStr;
  };

  // Function to subtract days from a date and return in "YYYY-MM-DD" format
  const subtractDays = (type, date, days, disabledDates, excludeWeekends, origDate, allDisabledDates, initialDistance) => {
    let newDate = new Date(date);
    let originalDate = origDate ? new Date(origDate) : false;
    let filter = "";
    let subtractDays = true;
    let finalDateStr;
    let isInFilter = true;

    const setFilterAndInFilter = (type) => {
      if (["työpäivät", "esilläolopäivät", "arkipäivät", "lautakunta", "lautakunta_määräaika"].includes(type)) {
        filter = disabledDates;
        isInFilter = false;
      }
    };

    const calculateActualDifference = (originalDate, tempDate, workdays) => {
      let actualDifference = 0;
      let calculate = true
      while (calculate) {
        if (excludeWeekends && (tempDate.getDay() === 0 || tempDate.getDay() === 6)) {
          tempDate.setDate(tempDate.getDate() - 1);
        } else if (!checkArrayForValue(workdays, tempDate)) {
          tempDate.setDate(tempDate.getDate() - 1);
        } else {
          tempDate.setDate(tempDate.getDate() - 1);
          actualDifference++;
        }
        calculate = tempDate >= originalDate
      }
      return actualDifference - 4;
    };

    const adjustNewDate = (newDate, days) => {
      while (days > 0) {
        newDate.setDate(newDate.getDate() - 1);
        if (!excludeWeekends || (newDate.getDay() !== 0 && newDate.getDay() !== 6)) {
          days--;
        }
      }
    };

    const findNextValidDateSubstract = (newDate, finalDateStr, filter, isInFilter) => {
      const isDateInFilter = (dateStr) => filter.includes(dateStr);
      while (isInFilter ? isDateInFilter(finalDateStr) : !isDateInFilter(finalDateStr)) {
        newDate.setDate(newDate.getDate() - 1);
        finalDateStr = formatDate(newDate);
      }
      return finalDateStr;
    };

    setFilterAndInFilter(type);

    if (["lautakunta", "lautakunta_määräaika"].includes(type)) {
      const workdays = allDisabledDates?.date_types?.työpäivät?.dates;
      let tempDate = new Date(newDate);

      if (originalDate && initialDistance) {
        let actualDifference = calculateActualDifference(originalDate, tempDate, workdays);
        if (actualDifference < initialDistance) {
          subtractDays = false;
        }
      }
    }

    if (type === "lautakunta_määräaika") {
      const resultPastDate = getPastDate(originalDate, initialDistance, isInFilter, filter);
      finalDateStr = formatDate(resultPastDate);
    } else {
      if (subtractDays) {
        adjustNewDate(newDate, days);
        finalDateStr = formatDate(newDate);
        finalDateStr = findNextValidDateSubstract(newDate, finalDateStr, filter, isInFilter);
      } else {
        finalDateStr = date;
      }
    }
    return finalDateStr;
  };

  const checkArrayForValue = (arr,expectedDate) => {
    let index = 0;
    let isValid = false; // Flag to track the validity of the array

    // Use a while loop to iterate through the array
    while (index < arr.length) {
        // Check if the current array element matches the expected date
        if (arr[index] === formatDate(expectedDate)) {
            isValid = true; // Set flag to false
            break; // Stop execution if a mismatch is found
        }

        index++;
    }

    return isValid;
  }

  //calculate new date from original date when removing number of days
  const subtractDaysFromDate = (dateString, days) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - days);
    
    // Format the date to 'YYYY-MM-DD'
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-based month
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Function to shift dates forward only if the new date is greater or equal to the current one
const moveItemForward = (movedItemId, newStartDate, items) => {
  // Find the item that is being moved forward
  let itemIndex = items.findIndex(item => item.id === movedItemId);
  if (itemIndex === -1) return;

  // Calculate the difference in time between the old and new start date
  let item = items[itemIndex];
  let oldStartDate = item.start;
  let timeDifference = newStartDate - oldStartDate; // in milliseconds

  // Check if the new start date is after the old one
  if (timeDifference <= 0) {
    console.log("Cannot move item backward.");
    return;
  }

  // Update the moved item's start and end date
  item.start = newStartDate;
  item.end = new Date(item.end.getTime() + timeDifference);

  // Update all subsequent items if their current start date is before or equal to the new moved date
  for (let i = itemIndex + 1; i < items.length; i++) {
    if (items[i].start <= item.end) {
      // Shift start and end date of subsequent item
      items[i].start = new Date(items[i].start.getTime() + timeDifference);
      items[i].end = new Date(items[i].end.getTime() + timeDifference);
    }
  }
}

// Check if a string is in "YYYY-MM-DD" format
const isDate = (value) => {
  // Regular expression for YYYY-MM-DD format
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
//Finds next possible date from from array if the value does not exist in it
const findNextPossibleValue = (array, value, addedDays) => {
  if (!Array.isArray(array) || typeof value !== 'string') {
    throw new Error('Invalid input. Provide an array of strings and a value as a string.');
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
    throw new Error('Invalid input. Provide an array of strings and a value as a string.');
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

const getDisabledDatesForProjectStart = (name, formValues, previousItem, nextItem, dateTypes) => {
  const miniumDaysBetween = nextItem?.distance_from_previous;
  const dateToCompare = name.includes("kaynnistys_paattyy_pvm") ? formValues[previousItem?.name] : formValues[nextItem?.name];
  let newDisabledDates = dateTypes?.arkipäivät?.dates;
  const lastPossibleDateToSelect = name.includes("kaynnistys_paattyy_pvm") ? findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompare,miniumDaysBetween) : findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompare,-miniumDaysBetween);
  return name.includes("kaynnistys_paattyy_pvm") ? newDisabledDates.filter(date => date >= lastPossibleDateToSelect) : newDisabledDates.filter(date => date <= lastPossibleDateToSelect);
};

const getDisabledDatesForApproval = (name, formValues, matchingItem, dateTypes, projectSize) => {
  const miniumDaysBetween = matchingItem?.distance_from_previous;
  const dateToCompare = name.includes("hyvaksymispaatos_pvm") ? formValues["hyvaksyminenvaihe_alkaa_pvm"] : formValues["voimaantulovaihe_alkaa_pvm"];
  const filteredDateToCompare = findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompare);
  let newDisabledDates = dateTypes?.arkipäivät?.dates;
  const lastPossibleDateToSelect = addDays("työpäivät", filteredDateToCompare, miniumDaysBetween, dateTypes?.työpäivät?.dates, true);
  //Approval dates can be same as last phases ending date when XS or S size
  if(name.includes("hyvaksymispaatos_pvm") && (projectSize === 'XS' || projectSize === 'S')){
    return newDisabledDates.filter(date => date >= lastPossibleDateToSelect);
  }
  else{
    return newDisabledDates.filter(date => date > lastPossibleDateToSelect);
  }

};

const getDisabledDatesForLautakunta = (name, formValues, phaseName, matchingItem, previousItem, dateTypes) => {
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

const getDisabledDatesForSizeXSXL = (name, formValues, matchingItem, dateTypes) => {
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


const getDisabledDatesForNahtavillaolo = (name, formValues, phaseName, matchingItem, dateTypes, projectSize) => {

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
      allowedDates = getDisabledDatesForProjectStart(name, formValues, previousItem, nextItem, dateTypes);
  } else if (["hyvaksymispaatos_pvm", "tullut_osittain_voimaan_pvm", "voimaantulo_pvm", "kumottu_pvm", "rauennut"].includes(name)) {
      allowedDates = getDisabledDatesForApproval(name, formValues, matchingItem, dateTypes, size);
      return allowedDates; // Skip filtering past dates for approval dates
  } else if (name === "hyvaksymispaatos_valitusaika_paattyy" || name === "valitusaika_paattyy_hallinto_oikeus") {
      allowedDates = dateTypes?.arkipäivät?.dates;
  } else if (currentDeadline?.deadline?.deadlinegroup?.includes('lautakunta')) {
      allowedDates = getDisabledDatesForLautakunta(name, formValues, phaseName, matchingItem, previousItem, dateTypes);
  } else if (!nahtavillaolo) {
      allowedDates = getDisabledDatesForSizeXSXL(name, formValues, matchingItem, dateTypes);
  } else {
      allowedDates = getDisabledDatesForNahtavillaolo(name, formValues, phaseName, matchingItem, dateTypes, size);
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

const compareAndUpdateDates = (data, previousPaattyyValues) => {
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

  // Return latest (max) valid date among baseKey and its *_2..*_4 variants
  const getLatestDateValue = (baseKey) => {
    // Map date base keys to one or more activation boolean prefixes.
    // For each numeric suffix n (1..4), if ALL listed prefixes exist for that n and are false, the candidate is ignored.
    // Base variant without suffix corresponds logically to _1 booleans.
    const activationMap = {
      milloin_periaatteet_lautakunnassa: ["periaatteet_lautakuntaan"],
      milloin_kaavaluonnos_lautakunnassa: ["kaavaluonnos_lautakuntaan"],
      milloin_tarkistettu_ehdotus_lautakunnassa: ["tarkistettu_ehdotus_lautakuntaan"],
      milloin_kaavaehdotus_lautakunnassa: ["kaavaehdotus_lautakuntaan"],
      // Ehdotuksen nähtävillä end dates may be controlled either by initial nahtaville_1 or uudelleen_nahtaville_n flags
      milloin_ehdotuksen_nahtavilla_paattyy: ["kaavaehdotus_nahtaville", "kaavaehdotus_uudelleen_nahtaville"],
      // Esilläolo variants (example pattern) – extend if needed later
      milloin_periaatteet_esillaolo_paattyy: ["jarjestetaan_periaatteet_esillaolo"],
      milloin_luonnos_esillaolo_paattyy: ["jarjestetaan_luonnos_esillaolo"],
      milloin_oas_esillaolo_paattyy: ["jarjestetaan_oas_esillaolo"],
      // Viimeistaan mielipiteet dates tied to esillaolo activation
      viimeistaan_mielipiteet_periaatteista: ["jarjestetaan_periaatteet_esillaolo"],
      viimeistaan_mielipiteet_luonnos: ["jarjestetaan_luonnos_esillaolo"],
      // Viimeistaan lausunnot tied to nahtaville activation
      viimeistaan_lausunnot_ehdotuksesta: ["kaavaehdotus_nahtaville", "kaavaehdotus_uudelleen_nahtaville"]
    };

    const activationPrefixes = activationMap[baseKey] || [];

    const variantKeys = [baseKey, `${baseKey}_2`, `${baseKey}_3`, `${baseKey}_4`];
    const validVariants = [];

    for (let i = 0; i < variantKeys.length; i++) {
      const key = variantKeys[i];
      const normalized = validateAndNormalizeDate(data[key]);
      if (!normalized) continue; // skip empty / invalid
      const suffixNumber = i === 0 ? 1 : (i + 1); // base -> 1, _2 -> 2, etc.
      // Determine activation booleans for this suffix
      let hasAtLeastOneActivation = false;
      let anyActive = false;
      for (const prefix of activationPrefixes) {
        const boolKey = `${prefix}_${suffixNumber}`;
        if (Object.prototype.hasOwnProperty.call(data, boolKey)) {
          hasAtLeastOneActivation = true;
          if (data[boolKey] === true) {
            anyActive = true;
          }
        }
      }
      // If there were activation flags and none are active, skip this variant
      if (hasAtLeastOneActivation && !anyActive) continue;
      // KAPI-202: Secondary slots (suffix > 1) without any activation bool should be skipped.
      // If the bool key doesn't exist, the slot hasn't been added yet.
      if (!hasAtLeastOneActivation && suffixNumber > 1) continue;
      validVariants.push(normalized);
    }

    if (!validVariants.length) return null;
    return validVariants.reduce((a, b) => (b > a ? b : a), validVariants[0]);
  };

  lausuntoPairs.forEach(([lausunto_date, paattyy_date]) => {
    const validPaattyyDate = validateAndNormalizeDate(data[paattyy_date]);
    if (validPaattyyDate) {
      const currentLausuntoDate = validateAndNormalizeDate(data[lausunto_date]);
      if (previousPaattyyValues) {
        // Called from reducer with pre-cascade snapshot: sync lausunnot when paattyy changed
        const prevPaattyy = validateAndNormalizeDate(previousPaattyyValues[paattyy_date]);
        if (prevPaattyy !== validPaattyyDate) {
          // Paattyy changed (any reason) -> force lausunnot to match new paattyy
          data[lausunto_date] = validPaattyyDate;
        } else if (!currentLausuntoDate || currentLausuntoDate < validPaattyyDate) {
          // Paattyy did not change but lausunnot is empty or before paattyy -> floor constraint
          data[lausunto_date] = validPaattyyDate;
        }
      } else {
        // Called without snapshot (e.g. from EditProjectTimetableModal): apply floor constraint only
        if (!currentLausuntoDate || currentLausuntoDate < validPaattyyDate) {
          data[lausunto_date] = validPaattyyDate;
        }
      }
    }
  });
  //Check that phase end date line is moved to phases actual last date 
  const buildPhasePairs = (size) => {
    // Each entry: [dstField, primarySrcBase, fallbackSrcBase?]
    // Primary is tried first; if getLatestDateValue returns null, fallback is tried.
    // Per database_deadline_rules.md: P8/L8 fallback to viimeistaan_mielipiteet when no lautakunta
    // E9 uses viimeistaan_lausunnot_ehdotuksesta for all sizes
    return [
      ["periaatteetvaihe_paattyy_pvm", "milloin_periaatteet_lautakunnassa", "viimeistaan_mielipiteet_periaatteista"],
      ["oasvaihe_paattyy_pvm", "milloin_oas_esillaolo_paattyy"],
      ["luonnosvaihe_paattyy_pvm", "milloin_kaavaluonnos_lautakunnassa", "viimeistaan_mielipiteet_luonnos"],
      // E9: All sizes use viimeistaan_lausunnot_ehdotuksesta for ehdotus phase end
      ["ehdotusvaihe_paattyy_pvm", "viimeistaan_lausunnot_ehdotuksesta"],
      ["tarkistettuehdotusvaihe_paattyy_pvm", "milloin_tarkistettu_ehdotus_lautakunnassa"],
      // hyvaksyminen & voimaantulo intentionally excluded (no paired controlling date specified)
    ];
  };

  const phasePairs = buildPhasePairs(data["kaavaprosessin_kokoluokka"]);
  phasePairs.forEach(([dst, srcBase, fallbackBase]) => {
    // Always pick the latest available date among base + suffixed variants
    let latest = getLatestDateValue(srcBase);
    // If primary source yields nothing (e.g. lautakunta disabled), try fallback
    if (!latest && fallbackBase) {
      latest = getLatestDateValue(fallbackBase);
    }
    if (latest && data[dst] !== latest) {
      data[dst] = latest;
    }
  });
  // Enforce phase adjacency: next phase alkaa >= previous phase paattyy
  // Spec: P1=K2, O1=P8|K2, L1=O6, E1=L8|O6, T1=E9, H1=T5, V1=H3
  const orderedPhases = [
    { start: "kaynnistysvaihe_alkaa_pvm", end: "kaynnistys_paattyy_pvm" },
    { start: "periaatteetvaihe_alkaa_pvm", end: "periaatteetvaihe_paattyy_pvm", optional: true },
    { start: "oasvaihe_alkaa_pvm", end: "oasvaihe_paattyy_pvm" },
    { start: "luonnosvaihe_alkaa_pvm", end: "luonnosvaihe_paattyy_pvm", optional: true },
    { start: "ehdotusvaihe_alkaa_pvm", end: "ehdotusvaihe_paattyy_pvm" },
    { start: "tarkistettuehdotusvaihe_alkaa_pvm", end: "tarkistettuehdotusvaihe_paattyy_pvm" },
    { start: "hyvaksyminenvaihe_alkaa_pvm", end: "hyvaksyminenvaihe_paattyy_pvm" },
    { start: "voimaantulovaihe_alkaa_pvm", end: "voimaantulovaihe_paattyy_pvm" }
  ];

  // Build filtered sequence of phases that actually exist (have either start or end present)
  const existingPhases = orderedPhases.filter(p => data[p.start] || data[p.end]);

  // Forward adjacency: next phase start >= previous phase end
  for (let i = 1; i < existingPhases.length; i++) {
    const prev = existingPhases[i - 1];
    const cur = existingPhases[i];
    const prevEnd = validateAndNormalizeDate(data[prev.end]);
    const curStart = validateAndNormalizeDate(data[cur.start]);
    if (prevEnd && curStart && curStart < prevEnd) {
      data[cur.start] = prevEnd;
    }
  }

  // Backward cascade: when phase end moves earlier, move next phase start back to match
  // This handles cases like removing Tarkistettu Ehdotus lautakunta elements
  for (let i = 1; i < existingPhases.length; i++) {
    const prev = existingPhases[i - 1];
    const cur = existingPhases[i];
    const prevEnd = validateAndNormalizeDate(data[prev.end]);
    const curStart = validateAndNormalizeDate(data[cur.start]);
    if (prevEnd && curStart && curStart > prevEnd) {
      data[cur.start] = prevEnd;
    }
  }
};

const exported = {
    isWeekend,
    addDays,
    subtractDays,
    formatDate,
    formatRelativeDate,
    subtractDaysFromDate,
    moveItemForward,
    sortObjectByDate,
    dateDifference,
    adjustDates,
    isDate,
    calculateWeekdayDifference,
    isHoliday,
    calculateAllowedDates,
    getHighestDate,
    findAllowedDate,
    findAllowedLautakuntaDate,
    compareAndUpdateDates
};
if (process.env.UNIT_TEST === 'true') {
    exported.getPastDate = getPastDate;
    exported.findNextPossibleValue = findNextPossibleValue;
    exported.findNextPossibleBoardDate = findNextPossibleBoardDate;
    exported.getDisabledDatesForProjectStart = getDisabledDatesForProjectStart;
    exported.getDisabledDatesForApproval = getDisabledDatesForApproval;
    exported.getDisabledDatesForLautakunta = getDisabledDatesForLautakunta;
    exported.getDisabledDatesForSizeXSXL = getDisabledDatesForSizeXSXL;
    exported.getDisabledDatesForNahtavillaolo = getDisabledDatesForNahtavillaolo;
    exported.getHighestLautakuntaDate = getHighestLautakuntaDate;
}

export default exported;