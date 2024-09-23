import timeUtil from "./timeUtil";

const getHighestNumberedObject = (obj1,arr) => {
    // Helper function to extract the number from a content string
    const extractNumber = str => parseInt(str.match(/\d+$/), 10);
    // If no objects exist in the array, return null
    if (arr.length === 0) return null;

    // If 'asd_x' objects exist, find the one with the highest number
    if (obj1.length > 0) {
        return obj1.reduce((maxObj, currentObj) => 
            extractNumber(currentObj.content) > extractNumber(maxObj.content) ? currentObj : maxObj
        );
    }
    
    // Return null if no valid objects are found
    return null;
  }
  const getMinObject = (latestObject) => {
    // Iterate over the keys of the object
    for (let key in latestObject) {
        // Check if the value is an array
        if (Array.isArray(latestObject[key]) && latestObject[key].length > 0) {
            // Access the first object in the array
            let firstObject = latestObject[key][0];
            return firstObject.name
        }
    }
    return null;
  }

  // Function to extract the number after the last underscore and return the object with the larger number
  const getNumberFromString = (arr) => {
    let largestObject = null;
    let largestNumber = -Infinity;

    arr.forEach(obj => {
      const match = obj.attributegroup.match(/_(\d+)$/); // Match digits after the last underscore
      if (match) {
        const number = parseInt(match[1], 10); // Get the number
        if (number > largestNumber) { // Compare with the current largest number
          largestNumber = number;
          largestObject = obj;
        }
      }
    });

    return largestObject; // Return the object with the largest number
  }

  const findValuesWithStrings = (arr, str1, str2, str3, str4) => {
    let arrOfObj = arr.filter(obj => obj.name.includes(str1) && obj.name.includes(str2) && obj.name.includes(str3) && obj.name.includes(str4));
    // Get the object with the largest number from the array
    const largest = getNumberFromString(arrOfObj);
    return largest
  };

  const findLargestSuffix = (object,suffix) => {
    // Ensure input is a valid object
    if (typeof object !== 'object' || object === null || Object.keys(object).length === 0) {
      return false;
    }

    let maxNumber = -1;  // Track the largest number
    let resultKey = null;  // Store the key with the largest suffix

    // Fetch all keys in the object
    const keys = Object.keys(object);

    // Iterate over all the keys
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // Only match keys starting with "milloin_oas_esillaolo_paattyy" and "milloin_oas_esillaolo_paattyy_2" for example
      const match = key.match(suffix);

      if (match) {
        // If there's a number, parse it, otherwise assume 0
        const number = match[1] ? parseInt(match[1], 10) : 0;

        // If the extracted number is larger, update maxNumber and resultKey
        if (number > maxNumber) {
          maxNumber = number;
          resultKey = key;
        }
      }
    }
    // If nothing found at all, return false
    return resultKey !== null ? object[resultKey] : false;
  }

  const getPreviousObjectByName = (arr, id) => {
    // Find the index of the object where object.name === name
    const index = arr.findIndex(obj => obj.id === id);
  
    // If the index is greater than 0, return the object at one index earlier
    if (index > 0) {
      return arr[index - 1];
    }
  
    // Return null or undefined if it's the first index or not found
    return null;
  }

  const getObjectByName = (arr, id) => {
    // Find the index of the object where object.name === name
    const index = arr.findIndex(obj => obj.id === id);
  
    // return the object
    if (index) {
      return arr[index];
    }
  
    // Return null or undefined if it's the first index or not found
    return null;
  }
  //Make these one and the same and add parameter for what type find is
  const getPreviousObjectByGroup = (arr, deadlinegroup) => {
    // Find the index of the object where object.name === name
    const index = arr.findIndex(obj => obj.deadlinegroup === deadlinegroup);
  
    // If the index is greater than 0, return the object at one index earlier
    if (index > 0) {
      return arr[index - 1];
    }
  
    // Return null or undefined if it's the first index or not found
    return null;
  }

  const generateDateStringArray = (updatedAttributeData) => {
    const updateAttributeArray = [];

    // Process only the keys with date strings
    Object.keys(updatedAttributeData)
      .filter(key => timeUtil.isDate(updatedAttributeData[key])) // Filter only date keys
      .map(key => ({ key, date: new Date(updatedAttributeData[key]), value: updatedAttributeData[key] })) // Map keys to real Date objects and values
      .forEach(item => {
        updateAttributeArray.push({ key: item.key, value: item.value }); // Push each sorted key-value pair into the array
    });

    return updateAttributeArray
  }

  const compareAndUpdateArrays = (arr1, arr2, deadlineSections) => {
    let changes = [];
    // Convert arr2 to a map for easier lookups
    const map2 = new Map(arr2.map(item => [item.key, item.value]));
  
    // Iterate through arr1 and update values if a matching key is found in arr2
    for (let i = 0; i < arr1.length; i++) {
      const key = arr1[i].key;
      const value1 = arr1[i].value;
  
      if (map2.has(key)) {
        const value2 = map2.get(key);
  
        // If values differ, update the value in arr1 and record the change
        if (value1 !== value2) {
          changes.push({
            key: key,
            oldValue: value1,
            newValue: value2
          });
          arr1[i].value = value2; // Update the value in arr1
        }
      }
    }
  
    // Check for keys in arr2 that are missing in arr1
    for (let [key, value2] of map2) {
      if (!arr1.find(item => item.key === key)) {
        changes.push({
          key: key,
          oldValue: 'Not found in first array',
          newValue: value2
        });
        // Optionally, add the missing key-value pair to arr1
        arr1.push({ key: key, value: value2 });
      }
    }
    // Adding distance_from_previous and distance_to_next to arr1 from deadlineSections
    for (let i = 0; i < arr1.length; i++) {
      const arr1Key = arr1[i].key;

      // Iterate over each section in deadlineSections
      for (let section of deadlineSections) {
        // Iterate over each attribute in section's attributes array
        for (let sec of section.sections) {
          for (let attribute of sec.attributes) {
            if (attribute.name === arr1Key) {
              // Found a match, now add distance_from_previous and distance_to_next
              arr1[i].distance_from_previous = attribute.distance_from_previous || null;
              arr1[i].distance_to_next = attribute.distance_to_next || null;
              arr1[i].order = i
              break; // Exit the loop once the match is found
            }
          }
        }
      }
    }

    // Extract the order of keys (names) from deadlineSections
    //DeadlineSections has the correct order always
    let keyOrder = [];
    for (let section of deadlineSections) {
      for (let sec of section.sections) {
        for (let attribute of sec.attributes) {
          keyOrder.push(attribute.name);  // Get the order of names
        }
      }
    }

    // Sort arr1 based on the keyOrder extracted from deadlineSections
    arr1.sort((a, b) => {
      return keyOrder.indexOf(a.key) - keyOrder.indexOf(b.key);
    });
    //Return in order array ready for comparing next and previous value distances
    return arr1
  }

  const checkForDecreasingValues = (arr,isAdd,field) => {
    //TODO: add same logic when moving phase backwards
    // Find the index of the next item where dates should start being pushed
    const nextIndex = arr.findIndex(item => item?.key === field) + 1
    // If adding items
    if (isAdd) {
      // Move the nextItem and all following items forward if item minium is exceeded
      for (let i = nextIndex; i < arr.length; i++) {
        let newDate = new Date(arr[i].value);
        let dateDiff = timeUtil.dateDifference(arr[i - 1].value, arr[i].value)
        //At the moment some previous values are falsely null for some reason, can be remove when is fixed on backend and Excel.
        const miniumGap = arr[i].distance_from_previous === null ? arr[i].key.includes("lautakunnassa") ? 27 : 5 : arr[i].distance_from_previous 
        //If difference in previous and current value is below minium
        if(dateDiff < miniumGap){
          if(arr[i - 1].key.includes("paattyy") && arr[i].key.includes("mielipiteet") || arr[i - 1].key.includes("paattyy") && arr[i].key.includes("lausunnot")){
            //mielipiteet and paattyy is always the same value
            dateDiff = 0
            newDate = new Date(arr[i - 1].value);
          }
          else{
            //Check if value is negative. Added value went further in timeline then next value. Convert to positive + minium
            if(dateDiff < 0){
              dateDiff = Math.abs(dateDiff)
              dateDiff = dateDiff + miniumGap
            }
            else{
              if(arr[i - 1].key.includes("paattyy") && arr[i].key.includes("mielipiteet") || arr[i - 1].key.includes("paattyy") && arr[i].key.includes("lausunnot")){
                dateDiff = 0
              }
              else{
                //Positive so reduce from gap 
                dateDiff = miniumGap - dateDiff
              }
            }
          }
          //Add difference to date and move it forward in timeline
          newDate.setDate(newDate.getDate() + dateDiff);
        }
        // Update the array with the new date
        arr[i].value = newDate.toISOString().split('T')[0];
      }
    }
    else{
      for (let i = nextIndex; i < arr.length; i++) {
        let newDate = new Date(arr[i].value);
        let dateDiff = timeUtil.dateDifference(arr[i - 1].value,arr[i].value)
        //At the moment some previous values are falsely null for some reason, can be remove when is fixed on backend and Excel.
        const miniumGap = arr[i].distance_from_previous === null ? arr[i].key.includes("lautakunnassa") ? 27 : 5 : arr[i].distance_from_previous 
        //If difference in previous and current value is below minium
        if(dateDiff < miniumGap){
          if(arr[i - 1].key.includes("paattyy") && arr[i].key.includes("mielipiteet") || arr[i - 1].key.includes("paattyy") && arr[i].key.includes("lausunnot")){
            //mielipiteet and paattyy is always the same value
            dateDiff = 0
            newDate = new Date(arr[i - 1].value);
          }
          else{
            //Check if value is negative. Added value went further in timeline then next value. Convert to positive + minium
            if(dateDiff < 0){
              dateDiff = Math.abs(dateDiff)
              dateDiff = dateDiff + miniumGap
            }
            else{
              if(arr[i - 1].key.includes("paattyy") && arr[i].key.includes("mielipiteet") || arr[i - 1].key.includes("paattyy") && arr[i].key.includes("lausunnot")){
                dateDiff = 0
              }
              else{
                //Positive so reduce from gap 
                dateDiff = miniumGap - dateDiff
              }
            }
          }
          //Add difference to date and move it forward in timeline
          newDate.setDate(newDate.getDate() + dateDiff);
        }
        // Update the array with the new date
        arr[i].value = newDate.toISOString().split('T')[0];
      }
    }
    return arr
  }

    // Function to update original object by comparing keys
  const updateOriginalObject = (originalObj, updatedArr) => {
    updatedArr.forEach(item => {
      if (Object.prototype.hasOwnProperty.call(originalObj, item.key)) {
        originalObj[item.key] = item.value; // Update value if key exists
      }
    });
    return originalObj;
  }

  // Helper function to compare values
  const compareObjectValues = (key, value1, value2) => {
      if (typeof value1 === 'object' && typeof value2 === 'object') {
        return findDifferencesInObjects(value1, value2).map(diff => ({
          key: `${key}.${diff.key}`, // Nesting the key to show hierarchy
          obj1: diff.obj1,
          obj2: diff.obj2
      })); // Recursively compare if both are objects
      } else if (value1 !== value2) {
        return [{ key, obj1: value1, obj2: value2 }]; // Return an array of differences
      }
      return []; // No difference
    }
  // compare 2 objects and get differences and return them in array
  const findDifferencesInObjects = (obj1, obj2) => {
    let differences = [];

    // Compare properties of obj1 and obj2
    for (let key in obj1) {
        if (Object.hasOwn(obj1, key)) {
          const diff = compareObjectValues(key, obj1[key], obj2[key]);
          differences = [...differences, ...diff];
        }
    }
    // Check for properties that are in obj2 but not in obj1
    for (let key in obj2) {
        if (Object.hasOwn(obj2, key) && !(key in obj1)) {
            differences.push({ key, obj1: undefined, obj2: obj2[key] });
        }
    }

    return differences;
}

export default {
    getHighestNumberedObject,
    getMinObject,
    findValuesWithStrings,
    findLargestSuffix,
    getPreviousObjectByName,
    getObjectByName,
    getPreviousObjectByGroup,
    compareAndUpdateArrays,
    checkForDecreasingValues,
    generateDateStringArray,
    updateOriginalObject,
    findDifferencesInObjects,
    compareObjectValues
}