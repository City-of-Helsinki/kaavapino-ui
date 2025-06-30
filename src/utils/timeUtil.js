import { max } from "moment";
import objectUtil from "./objectUtil";

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
    let gap = miniumGap;
    if (!addingNew) {
      if (!cur.includes("_lautakunta_aineiston_maaraaika") && !cur.includes("kylk_aineiston_maaraaika") && cur.includes("maaraaika") || miniumGap >= 31) {
        gap = 5;
      }
    } else if ((addingNew && (projectSize === 'M' || projectSize === 'S') && cur.includes("milloin_ehdotuksen_nahtavilla_paattyy"))) {
      gap = 22;
    }

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

const calculateTotalDistances = (startIndex, endIndex, sectionAttributes, formValues, dateTypes) => {
  const formStartDate = formValues[sectionAttributes[startIndex].name];
  const formEndDate = formValues[sectionAttributes[endIndex].name];
  let totalDistance = 0;
  let holidayCount = 0;
  // Calculate original total distance from section attributes
  for (let i = startIndex; i <= endIndex; i++) {
    if (i !== startIndex) {
      totalDistance += (sectionAttributes[i]?.distance_from_previous || 0);
    }
  }
  // Use arkipäivät to find holidays (weekdays not in arkipäivät = holidays)
  if (formStartDate && formEndDate && dateTypes["arkipäivät"]?.dates) {
    const weekdayDates = dateTypes["arkipäivät"].dates;
    const endDate = new Date(formEndDate);
    
    for (let currentDate = new Date(formStartDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dateStr = formatDate(currentDate);
      const dayOfWeek = currentDate.getDay();
      // If it's a weekday (Mon-Fri) but NOT in arkipäivät, it's a holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !weekdayDates.includes(dateStr)) {
        holidayCount++;
      }
    }
  }
  // Subtract holidays from total distance
  if(sectionAttributes[startIndex].date_type !== "esilläolopäivät"){
    totalDistance -= holidayCount;
  }
  return totalDistance;
};

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

const getDisabledDatesForProjectStart = (name, formValues, previousItem, nextItem, dateTypes, lockedItem, maxLockedDistance, lockDateLimit) => {
  const miniumDaysBetween = nextItem?.distance_from_previous;
  const dateToCompare = name.includes("kaynnistys_paattyy_pvm")
    ? formValues[previousItem?.name]
    : formValues[nextItem?.name];
  let newDisabledDates = dateTypes?.arkipäivät?.dates;

  const firstPossibleDateToSelect = name.includes("kaynnistys_paattyy_pvm")
    ? findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompare, miniumDaysBetween)
    : findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompare, -miniumDaysBetween);

  const lastPossibleDateToSelect = lockedItem
    ? findNextPossibleValue(dateTypes?.arkipäivät?.dates, lockDateLimit, -maxLockedDistance)
    : null;

  return name.includes("kaynnistys_paattyy_pvm")
    ? newDisabledDates.filter(date => date >= firstPossibleDateToSelect && (!lockedItem || date <= lastPossibleDateToSelect))
    : newDisabledDates.filter(date => date <= firstPossibleDateToSelect && (!lockedItem || date <= lastPossibleDateToSelect));
};

const getDisabledDatesForApproval = (name, formValues, matchingItem, dateTypes, projectSize) => {
  const miniumDaysBetween = matchingItem?.distance_from_previous;
  const dateToCompare = name.includes("hyvaksymispaatos_pvm") ? formValues["hyvaksyminenvaihe_alkaa_pvm"] : formValues["voimaantulovaihe_alkaa_pvm"];
  const filteredDateToCompare = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToCompare);
  let newDisabledDates = dateTypes?.työpäivät?.dates;
  const lastPossibleDateToSelect = addDays("työpäivät", filteredDateToCompare, miniumDaysBetween, dateTypes?.työpäivät?.dates, true);
  //Approval dates can be same as last phases ending date when XS or S size
  if(name.includes("hyvaksymispaatos_pvm") && (projectSize === 'XS' || projectSize === 'S')){
    return newDisabledDates.filter(date => date >= lastPossibleDateToSelect);
  }
  else{
    return newDisabledDates.filter(date => date > lastPossibleDateToSelect);
  }

};

const getDisabledDatesForLautakunta = (name, formValues, phaseName, matchingItem, previousItem, dateTypes, lockedItem, maxLockedDistance, lockDateLimit) => {
  let dateToComparePast;
  let miniumDaysPast;
  let filteredDateToCompare;
  let firstPossibleDateToSelect;

  phaseName = phaseName?.includes("tarkistettu") && "tarkistettu_" + phaseName.replace("tarkistettu ", "") || phaseName;

  if (name.includes("_maaraaika")) {
    if (formValues[`jarjestetaan_${phaseName}_esillaolo_1`] === false) {
      const phaseStartDate = `${phaseName}vaihe_alkaa_pvm`;
      dateToComparePast = formValues[phaseStartDate];
      miniumDaysPast = 5;
      firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToComparePast, miniumDaysPast);
    } else {
      dateToComparePast = formValues[previousItem?.name];
      miniumDaysPast = matchingItem?.distance_from_previous || 5;
      firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToComparePast, miniumDaysPast);
    }

    const lastPossibleDateToSelect = lockedItem
      ? findNextPossibleValue(dateTypes?.työpäivät?.dates, lockDateLimit, -maxLockedDistance)
      : null;

    let newDisabledDates = dateTypes?.työpäivät?.dates;
    return newDisabledDates.filter(date =>
      date >= firstPossibleDateToSelect &&
      (!lockedItem || date <= lastPossibleDateToSelect)
    );
  }

  else if (name.includes("_lautakunnassa")) {
    const isPastFirst = formValues[`jarjestetaan_${phaseName}_esillaolo_2`] || formValues[`${phaseName}_lautakuntaan_2`] || formValues[`kaava${phaseName}_lautakuntaan_2`];
    const fromPrevious = isPastFirst ? matchingItem?.distance_from_previous : false;
    miniumDaysPast = fromPrevious || (matchingItem?.initial_distance.distance + previousItem?.distance_from_previous);

    if ((phaseName === "periaatteet" || phaseName === "luonnos") && !isPastFirst) {
      dateToComparePast = formValues[previousItem?.previous_deadline] || formValues[previousItem?.initial_distance?.base_deadline];
      filteredDateToCompare = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToComparePast, miniumDaysPast);
    } else if (["milloin_kaavaluonnos_lautakunnassa", "milloin_periaatteet_lautakunnassa"].includes(matchingItem?.name)) {
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

    const firstPossibleDateToSelect = findNextPossibleBoardDate(dateTypes?.lautakunnan_kokouspäivät?.dates, filteredDateToCompare);
    const lastPossibleDateToSelect = lockedItem
      ? findNextPossibleValue(dateTypes?.työpäivät?.dates, lockDateLimit, -maxLockedDistance)
      : null;

    let newDisabledDates = dateTypes?.lautakunnan_kokouspäivät?.dates;
    return newDisabledDates.filter(date =>
      date >= firstPossibleDateToSelect &&
      (!lockedItem || date < lastPossibleDateToSelect)
    );
  }
};

const getDisabledDatesForSizeXSXL = (name, formValues, matchingItem, dateTypes, lockedItem, maxLockedDistance, lockDateLimit) => {
  if (name.includes("_maaraaika")) {
    const miniumDaysBetween = matchingItem?.distance_from_previous;
    const dateToCompare = formValues[matchingItem?.previous_deadline];
    let newDisabledDates = dateTypes?.työpäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToCompare, miniumDaysBetween);
    const lastPossibleDateToSelect = lockedItem
      ? findNextPossibleValue(dateTypes?.työpäivät?.dates, lockDateLimit, -maxLockedDistance)
      : null;
    return newDisabledDates.filter(date =>
      date >= firstPossibleDateToSelect &&
      (!lockedItem || date <= lastPossibleDateToSelect)
    );
  } else if (name.includes("_alkaa")) {
    const miniumDaysPast = matchingItem?.distance_from_previous;
    const miniumDaysFuture = matchingItem?.distance_to_next;
    const dateToComparePast = formValues[matchingItem?.previous_deadline];
    const dateToCompareFuture = formValues[matchingItem?.next_deadline];
    let newDisabledDates = dateTypes?.esilläolopäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.esilläolopäivät?.dates, dateToComparePast, miniumDaysPast);
    const lastPossibleDateToSelect = findNextPossibleValue(dateTypes?.esilläolopäivät?.dates, dateToCompareFuture, -miniumDaysFuture);
    return newDisabledDates.filter(date =>
      date >= firstPossibleDateToSelect &&
      date < lastPossibleDateToSelect
    );
  } else if (name.includes("_paattyy")) {
    const miniumDaysPast = matchingItem?.distance_from_previous;
    const dateToComparePast = formValues[matchingItem?.previous_deadline];
    let newDisabledDates = dateTypes?.esilläolopäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.esilläolopäivät?.dates, dateToComparePast, miniumDaysPast);
    const lastPossibleDateToSelect = lockedItem
      ? findNextPossibleValue(dateTypes?.esilläolopäivät?.dates, lockDateLimit, -maxLockedDistance)
      : null;
    return newDisabledDates.filter(date =>
      date >= firstPossibleDateToSelect &&
      (!lockedItem || date <= lastPossibleDateToSelect)
    );
  }
};

const getHighestLautakuntaDate = (formValues) => {
  const lautakuntaKeys = Object.keys(formValues).filter(key => key.includes(`milloin_kaavaehdotus_lautakunnassa`));
  const highestLautakuntaKey = lautakuntaKeys.reduce((highestNumber, currentKey) => {
    const match = /_(\d+)$/.exec(currentKey);
    const currentNumber = parseInt(match ? match[1] : 0, 10);
    return currentNumber > highestNumber ? currentNumber : highestNumber;
  }, 0);

  if (highestLautakuntaKey > 1) {
    return formValues[`milloin_kaavaehdotus_lautakunnassa_${highestLautakuntaKey}`];
  }
  else{
    return formValues[`milloin_kaavaehdotus_lautakunnassa`];
  }
};


const getDisabledDatesForNahtavillaolo = (name, formValues, phaseName, matchingItem, dateTypes, projectSize, lockedItem, maxLockedDistance, lockDateLimit) => {
  if (name.includes("_maaraaika")) {
    const miniumDaysBetween = matchingItem?.distance_from_previous;
    const dateToCompare = formValues[matchingItem?.previous_deadline];
    let newDisabledDates = dateTypes?.työpäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.työpäivät?.dates, dateToCompare, miniumDaysBetween);
    const lastPossibleDateToSelect = lockedItem
      ? findNextPossibleValue(dateTypes?.työpäivät?.dates, lockDateLimit, -maxLockedDistance)
      : null;
    return newDisabledDates.filter(date =>
      date >= firstPossibleDateToSelect &&
      (!lockedItem || date <= lastPossibleDateToSelect)
    );
  } else if (name.includes("_alkaa")) {
    let dateToComparePast;
    if (projectSize === 'L' || projectSize === 'XL') {
      const isPastFirst = formValues[`kaava${phaseName}_uudelleen_nahtaville_2`];
      dateToComparePast = isPastFirst
        ? formValues[matchingItem?.previous_deadline]
        : getHighestLautakuntaDate(formValues);
    } else {
      dateToComparePast = formValues[matchingItem?.previous_deadline];
    }

    const miniumDaysPast = matchingItem?.distance_from_previous;
    const miniumDaysFuture = matchingItem?.distance_to_next;
    const dateToCompareFuture = formValues[matchingItem?.next_deadline];
    let newDisabledDates = dateTypes?.arkipäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToComparePast, miniumDaysPast);
    const lastPossibleDateToSelect = findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToCompareFuture, -miniumDaysFuture);
    return newDisabledDates.filter(date =>
      date >= firstPossibleDateToSelect &&
      date < lastPossibleDateToSelect
    );
  } else if (name.includes("_paattyy") || name.includes("viimeistaan_lausunnot")) {
    const miniumDaysPast = matchingItem?.distance_from_previous;
    const dateToComparePast = formValues[matchingItem?.previous_deadline];
    let newDisabledDates = dateTypes?.arkipäivät?.dates;
    const firstPossibleDateToSelect = findNextPossibleValue(dateTypes?.arkipäivät?.dates, dateToComparePast, miniumDaysPast);
    const lastPossibleDateToSelect = lockedItem
      ? findNextPossibleValue(dateTypes?.arkipäivät?.dates, lockDateLimit, -maxLockedDistance)
      : null;
    return newDisabledDates.filter(date =>
      date >= firstPossibleDateToSelect &&
      (!lockedItem || date < lastPossibleDateToSelect)
    );
  }
};

const calculateDisabledDates = (nahtavillaolo, size, dateTypes, name, formValues, sectionAttributes, currentDeadline, lockedGroup) => {
  const matchingItem = objectUtil.findMatchingName(sectionAttributes, name, "name");
  const previousItem = objectUtil.findItem(sectionAttributes, name, "name", -1);
  const nextItem = objectUtil.findItem(sectionAttributes, name, "name", 1);
  const phaseName = currentDeadline?.deadline?.phase_name?.toLowerCase();
  const lockedItem = objectUtil.findMatchingName(sectionAttributes, lockedGroup?.lockedGroup, "attributegroup", 1);
  let maxLockedDistance = 0;
  const startIndex = sectionAttributes.findIndex(attr => attr.attributegroup === matchingItem?.attributegroup && attr.name === name);
  const endIndex = sectionAttributes.findIndex(attr => attr.attributegroup === lockedItem?.attributegroup);
  //Date for last possible date to select if locking is on
  const lockDateLimit = lockedItem ? (() => {
    const date = new Date(lockedGroup?.lockedStartTime);
    date.setDate(date.getDate());
    return date.toISOString().slice(0, 10);
  })() : false;

  if(lockedItem && startIndex !== -1 && endIndex !== -1){
    maxLockedDistance = calculateTotalDistances(startIndex,endIndex, sectionAttributes, formValues, dateTypes);
  }
  if (name.includes("projektin_kaynnistys_pvm") || name.includes("kaynnistys_paattyy_pvm")) {
    return getDisabledDatesForProjectStart(name, formValues, previousItem, nextItem, dateTypes, lockedItem, maxLockedDistance, lockDateLimit);
  } else if (["hyvaksymispaatos_pvm", "tullut_osittain_voimaan_pvm", "voimaantulo_pvm", "kumottu_pvm", "rauenut"].includes(name)) {
    return getDisabledDatesForApproval(name, formValues, matchingItem, dateTypes, size);
  } else if (name === "hyvaksymispaatos_valitusaika_paattyy" || name === "valitusaika_paattyy_hallinto_oikeus") {
    return dateTypes?.arkipäivät?.dates;
  } else if (currentDeadline?.deadline?.deadlinegroup?.includes('lautakunta')) {
    return getDisabledDatesForLautakunta(name, formValues, phaseName, matchingItem, previousItem, dateTypes, lockedItem, maxLockedDistance, lockDateLimit);
  } else if (!nahtavillaolo) {
    return getDisabledDatesForSizeXSXL(name, formValues, matchingItem, dateTypes, lockedItem, maxLockedDistance, lockDateLimit);
  } else {
    return getDisabledDatesForNahtavillaolo(name, formValues, phaseName, matchingItem, dateTypes, size, lockedItem, maxLockedDistance, lockDateLimit);
  }
};

const compareAndUpdateDates = (data) => {
  //Updates viimeistaan lausunnot values to paattyy if paattyy date is greater
  const pairs = [
    ["viimeistaan_lausunnot_ehdotuksesta", "milloin_ehdotuksen_nahtavilla_paattyy"],
    ["viimeistaan_lausunnot_ehdotuksesta_2", "milloin_ehdotuksen_nahtavilla_paattyy_2"],
    ["viimeistaan_lausunnot_ehdotuksesta_3", "milloin_ehdotuksen_nahtavilla_paattyy_3"],
    ["viimeistaan_lausunnot_ehdotuksesta_4", "milloin_ehdotuksen_nahtavilla_paattyy_4"]
  ];

  pairs.forEach(([key1, key2]) => {
    if (data[key1] && data[key2]) {
      const date1 = new Date(data[key1]).toISOString().slice(0, 10);
      const date2 = new Date(data[key2]).toISOString().slice(0, 10);
      if (date1 < date2) {
        data[key1] = date2;
      }
    }
  });
};
 
export default {
    isWeekend,
    addDays,
    subtractDays,
    formatDate,
    subtractDaysFromDate,
    moveItemForward,
    sortObjectByDate,
    dateDifference,
    adjustDates,
    isDate,
    calculateWeekdayDifference,
    isHoliday,
    calculateDisabledDates,
    getHighestDate,
    findAllowedDate,
    findAllowedLautakuntaDate,
    compareAndUpdateDates
}