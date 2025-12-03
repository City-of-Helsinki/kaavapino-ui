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
  return [startDate, endDate, confirmed, startModified, endModified];
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

const getPrincipleDates = (data,deadlines) => {
  let startDate = ""
  let endDate = ""
  let esillaConfirmed = true
  let startModified = false
  let endModified = false
  let lkDates = {
    boardDate: "",
    confirmBoard: false,
    boardModified: false
  }
  const boardText = "custom-card.principles-board-text";

  // Get data from latest esillaolo and lautakunta
  for (let i = 4, lkDone = false, esillaDone = false; i > 0; i--) {
    if ((!lkDone) && data?.[`periaatteet_lautakuntaan_${i}`]) {
      lkDates = getLautakuntaDates(`periaatteet_lautakuntakerta_${i}`, data, deadlines);
      lkDone = true;
    }
    if ((!esillaDone) && data?.[`jarjestetaan_periaatteet_esillaolo_${i}`]) {
      [startDate,endDate,esillaConfirmed,startModified,endModified] = getEsillaoloDates(`periaatteet_esillaolokerta_${i}`, data, deadlines);
      esillaDone = true;
    }
  }
  return [startDate,endDate,esillaConfirmed,startModified,endModified,lkDates.boardDate,lkDates.confirmBoard,boardText,lkDates.boardModified];
}

const getOASDates = (data,deadlines) => {
  let returnValue;
  if (data?.jarjestetaan_oas_esillaolo_3) {
    returnValue = getEsillaoloDates("oas_esillaolokerta_3", data, deadlines);
  }
  else if (data?.jarjestetaan_oas_esillaolo_2) {
    returnValue = getEsillaoloDates("oas_esillaolokerta_2", data, deadlines);
  }
  else {
    returnValue = getEsillaoloDates("oas_esillaolokerta_1", data, deadlines);
  }
  return [...returnValue, returnValue[2]]; // confirmBoard is same as confirmed for OAS
}

const getDraftDates = (data,deadlines) => {
  let startDate = ""
  let endDate = ""
  let esillaConfirmed = true
  let startModified = false
  let endModified = false
  let lkDates = {
    boardDate: "",
    confirmBoard: false,
    boardModified: false
  }
  const boardText = "custom-card.draft-board-text";

  // Get data from latest esillaolo and lautakunta
  for (let i = 4, lkDone = false, esillaDone = false; i > 0; i--) {
    if ((!lkDone) && data?.[`kaavaluonnos_lautakuntaan_${i}`]) {
      lkDates = getLautakuntaDates(`luonnos_lautakuntakerta_${i}`, data, deadlines);
      lkDone = true;
    }
    if ((!esillaDone) && data?.[`jarjestetaan_luonnos_esillaolo_${i}`]) {
      [startDate,endDate,esillaConfirmed,startModified,endModified] = getEsillaoloDates(`luonnos_esillaolokerta_${i}`, data, deadlines);
      esillaDone = true;
    }
  }
  return [startDate,endDate,esillaConfirmed,startModified,endModified,lkDates.boardDate,lkDates.confirmBoard,boardText,lkDates.boardModified]
}

const getSuggestion = (data,deadlines) => {
  let nahtavillaConfirmed = true
  let startDate = ""
  let endDate = ""
  let startModified = false
  let endModified = false
  const starText = "custom-card.suggestion-start-text"
  const endText = "custom-card.suggestion-end-text"
  const boardText = "custom-card.suggestion-board-text"
  let lkDates = {
    boardDate: "",
    confirmBoard: false,
    boardModified: false
  }

  let nahtavillaDone = false;
  for (let i = 4, lkDone = false; i > 0; i--) {
    if ((!lkDone) && data?.[`kaavaehdotus_lautakuntaan_${i}`]) {
      lkDates = getLautakuntaDates(`ehdotus_lautakuntakerta_${i}`, data, deadlines);
      lkDone = true;
    }
    if ((!nahtavillaDone) && data?.[`kaavaehdotus_uudelleen_nahtaville_${i}`]) {
      [startDate,endDate,nahtavillaConfirmed,startModified,endModified] = getEsillaoloDates(`ehdotus_nahtavillaolokerta_${i}`, data, deadlines);
      nahtavillaDone = true;
    }
  }
  if (!nahtavillaDone && data?.kaavaehdotus_nahtaville_1 !== false) {
    [startDate,endDate,nahtavillaConfirmed,startModified,endModified] = getEsillaoloDates("ehdotus_nahtavillaolokerta_1", data, deadlines);
  }

  return [startDate,endDate,nahtavillaConfirmed,startModified,endModified,
    lkDates.boardDate,lkDates.confirmBoard,boardText,lkDates.boardModified,starText,endText]
}

const getReviewSuggestion = (data,deadlines) => {
  const boardText = "custom-card.review-suggestion-board-text"
  let lkDates = {
    boardDate: "",
    confirmBoard: false,
    boardModified: false
  }
  for (let i = 4; i > 0; i--) {
    if (data?.[`tarkistettu_ehdotus_lautakuntaan_${i}`]) {
      lkDates = getLautakuntaDates(`tarkistettu_ehdotus_lautakuntakerta_${i}`, data, deadlines);
      break;
    }
  }
  const { boardDate, confirmBoard, boardModified } = lkDates;
  return ["","",confirmBoard,true,true,boardDate,confirmBoard,boardText,boardModified]
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
  return ["","","",false,false,acceptanceDate,false,boardText,false]
}

const getInfoFieldData = (placeholder,name,data,deadlines,selectedPhase) => {
  const suggestionPhase = [29, 21, 15, 9, 3].includes(selectedPhase)
  const reviewSuggestionPhase = [30, 22, 16, 10, 4].includes(selectedPhase)

  const living = data?.asuminen_yhteensa || 0
  const office = data?.toimitila_yhteensa || 0
  const general = data?.julkiset_yhteensa || 0
  const other = data?.muut_yhteensa || 0

  let [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified,starText,endText] = ["","","",false,false,"",false,"",false,"",""]
  if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_periaatteet_fieldset"){
    [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified] = getPrincipleDates(data,deadlines)
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_luonnos_fieldset" && data?.luonnos_luotu){
    [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified] = getDraftDates(data,deadlines)
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_oas_fieldset"){
    [startDate,endDate,hide,startModified,endModified,confirmBoard] = getOASDates(data,deadlines) 
  }
  else if(suggestionPhase && placeholder === "Tarkasta kerrosalatiedot" && name === "tarkasta_kerrosala_fieldset"){
    [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified,starText,endText] = getSuggestion(data,deadlines)
  }
  else if(reviewSuggestionPhase && placeholder === "Tarkasta kerrosalatiedot" && name === "tarkasta_kerrosala_fieldset"){
    [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified] = getReviewSuggestion(data,deadlines)
  }
  else if(placeholder === "Merkitse hyväksymispäivä" || placeholder === "Merkitse muutoksenhakua koskevat päivämäärät" || placeholder === "Merkitse voimaantuloa koskevat päivämäärät"){
    [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified] = getAcceptanceDate(data,placeholder)
  }

  return [startDate,endDate,startModified,endModified,hide,living,office,general,other,boardDate,confirmBoard,boardText,boardModified,starText,endText,suggestionPhase]
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