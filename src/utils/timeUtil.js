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
  const addDays = (type, date, days, disabledDates,excludeWeekends,constantDistance) => {
    let newDate = new Date(date);
    let filter = ""
    //if date is supposed to be in filter or not be in filter
    //Some disabledDates have allowed array values and some not allowed array values
    let isInFilter = true

    if(type === "esilläolo"){
      filter = disabledDates
      isInFilter = false
    }
    else if(type === "arkipäivät"){
      filter = disabledDates
      isInFilter = false
    }
    else if(type === "lautakunta"){
      //TODO add logic to check constant distance between two items somewhere
      console.log(date,constantDistance,days)
      //keep distance between dates the same if possible
      filter = disabledDates
      isInFilter = false
    }
    // Subtract the specified number of days
    while (days > 0) {
      newDate.setDate(newDate.getDate() + 1);
      if(excludeWeekends){
        if(newDate.getDay() != 0 && newDate.getDay() != 6){
          days--;
        }
      }
      else{
        days--;
      }

    }

    // After adding days, check if the final date is in the filter
    let finalDateStr = formatDate(newDate);
    if(isInFilter){
      // If the final date is in the filter, find the next available valid date (that is in the filter)
      while (filter.includes(finalDateStr)) {
        newDate.setDate(newDate.getDate() + 1);
        finalDateStr = formatDate(newDate);
      }
    }
    else{
      // If the final date is NOT in the filter, find the next available valid date (that is in the filter)
      while (!filter.includes(finalDateStr)) {
        newDate.setDate(newDate.getDate() + 1);
        finalDateStr = formatDate(newDate);
      }
    }

    return finalDateStr;
  };
  
  // Function to subtract days from a date and return in "YYYY-MM-DD" format
  const subtractDays = (type, date, days, disabledDates, excludeWeekends) => {
    let newDate = new Date(date);
    let filter = ""
    //if date is supposed to be in filter or not be in filter
    //Some disabledDates have allowed array values and some not allowed array values
    let isInFilter = true
    if(type === "esilläolo"){
      filter = disabledDates
      isInFilter = false
    }
    else if(type === "arkipäivät"){
      filter = disabledDates
      isInFilter = false
    }
    // Subtract the specified number of days
    while (days > 0) {
      newDate.setDate(newDate.getDate() - 1);
      if(excludeWeekends){
        if(newDate.getDay() != 0 && newDate.getDay() != 6){
          days--;
        }
      }
      else{
        days--;
      }
    }

    // After subtracting days, find the next available valid date (not blocked)
    let finalDateStr = formatDate(newDate);
    if(isInFilter){
      // If the final date is NOT in the filter, find the next available valid date (that is in the filter)
      while (filter.includes(finalDateStr)) {
        newDate.setDate(newDate.getDate() - 1);
        finalDateStr = formatDate(newDate);
      }
    }
    else{
      // If the final date is NOT in the filter, find the next available valid date (that is in the filter)
      while (!filter.includes(finalDateStr)) {
        newDate.setDate(newDate.getDate() - 1);
        finalDateStr = formatDate(newDate);
      }
    }

    return finalDateStr;
  };
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
    isDate
}