const namesToReplace = {
  "ehdotus_kylk_aineiston_maaraaika": "Esilläoloaineiston määräaika",
  "ehdotusvaihe_alkaa_pvm": "Ehdotusvaihe alkaa",
  "ehdotusvaihe_paattyy_pvm": "Ehdotusvaihe päättyy",
  "hyvaksyminenvaihe_alkaa_pvm": "Hyväksymisvaihe alkaa",
  "hyvaksyminenvaihe_paattyy_pvm": "Hyväksymisvaihe päättyy",
  "kaavaluonnos_kylk_aineiston_maaraaika": "Luonnos kylk määräaika",
  "kaynnistys_paattyy_pvm": "Käynnistysvaihe päättyy",
  "luonnosaineiston_maaraaika": "Luonnos määräaika",
  "luonnosvaihe_alkaa_pvm": "Luonnosvaihe alkaa",
  "luonnosvaihe_paattyy_pvm": "Luonnosvaihe päättyy",
  "milloin_ehdotuksen_nahtavilla_alkaa_iso": "Ehdotus nähtävilläolo alkaa",
  "milloin_ehdotuksen_nahtavilla_alkaa_pieni": "Ehdotus nähtävilläolo alkaa",
  "milloin_ehdotuksen_nahtavilla_paattyy": "Ehdotus nähtävilläolo päättyy",
  "milloin_kaavaehdotus_lautakunnassa": "Ehdotus lautakunnassa",
  "milloin_kaavaluonnos_lautakunnassa": "Luonnos lautakunnassa",
  "milloin_luonnos_esillaolo_alkaa": "Luonnos esilläolo alkaa",
  "milloin_luonnos_esillaolo_paattyy": "Luonnos esilläolo päättyy",
  "milloin_oas_esillaolo_alkaa": "OAS esilläolo alkaa",
  "milloin_oas_esillaolo_paattyy": "OAS esilläolo päättyy",
  "milloin_periaatteet_esillaolo_alkaa": "Periaatteet esilläolo alkaa",
  "milloin_periaatteet_esillaolo_paattyy": "Periaatteet esilläolo päättyy",
  "milloin_periaatteet_lautakunnassa": "Periaatteet lautakunnassa",
  "milloin_tarkistettu_ehdotus_lautakunnassa": "Tarkistettu ehdotus lautakunnassa",
  "oas_esillaolo_aineiston_maaraaika": "OAS esilläolo määräaika",
  "oasvaihe_alkaa_pvm": "OAS vaihe alkaa",
  "oasvaihe_paattyy_pvm": "OAS vaihe päättyy",
  "periaatteet_esillaolo_aineiston_maaraaika": "Periaatteet esilläolo määräaika",
  "periaatteet_lautakunta_aineiston_maaraaika": "Periaatteet lautakunta määräaika",
  "periaatteetvaihe_alkaa_pvm": "Periaatteetvaihe alkaa",
  "periaatteetvaihe_paattyy_pvm": "Periaatteetvaihe päättyy",
  "projektin_kaynnistys_pvm": "Käynnistyvaihe alkaa",
  "tarkistettu_ehdotus_kylk_maaraaika": "Tarkistettu ehdotus kylk määräaika",
  "tarkistettuehdotusvaihe_alkaa_pvm": "Tarkistettu ehdotus vaihe alkaa",
  "tarkistettuehdotusvaihe_paattyy_pvm": "Tarkistettu ehdotus vaihe päättyy",
  "viimeistaan_lausunnot_ehdotuksesta": "Viimeistään lausunnot ehdotuksesta",
  "viimeistaan_mielipiteet_luonnos": "Viimeistään mielipiteet luonnoksesta",
  "viimeistaan_mielipiteet_oas": "Viimeistään mielipiteet OAS",
  "viimeistaan_mielipiteet_periaatteista": "Viimeistään mielipiteet periaatteista",
  "voimaantulovaihe_alkaa_pvm": "Voimaantulovaihe alkaa",
  "voimaantulovaihe_paattyy_pvm": "Voimaantulovaihe päättyy"
};
// Function to handle dynamic error messages
const getErrorMessage = (data, format = 'default') => {
  let message = '';

  Object.keys(data).forEach(key => {
    const value = data[key];

    // Check if the value is an array
    if (Array.isArray(value)) {
      // Convert array to a string based on the format
      if (format === 'date') {
        const dateMessage = value.find(msg => msg.includes("Ensimmäinen mahdollinen päivä on"));
        if (dateMessage) {
          // Extract the date
          const date = dateMessage.split(' ').slice(-1)[0];
          message += `${key}: ${date}\n`;
        }
      } else {
        message += `${key}: ${value.join(' ')}\n`;
      }
    } else {
      // If not an array, just append the string or other type of value
      message += `${key}: ${value}\n`;
    }
  });
  // Modify text to be more readable
  message = replaceNamesInMessage(message);
  return message;
};

const replaceNamesInMessage = (message) => {
  for (const [key, value] of Object.entries(namesToReplace)) {
    const regex = new RegExp(key, 'g');
    message = message.replace(regex, value);
  }
  return message;
}

export default {
  getErrorMessage
};
