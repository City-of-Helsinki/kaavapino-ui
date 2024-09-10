const isWeekend = (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

  // Helper function to format a Date object to "YYYY-MM-DD"
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Function to add days to a date and return in "YYYY-MM-DD" format
  const addDays = (type, date, days, disabledDates,excludeWeekends) => {
    let newDate = new Date(date);
    let filter = ""
    //if date is supposed to be in filter or not be in filter
    //Some disabledDates have allowed array values and some not allowed array values
    let isInFilter = true

    if(type === "esilläolo"){
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
 
export default {
    isWeekend,
    addDays,
    subtractDays,
    formatDate,
    subtractDaysFromDate
}