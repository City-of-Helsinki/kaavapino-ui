import timeUtil from "./timeUtil";
//Phase main start and end value order should always be the same
const order = [
  'projektin_kaynnistys_pvm',
  'kaynnistys_paattyy_pvm',
  'periaatteetvaihe_alkaa_pvm',
  'periaatteetvaihe_paattyy_pvm',
  'oasvaihe_alkaa_pvm',
  'oasvaihe_paattyy_pvm',
  'luonnosvaihe_alkaa_pvm',
  'luonnosvaihe_paattyy_pvm',
  'ehdotusvaihe_alkaa_pvm',
  'ehdotusvaihe_paattyy_pvm',
  'tarkistettuehdotusvaihe_alkaa_pvm',
  'tarkistettuehdotusvaihe_paattyy_pvm',
  'hyvaksyminenvaihe_alkaa_pvm',
  'hyvaksyminenvaihe_paattyy_pvm',
  'voimaantulovaihe_alkaa_pvm',
  'voimaantulovaihe_paattyy_pvm'
];

const getHighestNumberedObject = (obj1, arr) => {
  // Helper function to extract the number from a content string
  const extractNumber = str => {
    // Find the last digit in the string
    let i = str.length - 1;
    while (i >= 0 && !/\d/.test(str[i])) {
      i--;
    }
    // Extract the number
    let numStr = '';
    while (i >= 0 && /\d/.test(str[i])) {
      numStr = str[i] + numStr;
      i--;
    }
    return numStr ? parseInt(numStr, 10) : -Infinity; // Return -Infinity if no number is found
  };

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
};

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
              arr1[i].distance_from_previous = attribute?.distance_from_previous || null;
              arr1[i].distance_to_next = attribute?.distance_to_next || null;
              arr1[i].initial_distance = attribute?.initial_distance?.distance || null
              arr1[i].date_type = attribute?.date_type ?? "arkipäivät";
              arr1[i].order = i;
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
      const indexA = keyOrder.indexOf(a.key);
      const indexB = keyOrder.indexOf(b.key);
    
      // If both keys exist in keyOrder, sort based on their index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
    
      // If only one key exists in keyOrder, prioritize that one
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    
      // If neither key exists in keyOrder, maintain their original order
      return 0;
    });

    //Sort phase start end data by order const
    arr1 = sortPhaseData(arr1,order)
    //Return in order array ready for comparing next and previous value distances
    arr1 = arr1.filter(item => !item.key.includes("viimeistaan_lausunnot_")); //filter out has no next and prev values and is same as päättyy key
    return arr1
  }
  //Sort by certain predetermined order
  const sortPhaseData = (arr,order) => {
    arr.sort((a, b) => {
      // check for the 'order' property
      const aHasOrder = Object.prototype.hasOwnProperty.call(a, 'order');
      const bHasOrder = Object.prototype.hasOwnProperty.call(b, 'order');
      
      // If both items have 'order', keep their relative positions
      if (aHasOrder && bHasOrder) {
          return 0; // Maintain original order for these items
      }
      // If only one of them has 'order', prioritize that one to stay in place
      if (aHasOrder) return -1;
      if (bHasOrder) return 1;
  
      // Otherwise, sort based on the provided order array
      return order.indexOf(a.key) - order.indexOf(b.key);
    });
  
    arr = increasePhaseValues(arr)
    return arr
  }

  const increasePhaseValues = (arr) => {
    const filteredArr = arr.filter(item => order.includes(item.key));
    // Ensure each subsequent value is equal to or greater than the previous one
    for (let i = 1; i < filteredArr.length; i++) {
      if (filteredArr[i - 1].key.includes("paattyy_pvm") && filteredArr[i].key.includes("alkaa_pvm") || filteredArr[i].key.includes("kaynnistys_pvm")) {
        // Convert values to Date objects for comparison
        const previousValue = new Date(filteredArr[i - 1].value);
        const currentValue = new Date(filteredArr[i].value);

        // Adjust the current value if it's less than the previous value
        if (currentValue < previousValue) {
          filteredArr[i].value = filteredArr[i - 1].value;
        }
      }
    }
    // Replace the original elements in arr with updated elements from filteredArr
    const result = arr.map(item => {
      const updatedItem = filteredArr.find(filteredItem => filteredItem.key === item.key);
      return updatedItem ? updatedItem : item;
    });
    return result
  }

  const checkForDecreasingValues = (arr,isAdd,field,disabledDates,oldDate,movedDate,moveToPast,projectSize) => {
    // Find the index of the next item where dates should start being pushed
    const currentIndex = arr.findIndex(item => item.key === field);
    const nextIndex = arr.findIndex(item => item?.key === field) + 1;
    let indexToContinue
    // If adding items
    if (isAdd) {
      // Move the nextItem and all following items forward if item minium is exceeded
      for (let i = nextIndex; i < arr.length; i++) {
        if(!arr[i].key.includes("voimaantulo_pvm") && !arr[i].key.includes("rauennut") && !arr[i].key.includes("kumottu_pvm") && !arr[i].key.includes("tullut_osittain_voimaan_pvm")
          && !arr[i].key.includes("valtuusto_poytakirja_nahtavilla_pvm") && !arr[i].key.includes("hyvaksymispaatos_valitusaika_paattyy") && !arr[i].key.includes("valtuusto_hyvaksymiskuulutus_pvm")
          && !arr[i].key.includes("hyvaksymispaatos_pvm")){
          let newDate = new Date(arr[i].value);
          //At the moment some previous values are falsely null for some reason, can be remove when is fixed on backend and Excel.
          //Get minium gap for two dates next to each other that are moved
          const miniumGap = arr[i].initial_distance === null ? arr[i].key.includes("lautakunnassa") ? 22 : 5 : arr[i].initial_distance 
          if(arr[i - 1].key.includes("paattyy") && arr[i].key.includes("mielipiteet") || arr[i - 1].key.includes("paattyy") && arr[i].key.includes("lausunnot")){
            //mielipiteet and paattyy is always the same value
            newDate = new Date(arr[i - 1].value);
          }
          else{
            //Calculate difference between two dates and rule out holidays and set on date type specific allowed dates and keep minium gaps
            newDate = arr[i]?.date_type ? timeUtil.dateDifference(arr[i].key,arr[i - 1].value,arr[i].value,disabledDates?.date_types[arr[i]?.date_type]?.dates,disabledDates?.date_types?.disabled_dates?.dates,miniumGap,projectSize,true) : newDate
          }
          // Update the array with the new date
          newDate.setDate(newDate.getDate());
          arr[i].value = newDate.toISOString().split('T')[0];
          //Move phase start and end dates
          if(arr[i].distance_from_previous === undefined && arr[i].key.endsWith('_pvm') && arr[i].key.includes("_paattyy_")){
            const targetSubstring = arr[i].key.split('vaihe')[0];
            // Iterate backwards from the given index
            const res = reverseIterateArray(arr,i,targetSubstring)
            const differenceInTime = new Date(res) - new Date(arr[i].value)
            const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);
            if(differenceInDays >= 5){
              arr[i].value = res
            }
          }
        }
      }
    }
    else{
      for (let i = currentIndex; i < arr.length; i++) {
        if(!arr[i].key.includes("voimaantulo_pvm") && !arr[i].key.includes("rauennut") && !arr[i].key.includes("kumottu_pvm") && !arr[i].key.includes("tullut_osittain_voimaan_pvm")
          && !arr[i].key.includes("valtuusto_poytakirja_nahtavilla_pvm") && !arr[i].key.includes("hyvaksymispaatos_valitusaika_paattyy") && !arr[i].key.includes("valtuusto_hyvaksymiskuulutus_pvm")
          && !arr[i].key.includes("hyvaksymispaatos_pvm") && !arr[i].key.includes("lautakunassa_")){
          let newDate = new Date(arr[i].value);

          if(arr[i - 1].key.includes("paattyy") && arr[i].key.includes("mielipiteet") || arr[i - 1].key.includes("paattyy") && arr[i].key.includes("lausunnot")){
            //mielipiteet and paattyy is always the same value
            newDate = new Date(arr[i - 1].value);
          }
          else{
            //Paattyy and nahtavillaolo l-xl are independent of other values
            if(((projectSize === "XS" || projectSize === "S" || projectSize === "M") && i === currentIndex && !arr[i]?.key.includes("lautakunassa_")) ||
             ((projectSize === "XL" || projectSize === "L") && i === currentIndex  && !arr[currentIndex]?.key.includes("nahtavilla_alkaa") && !arr[currentIndex]?.key.includes("nahtavilla_paattyy") && !arr[i]?.key.includes("lautakunassa_")) ){
              //Make next or previous or previous and 1 after previous dates follow the moved date if needed
              if(arr[currentIndex]?.key?.includes("kylk_maaraaika") || arr[currentIndex]?.key?.includes("kylk_aineiston_maaraaika") || arr[currentIndex]?.key?.includes("_lautakunta_aineiston_maaraaika")){
                //maaraika in lautakunta moving
                const lautakuntaResult = timeUtil.findAllowedLautakuntaDate(movedDate, arr[i + 1].initial_distance, disabledDates?.date_types[arr[i + 1]?.date_type]?.dates, false, disabledDates?.date_types[arr[i]?.date_type]?.dates);
                arr[i + 1].value = new Date(lautakuntaResult).toISOString().split('T')[0];
                indexToContinue = i + 1
              }
              else if(arr[currentIndex]?.key?.includes("paattyy")){
                newDate = new Date(arr[i].value);
                indexToContinue = i
              }
              else if(arr[currentIndex]?.key?.includes("lautakunnassa") && !arr[currentIndex]?.key?.includes("lautakunnassa_") || arr[currentIndex]?.key?.includes("alkaa")){
                //lautakunta and alkaa values
                const maaraaikaResult = timeUtil.findAllowedDate(movedDate, arr[i].initial_distance, disabledDates?.date_types[arr[i -1]?.date_type]?.dates, true);
                arr[i - 1].value = new Date(maaraaikaResult).toISOString().split('T')[0];
                indexToContinue = i
              }
              else if(arr[currentIndex]?.key?.includes("maaraaika")){
                //Maaraiaka moving
                const alkaaResult = timeUtil.findAllowedDate(movedDate, arr[i + 1].initial_distance, disabledDates?.date_types[arr[i +1]?.date_type]?.dates, false);
                arr[i + 1].value = new Date(alkaaResult).toISOString().split('T')[0];
                indexToContinue = i + 1
                if(!arr[currentIndex]?.key?.includes("kylk_maaraaika") && !arr[currentIndex]?.key?.includes("kylk_aineiston_maaraaika") && !arr[currentIndex]?.key?.includes("_lautakunta_aineiston_maaraaika") && !arr[currentIndex]?.key?.includes("lautakunnassa") && arr[currentIndex]?.key?.includes("maaraaika")){
                  const paattyyResult = timeUtil.findAllowedDate(alkaaResult, arr[i + 2].initial_distance, disabledDates?.date_types[arr[i +2]?.date_type]?.dates, false);
                  //When moving maaraaika in esillaolo or nahtavillaolo not in lautakunta
                  arr[i + 2].value = new Date(paattyyResult).toISOString().split('T')[0];
                  indexToContinue = i + 2
                }
              }
            }
            else{
              if(!moveToPast && i > indexToContinue){
                //Calculate difference between two dates and rule out holidays and set on date type specific allowed dates and keep minium gaps
                if(arr[i]?.key?.includes("lautakunnassa")){
                  newDate = arr[i]?.date_type ? timeUtil.dateDifference(arr[i].key,arr[i - 1].value,arr[i].value,disabledDates?.date_types[arr[i]?.date_type]?.dates,disabledDates?.date_types?.disabled_dates?.dates,arr[i].initial_distance,projectSize,false) : newDate
                  newDate = new Date(newDate)
                }
                else{
                  newDate = arr[i]?.date_type ? timeUtil.findAllowedDate(arr[i - 1].value, arr[i].distance_from_previous, disabledDates?.date_types[arr[i]?.date_type]?.dates, false)  : newDate;
                  newDate = new Date(newDate)
                }
              }
            }
          }
          // Update the array with the new date
          newDate.setDate(newDate.getDate());
          arr[i].value = newDate.toISOString().split('T')[0];
          //Move phase start and end dates
          if(arr[i].distance_from_previous === undefined && arr[i].key.endsWith('_pvm') && arr[i].key.includes("_paattyy_") 
            && !arr[i].key.includes("voimaantulo_pvm") && !arr[i].key.includes("rauennut") && !arr[i].key.includes("kumottu_pvm") && !arr[i].key.includes("tullut_osittain_voimaan_pvm")){
            const targetSubstring = arr[i].key.split('vaihe')[0];
            // Iterate backwards from the given index
            const res = reverseIterateArray(arr,i,targetSubstring)
            const differenceInTime = new Date(res) - new Date(arr[i].value)
            const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);
            if(differenceInDays >= 5){
              arr[i].value = res
            }
          }
        }
      }
    }
    sortPhaseData(arr,order)
    return arr
  }

   const reverseIterateArray = (arr,index,target) => {
    let targetString = target
    if(target === "tarkistettuehdotus"){
      //other values in array at tarkistettu ehdotus phase are with _ but phase values are without
      targetString = "tarkistettu_ehdotus"
    }
    else if(target === "ehdotus"){
      targetString = ["ehdotuksen", "kaavaehdotus", "ehdotus"]
    }
    for (let i = index - 1; arr.length >= 0 && i >= 0; i--) {
      // Check if 'distance_from_previous' attribute does not exist and if the key contains the target substring
      if(target === "ehdotus"){
        for (let j = 0; j < targetString.length; j++) {
          if (!arr[i].key.includes('tarkistettu_ehdotus') && !arr[i].key.endsWith('_pvm') && arr[i].key.includes(targetString[j])) {
            return arr[i].value;
          }
        }
      }
      else if (arr[i].key.includes(targetString) && !arr[i].key.endsWith('_pvm')) {
        return arr[i].value;
      }
    }
    return null; // Return null if no such key is found
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
  // Function to find the item for example where item.name === inputName
  const findMatchingName = (array, inputName, key) => {
    return array.find(item => item[key] === inputName);
  };
  // Function to find the item before the one for example where item.name === inputName
  const findItem = (array, inputName, key, direction) => {
    //if direction is 1 then find next item or -1 for previous
    const index = array.findIndex(item => item[key] === inputName);
    // If index is valid and direction is either 1 (next) or -1 (previous)
    if (index !== -1) {
      const newIndex = index + direction;
      // Ensure the new index is within bounds of the array
      if (newIndex >= 0 && newIndex < array.length) {
        return array[newIndex]; // Return the next or previous item based on direction
      }
    }

    return null; // Return null if no next or previous item is found
  };

  const filterHiddenKeys = (updatedAttributeData) => {
    //Remove all keys that are still hidden in vistimeline so they are not moved in data and later saved
    const phaseNames = [
      "periaatteet","oas","luonnos","ehdotus","ehdotuksesta","ehdotuksen","tarkistettu_ehdotus"
    ];
    const lautakunnat = ["periaatteet_lautakuntaan_2","periaatteet_lautakuntaan_3","periaatteet_lautakuntaan_4",
      "kaavaluonnos_lautakuntaan_2","kaavaluonnos_lautakuntaan_3","kaavaluonnos_lautakuntaan_4",
      "ehdotus_lautakuntaan_2","ehdotus_lautakuntaan_3","ehdotus_lautakuntaan_4",
      "tarkistettu_ehdotus_lautakuntaan_2","tarkistettu_ehdotus_lautakuntaan_3","tarkistettu_ehdotus_lautakuntaan_4"
    ];
    const esillaolot = ["jarjestetaan_periaatteet_esillaolo_2","jarjestetaan_periaatteet_esillaolo_3",
      "jarjestetaan_oas_esillaolo_2","jarjestetaan_oas_esillaolo_3","jarjestetaan_luonnos_esillaolo_2","jarjestetaan_luonnos_esillaolo_3",
      "kaavaehdotus_uudelleen_nahtaville_2","kaavaehdotus_uudelleen_nahtaville_3","kaavaehdotus_uudelleen_nahtaville_4"
    ];
    //find index keys that exist in data
    const presentLautakunnat = lautakunnat.filter(key => key in updatedAttributeData);
    const presentEsillaolot = esillaolot.filter(key => key in updatedAttributeData);

    //find index and phase from presentLautakunnat and presentEsillaolot
    const lautakunnatPhases = presentLautakunnat.map(key => {
      const phase = phaseNames.find(phaseName => key.includes(phaseName));
      const number = key.match(/\d+/)[0];
      return { phase, number };
    });

    const esillaolotPhases = presentEsillaolot.map(key => {
      const phase = phaseNames.find(phaseName => key.includes(phaseName));
      const number = key.match(/\d+/)[0];
      return { phase, number };
    });

    //filter all but index keys from data
    return Object.entries(updatedAttributeData).reduce((acc, [key, value]) => {
      const indexMatch = key.match(/\d+/);
      const index = indexMatch ? parseInt(indexMatch[0], 10) : null;
      const isLautakunnatPhase = lautakunnatPhases.some(phase => key.includes(phase.phase) && key.includes(phase.number));
      const isEsillaolotPhase = esillaolotPhases.some(phase => key.includes(phase.phase) && key.includes(phase.number));
      if (index === null || index === 1 || (index <= 2 && (isLautakunnatPhase || isEsillaolotPhase))) {
    acc[key] = value;
      }
      return acc;
    }, {});
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
    compareObjectValues,
    findMatchingName,
    findItem,
    filterHiddenKeys
}