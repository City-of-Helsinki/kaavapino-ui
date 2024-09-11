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

export default {
    getHighestNumberedObject,
    getMinObject,
    findValuesWithStrings,
    findLargestSuffix,
    getPreviousObjectByName,
    getObjectByName
}