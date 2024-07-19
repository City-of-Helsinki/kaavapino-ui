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

export default {
    replaceScandics,
}