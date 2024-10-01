  const isWeekend = (date) => {
      const day = new Date(date).getDay();
      return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

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
    let daysDifference = 0;

    // Loop from start date to end date
    while (currentDate <= end) {
        // Extra safety check to prevent an infinite loop
        if (currentDate > end) {
          break;
        }
        // Check if it's a weekday (Monday to Friday)
        if (!isWeekend(currentDate)) {
            daysDifference++;
        }
        
        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return daysDifference;
  }

  // Function to calculate the difference in days between two dates
  const dateDifference = (startDate, endDate) => {
    // Get the difference in milliseconds
    const start = new Date(startDate);
    const end = new Date(endDate);
    const differenceInTime = end.getTime() - start.getTime();

    // Convert milliseconds to days (1 day = 24 * 60 * 60 * 1000 ms)
    let differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);

    return differenceInDays;
  }

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
      if (["esilläolo", "arkipäivät", "lautakunta", "lautakunta_määräaika"].includes(type)) {
        filter = disabledDates;
        isInFilter = false;
      }
    };

    const calculateActualDifference = (originalDate, tempDate, workdays) => {
      let actualDifference = 0;
      while (originalDate <= tempDate) {
          // Extra safety check to break the loop
        if (originalDate > tempDate) {
          break;
        }
        if (excludeWeekends && (originalDate.getDay() === 0 || originalDate.getDay() === 6)) {
          originalDate.setDate(originalDate.getDate() + 1);
        } else if (!checkArrayForValue(workdays, originalDate)) {
          originalDate.setDate(originalDate.getDate() + 1);
        } else {
          originalDate.setDate(originalDate.getDate() + 1);
          actualDifference++;
        }
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

    const findNextValidDate = (newDate, finalDateStr, filter, isInFilter) => {
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
        finalDateStr = findNextValidDate(newDate, finalDateStr, filter, isInFilter);
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
      if (["esilläolo", "arkipäivät", "lautakunta", "lautakunta_määräaika"].includes(type)) {
        filter = disabledDates;
        isInFilter = false;
      }
    };

    const calculateActualDifference = (originalDate, tempDate, workdays) => {
      let actualDifference = 0;
      while (tempDate >= originalDate) {
        // Extra safety check to prevent an infinite loop
        if (tempDate < originalDate) {
          break;
        }

        if (excludeWeekends && (tempDate.getDay() === 0 || tempDate.getDay() === 6)) {
          tempDate.setDate(tempDate.getDate() - 1);
        } else if (!checkArrayForValue(workdays, tempDate)) {
          tempDate.setDate(tempDate.getDate() - 1);
        } else {
          tempDate.setDate(tempDate.getDate() - 1);
          actualDifference++;
        }
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

    const findNextValidDate = (newDate, finalDateStr, filter, isInFilter) => {
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
        finalDateStr = findNextValidDate(newDate, finalDateStr, filter, isInFilter);
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
    isHoliday
}