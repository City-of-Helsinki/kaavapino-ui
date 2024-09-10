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

export default {
    replaceScandics,
    capitalizeAndRemoveUnderscores,
    replacePattern
}