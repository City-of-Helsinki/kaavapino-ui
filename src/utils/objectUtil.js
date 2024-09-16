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

  const compareAndUpdateArrays = (arr1, arr2) => {
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
    //console.log(changes.length > 0 ? changes : "No changes found.")
    return arr1
  }

  const checkForDecreasingValues = (arr,daysDifference) => {
    let decreasingValues = [];
    let addDaysToFollowing = false;
    //TODO: move forward only if over minium distance to next
    //TODO: add same logic when moving phase backwards
    //TODO: Use logic when adding new groups
  
    for (let i = 1; i < arr.length; i++) {
      let prevValue = new Date(arr[i - 1].value);
      let currentValue = new Date(arr[i].value); 
      // If a decreasing value was found previously, apply the daysDifference to this value
      if (addDaysToFollowing ) {
        const newDate = new Date(currentValue);
        newDate.setDate(currentValue.getDate() + daysDifference); // Add the previous difference + 5 days
        arr[i].value = newDate.toISOString().split('T')[0];
        // Add the change
        decreasingValues.push({
          key: arr[i].key,
          oldValue: currentValue.toISOString().split('T')[0],
          newValue: newDate.toISOString().split('T')[0]
        });
      }
  
      // Check if the current value is smaller than the previous value
      if (!addDaysToFollowing) {
        const newDate = new Date(currentValue);
        // Add the change
        decreasingValues.push({
          key: arr[i].key,
          oldValue: arr[i].value,
          newValue: newDate.toISOString().split('T')[0]
        });

        if(arr[i - 1].key.includes("paattyy") && arr[i].key.includes("mielipiteet")){
          //Mielipiteet is same as paattyy
          newDate.setDate(prevValue.getDate())
        } 
        if(timeUtil.dateDifference(arr[i - 1].value,arr[i].value) < 5){
          const difference = timeUtil.dateDifference(arr[i - 1].value,arr[i].value)
          //TODO add min days from data not hardcoded number
          newDate.setDate(currentValue.getDate() + difference + 5); // Add the previous difference + min days
          // Set flag to true to start applying the difference + 5 to all subsequent values
          addDaysToFollowing = true;
        }
        // Update the array with the new date
        arr[i].value = newDate.toISOString().split('T')[0];
        
      }
    }
    //console.log(arr,decreasingValues)
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
    updateOriginalObject
}