const replaceScandics = (str) =>  {
    const scandicMap = {
        'å': 'a',
        'ä': 'a',
        'ö': 'o',
        'ø': 'o',
        'Å': 'A',
        'Ä': 'A',
        'Ö': 'O',
        'Ø': 'O',
        'æ': 'ae',
        'Æ': 'AE',
        'ð': 'd',
        'Ð': 'D',
        'þ': 'th',
        'Þ': 'Th'
    };

    return str.replace(/[åäöøÅÄÖØæÆðÐþÞ]/g, function(match) {
        return scandicMap[match] || match;
    });
}

const capitalizeAndRemoveUnderscores = (str) => {
    // Replace all underscores with spaces
    let formattedStr = str.replace(/_/g, ' ');
    // Trim leading and trailing spaces just in case
    formattedStr = formattedStr.trim();
    // Capitalize the first character and concatenate with the rest of the string
    formattedStr = formattedStr.charAt(0).toUpperCase() + formattedStr.slice(1);

    return formattedStr;
}
//Replaces string patterns with another
const replacePattern = (key,patternToReplace,replaceablePattern) => {
    let newKey = key.replace(patternToReplace, replaceablePattern);
    if (newKey.includes("milloin_ehdotuksen_nahtavilla_paattyy_iso")) {
        // Remove '_iso' part
        newKey = newKey.replace("_iso", "");
    }
    if(newKey.includes("milloin_ehdotuksen_nahtavilla_paattyy_pieni")){
        // Remove '_pieni' part
        newKey = newKey.replace("_pieni", "");
    }
    return newKey;
}

// Return the first matching substring
const getFirstMatchingSubstring = (str, substrings) => {
    const lowerCaseStr = str.toLowerCase();
    return substrings.find(substring => lowerCaseStr.includes(substring.toLowerCase())) || null;
};

const modifyLastNumberInString = (str) => {
    // Regular expression to check if the string ends with an underscore followed by a number
    const regex = /_(\d+)$/;

    // Check if the string matches the pattern
    const match = str.match(regex);

    if (match) {
        // If there's a match, increment the number and return the modified string
        let number = parseInt(match[1], 10); // Extract and convert the number part
        return str.replace(regex, `_${number + 1}`); // Replace the number with the incremented one
    } else {
        // If no match, append "_2" to the string
        return `${str}_2`;
    }
}

const getNumberAfterSuffix = (str) => {
    const regex = /_(\d+)$/;  // Regex to match underscore followed by a number at the end of the string
    const match = str.match(regex);
    if (match) {
        const number = match[1];  // Extracted number
        return number
    }
    //if nothing found return null
    return null;
}

export default {
    replaceScandics,
    capitalizeAndRemoveUnderscores,
    replacePattern,
    getFirstMatchingSubstring,
    modifyLastNumberInString,
    getNumberAfterSuffix
}