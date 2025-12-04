import { isDeadlineConfirmed } from "./projectVisibilityUtils";

const userHasModified = (field,deadlines,phase) => {
  for (let i = 0; i < deadlines.length; i++) {
    if(deadlines[i].deadline.phase_name === phase && deadlines[i].deadline?.attribute === field){
      return !!deadlines[i]?.edited
    }
  }
  return false
}

const isConfirmed = (startDateConfirmed) => {
  return startDateConfirmed === true;
}

const getEsillaoloDates = (deadlinegroup, data, deadlines) => {
  const alkaaDeadline = deadlines.find(
    (d) => d.deadline?.deadlinegroup === deadlinegroup && d.deadline?.attribute?.includes("_alkaa"));
  const paattyyDeadline = deadlines.find(
    (d) => d.deadline?.deadlinegroup === deadlinegroup && d.deadline?.attribute?.includes("_paattyy"));
  const alkaaAttribute = alkaaDeadline?.deadline?.attribute;
  const paattyyAttribute = paattyyDeadline?.deadline?.attribute;
  const confirmed = !!isDeadlineConfirmed(data, deadlinegroup);
  const startDate = alkaaAttribute ? data[alkaaAttribute] : "";
  const endDate = paattyyAttribute ? data[paattyyAttribute] : "";
  const startModified = !!alkaaDeadline?.edited;
  const endModified = !!paattyyDeadline?.edited;
  return {startDate, endDate, confirmed, startModified, endModified};
}

const getLautakuntaDates = (deadlinegroup, data, deadlines) => {
  const lautakuntaDeadline = deadlines.find(
    (d) => d.deadline?.deadlinegroup === deadlinegroup && d.deadline?.attribute?.includes("_lautakunnassa"));
  const lautakuntaAttribute = lautakuntaDeadline?.deadline?.attribute;
  const confirmBoard = !!isDeadlineConfirmed(data, deadlinegroup);
  const boardDate = lautakuntaAttribute ? data[lautakuntaAttribute] : "";
  const boardModified = !!lautakuntaDeadline?.edited;
  return { boardDate, confirmBoard, boardModified };
}


const getEsillaoloLautakuntaDates = (esillaGroupName, esillaVisBoolName, lkGroupName, lkVisBoolName, data, deadlines) => {
  // Get data from latest esillaolo and lautakunta
  let esillaObject = {};
  let lkObject = {};
  for (let i = 4, lkDone = false, esillaDone = false; i > 0 && !(lkDone && esillaDone); i--) {
    if ((!esillaDone) && data?.[`${esillaVisBoolName}_${i}`]) {
      esillaObject = getEsillaoloDates(`${esillaGroupName}_${i}`, data, deadlines);
      esillaDone = true;
    }
    if ((!lkDone) && data?.[`${lkVisBoolName}_${i}`]) {
      lkObject = getLautakuntaDates(`${lkGroupName}_${i}`, data, deadlines);
      lkDone = true;
    }
  }
  return {esillaObject, lkObject};
}

const getPrincipleDates = (data,deadlines) => {
  const boardText = "custom-card.principles-board-text";
  const {esillaObject, lkObject} = getEsillaoloLautakuntaDates(
    "periaatteet_esillaolokerta", "jarjestetaan_periaatteet_esillaolo",
    "periaatteet_lautakuntakerta","periaatteet_lautakuntaan",
    data,deadlines
  );
  return {...esillaObject, ...lkObject, boardText};
}

const getOASDates = (data,deadlines) => {
  let esillaOloObject = {};
  if (data?.jarjestetaan_oas_esillaolo_3) {
    esillaOloObject = getEsillaoloDates("oas_esillaolokerta_3", data, deadlines);
  }
  else if (data?.jarjestetaan_oas_esillaolo_2) {
    esillaOloObject = getEsillaoloDates("oas_esillaolokerta_2", data, deadlines);
  }
  else {
    esillaOloObject = getEsillaoloDates("oas_esillaolokerta_1", data, deadlines);
  }
  return {...esillaOloObject, confirmBoard: esillaOloObject.confirmed};
}

const getDraftDates = (data,deadlines) => {
  const boardText = "custom-card.principles-board-text";
  const {esillaObject, lkObject} = getEsillaoloLautakuntaDates(
    "luonnos_esillaolokerta", "jarjestetaan_luonnos_esillaolo",
    "luonnos_lautakuntakerta","kaavaluonnos_lautakuntaan",
    data,deadlines
  );
  return {...esillaObject, ...lkObject, boardText};
}

const getSuggestion = (data,deadlines) => {
  const startText = "custom-card.suggestion-start-text";
  const endText = "custom-card.suggestion-end-text";
  const boardText = "custom-card.suggestion-board-text";

  let {esillaObject, lkObject} = getEsillaoloLautakuntaDates(
    "ehdotus_nahtavillaolokerta", "kaavaehdotus_uudelleen_nahtaville",
    "ehdotus_lautakuntakerta","kaavaehdotus_lautakuntaan",
    data,deadlines
  );
  // ehdotus uses inconsistent key for first esillaolo. If 2nd is not set in above function, check 1st here.
  if (!esillaObject.startDate && data?.kaavaehdotus_nahtaville_1 !== false) {
    esillaObject = getEsillaoloDates("ehdotus_nahtavillaolokerta_1", data, deadlines);
  }
  return {...esillaObject, ...lkObject, startText, endText, boardText};
}

const getReviewSuggestion = (data,deadlines) => {
  const boardText = "custom-card.review-suggestion-board-text"
  let lkDates = {};
  for (let i = 4; i > 0; i--) {
    if (data?.[`tarkistettu_ehdotus_lautakuntaan_${i}`]) {
      lkDates = getLautakuntaDates(`tarkistettu_ehdotus_lautakuntakerta_${i}`, data, deadlines);
      break;
    }
  }
  return { ...lkDates, boardText };
}

const getAcceptanceDate = (data,name) => {
  let date = "Tieto puuttuu"
  if(name === "Merkitse hyväksymispäivä"){
    date = data?.hyvaksymispaatos_pvm ? data?.hyvaksymispaatos_pvm : "Tieto puuttuu" 
  }
  else if(name === "Merkitse muutoksenhakua koskevat päivämäärät"){
    date = data?.hyvaksymispaatos_valitusaika_paattyy ? data?.hyvaksymispaatos_valitusaika_paattyy : "Tieto puuttuu" 
  }
  else if(name === "Merkitse voimaantuloa koskevat päivämäärät"){
    date = data?.voimaantulo_pvm ? data?.voimaantulo_pvm : "Tieto puuttuu"
  }
  const boardText = "custom-card.acceptance-date-text"
  const acceptanceDate = date
  return {acceptanceDate, boardText};
}

const getInfoFieldData = (placeholder,name,data,deadlines,selectedPhase) => {
  const suggestionPhase = [29, 21, 15, 9, 3].includes(selectedPhase)
  const reviewSuggestionPhase = [30, 22, 16, 10, 4].includes(selectedPhase)
  let infoData = {
    livingFloorArea: data?.asuminen_yhteensa || 0,
    officeFloorArea: data?.toimitila_yhteensa || 0,
    generalFloorArea: data?.julkiset_yhteensa || 0,
    otherFloorArea: data?.muut_yhteensa || 0,
    startDate: "",
    endDate: "",
    confirmed: "",
    startModified: false,
    endModified: false,
    boardDate: "",
    boardConfirmed: false,
    boardText: "",
    boardModified: false,
    startText: "",
    endText: "",
    isSuggestionPhase: suggestionPhase
  }
  if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_periaatteet_fieldset"){
    infoData = {...infoData, ...getPrincipleDates(data,deadlines)}
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_luonnos_fieldset" && data?.luonnos_luotu){
    infoData = {...infoData, ...getDraftDates(data,deadlines)}
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_oas_fieldset"){
    infoData = {...infoData, ...getOASDates(data,deadlines)} 
  }
  else if(suggestionPhase && placeholder === "Tarkasta kerrosalatiedot" && name === "tarkasta_kerrosala_fieldset"){
    infoData = {...infoData, ...getSuggestion(data,deadlines)}
  }
  else if(reviewSuggestionPhase && placeholder === "Tarkasta kerrosalatiedot" && name === "tarkasta_kerrosala_fieldset"){
    infoData = {...infoData, ...getReviewSuggestion(data,deadlines)}
  }
  else if(placeholder === "Merkitse hyväksymispäivä" || placeholder === "Merkitse muutoksenhakua koskevat päivämäärät" || placeholder === "Merkitse voimaantuloa koskevat päivämäärät"){
    infoData = {...infoData, ...getAcceptanceDate(data,placeholder)}
  }

  return infoData;
}

const exported = {
  getInfoFieldData,
}

if (process.env.UNIT_TEST === 'true') {
  exported.userHasModified = userHasModified;
  exported.isConfirmed = isConfirmed;
  exported.getPrincipleDates = getPrincipleDates;
  exported.getOASDates = getOASDates;
  exported.getDraftDates = getDraftDates;
  exported.getSuggestion = getSuggestion;
  exported.getReviewSuggestion = getReviewSuggestion;
  exported.getAcceptanceDate = getAcceptanceDate;
}

export default exported