const userHasModified = (field,deadlines,phase) => {
  //Check if user has updated fields and field is no longer automatically generated date 
  for (let i = 0; i < deadlines.length; i++) {
    if(deadlines[i].deadline.phase_name === phase && deadlines[i].deadline?.attribute === field){
      //return true if has value
      return !!deadlines[i]?.edited
    }
  }
  return false
}

const isConfirmed = (shown,startDateConfirmed,endDateConfirmed,falsyCheck) => {
  if(falsyCheck){
    return shown !== true && startDateConfirmed === true && endDateConfirmed === true
  }
  return shown === true && startDateConfirmed === true && endDateConfirmed === true
}

const getPrincipleDates = (data,deadlines) =>{
  //Date info Periaatteet
  let startDate = ""
  let endDate = ""
  let hide = false
  let startModified = false
  let endModified = false
  const boardDate = data?.milloin_periaatteet_lautakunnassa
  const confirmBoard = data?.vahvista_periaatteet_lautakunnassa
  const boardText = "custom-card.principles-board-text"
  const boardModified = userHasModified("milloin_periaatteet_lautakunnassa",deadlines,"Periaatteet")

  if(data?.jarjestetaan_periaatteet_esillaolo_3 === true && data?.vahvista_periaatteet_esillaolo_alkaa_2 === true && data?.vahvista_periaatteet_esillaolo_paattyy_2 === true && data?.milloin_periaatteet_esillaolo_alkaa_3 && data?.milloin_periaatteet_esillaolo_paattyy_3){
    hide = isConfirmed(data?.jarjestetaan_periaatteet_esillaolo_3,data?.vahvista_periaatteet_esillaolo_alkaa_3,data?.vahvista_periaatteet_esillaolo_paattyy_3,false) 
    startDate = data?.milloin_periaatteet_esillaolo_alkaa_3
    endDate = data?.milloin_periaatteet_esillaolo_paattyy_3
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa_3",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy_3",deadlines,"Periaatteet")
  }
  else if(data?.jarjestetaan_periaatteet_esillaolo_2 === true && data?.vahvista_periaatteet_esillaolo_alkaa === true && data?.vahvista_periaatteet_esillaolo_paattyy === true && data?.milloin_periaatteet_esillaolo_alkaa_2 && data?.milloin_periaatteet_esillaolo_paattyy_2){
    hide = isConfirmed(data?.jarjestetaan_periaatteet_esillaolo_2,data?.vahvista_periaatteet_esillaolo_alkaa_2,data?.vahvista_periaatteet_esillaolo_paattyy_2,false)
    startDate = data?.milloin_periaatteet_esillaolo_alkaa_2
    endDate = data?.milloin_periaatteet_esillaolo_paattyy_2
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa_2",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy_2",deadlines,"Periaatteet")
  }
  else if(data?.jarjestetaan_periaatteet_esillaolo_1 === true && data?.vahvista_periaatteet_esillaolo_alkaa !== true || data?.vahvista_periaatteet_esillaolo_paattyy !== true && data?.milloin_periaatteet_esillaolo_alkaa && data?.milloin_periaatteet_esillaolo_paattyy){
    hide = isConfirmed(data?.jarjestetaan_periaatteet_esillaolo_1,data?.vahvista_periaatteet_esillaolo_alkaa,data?.vahvista_periaatteet_esillaolo_paattyy,false)
    startDate = data?.milloin_periaatteet_esillaolo_alkaa
    endDate = data?.milloin_periaatteet_esillaolo_paattyy
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy",deadlines,"Periaatteet")
  }
  else{
     //Dates are optional and possibly hidden in projects
    if(data?.jarjestetaan_periaatteet_esillaolo_1 || data?.jarjestetaan_periaatteet_esillaolo_2 || data?.jarjestetaan_periaatteet_esillaolo_3){
      startDate = data?.milloin_periaatteet_esillaolo_alkaa
      endDate = data?.milloin_periaatteet_esillaolo_paattyy
    }
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy",deadlines,"Periaatteet")
    hide = isConfirmed(true,data?.vahvista_periaatteet_esillaolo_alkaa,data?.vahvista_periaatteet_esillaolo_paattyy,false)
  }

  return [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified]
}

const getOASDates = (data,deadlines) =>{
  //Date info OAS
  let startDate = ""
  let endDate = ""
  let hide = false
  let startModified = false
  let endModified = false

  if(data?.jarjestetaan_oas_esillaolo_3 && data?.vahvista_oas_esillaolo_alkaa_2 === true && data?.vahvista_oas_esillaolo_paattyy_2 === true && data?.milloin_oas_esillaolo_alkaa_3 && data?.milloin_oas_esillaolo_paattyy_3){
    hide = isConfirmed(data?.jarjestetaan_oas_esillaolo_3,data?.vahvista_oas_esillaolo_alkaa_3,data?.vahvista_oas_esillaolo_paattyy_3,false)
    startDate = data?.milloin_oas_esillaolo_alkaa_3
    endDate = data?.milloin_oas_esillaolo_paattyy_3
    startModified = userHasModified("milloin_oas_esillaolo_alkaa_3",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy_3",deadlines,"OAS")
  }
  else if(data?.jarjestetaan_oas_esillaolo_2 && data?.vahvista_oas_esillaolo_alkaa === true && data?.vahvista_oas_esillaolo_paattyy === true && data?.milloin_oas_esillaolo_alkaa_2 && data?.milloin_oas_esillaolo_paattyy_2){
    hide = isConfirmed(data?.jarjestetaan_oas_esillaolo_3,data?.vahvista_oas_esillaolo_alkaa_2,data?.vahvista_oas_esillaolo_paattyy_2,true)
    startDate = data?.milloin_oas_esillaolo_alkaa_2
    endDate = data?.milloin_oas_esillaolo_paattyy_2
    startModified = userHasModified("milloin_oas_esillaolo_alkaa_2",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy_2",deadlines,"OAS")
  }
  else{
    //Not optional in OAS phase, required to have
    hide = isConfirmed(data?.jarjestetaan_oas_esillaolo_2,data?.vahvista_oas_esillaolo_alkaa,data?.vahvista_oas_esillaolo_paattyy,true)
    startDate = data?.milloin_oas_esillaolo_alkaa
    endDate = data?.milloin_oas_esillaolo_paattyy
    startModified = userHasModified("milloin_oas_esillaolo_alkaa",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy",deadlines,"OAS")
  }

  return [startDate,endDate,hide,startModified,endModified,hide]
}

const getDraftDates = (data,deadlines) =>{
  //Date info Luonnos
  const hide = data?.vahvista_luonnos_esillaolo_alkaa && data?.vahvista_luonnos_esillaolo_paattyy
  let startDate = ""
  let endDate = ""
  const startModified = userHasModified("milloin_luonnos_esillaolo_alkaa",deadlines,"Luonnos")
  const endModified = userHasModified("milloin_luonnos_esillaolo_paattyy",deadlines,"Luonnos")
  const boardDate = data?.milloin_kaavaluonnos_lautakunnassa
  const confirmBoard = data?.vahvista_kaavaluonnos_lautakunnassa
  const boardText = "custom-card.draft-board-text"
  const boardModified = userHasModified("milloin_kaavaluonnos_lautakunnassa",deadlines,"Luonnos")
  //Dates are optional and possibly hidden in projects
  if(data?.jarjestetaan_luonnos_esillaolo_1){
    startDate = data?.milloin_luonnos_esillaolo_alkaa
    endDate = data?.milloin_luonnos_esillaolo_paattyy
  }

  return [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified]
}

const getSuggestion = (data,deadlines) =>{
    //Date info Ehdotus
    let hide = false
    let startDate = ""
    let endDate = ""
    let startModified = false
    let endModified = false
    const starText = "custom-card.suggestion-start-text"
    const endText = "custom-card.suggestion-end-text"
    const boardDate = data?.milloin_kaavaehdotus_lautakunnassa
    const confirmBoard = data?.vahvista_kaavaehdotus_lautakunnassa
    const boardText = "custom-card.suggestion-board-text"
    const boardModified = userHasModified("milloin_kaavaehdotus_lautakunnassa",deadlines,"Ehdotus")
    //Excel data attribute name is different for suggestion start date in XL,L(_iso _iso_X) and M,S,XS(_pieni _pieni_X)
    const startAttribute = data?.milloin_ehdotuksen_nahtavilla_alkaa_iso || data?.milloin_ehdotuksen_nahtavilla_alkaa_pieni
    const startAttribute_2 = data?.milloin_ehdotuksen_nahtavilla_alkaa_iso_2 || data?.milloin_ehdotuksen_nahtavilla_alkaa_pieni_2
    const startAttribute_3 = data?.milloin_ehdotuksen_nahtavilla_alkaa_iso_3 || data?.milloin_ehdotuksen_nahtavilla_alkaa_pieni_3
    const startAttribute_4 = data?.milloin_ehdotuksen_nahtavilla_alkaa_iso_4 || data?.milloin_ehdotuksen_nahtavilla_alkaa_pieni_4

    const confirmStartAttr = data?.vahvista_ehdotus_esillaolo_alkaa_iso || data?.vahvista_ehdotus_esillaolo_alkaa_pieni
    const confirmStartAttr2 = data?.vahvista_ehdotus_esillaolo_alkaa_iso_2 || data?.vahvista_ehdotus_esillaolo_alkaa_pieni_2
    const confirmStartAttr3 = data?.vahvista_ehdotus_esillaolo_alkaa_iso_3 || data?.vahvista_ehdotus_esillaolo_alkaa_pieni_3
    const confirmStartAttr4 = data?.vahvista_ehdotus_esillaolo_alkaa_iso_4 || data?.vahvista_ehdotus_esillaolo_alkaa_pieni_4

    if(data?.kaavaehdotus_uudelleen_nahtaville_4 === true && confirmStartAttr3 === true && data?.vahvista_ehdotus_esillaolo_paattyy_3 === true && startAttribute_4 && data?.milloin_ehdotuksen_nahtavilla_paattyy_4){
      hide = isConfirmed(data?.kaavaehdotus_uudelleen_nahtaville_4,confirmStartAttr4,data?.vahvista_ehdotus_esillaolo_paattyy_4,false)
      startDate = startAttribute_4
      endDate = data?.milloin_ehdotuksen_nahtavilla_paattyy_4
      const attributeStartText = data?.milloin_ehdotuksen_nahtavilla_alkaa_iso_4 ? "milloin_ehdotuksen_nahtavilla_alkaa_iso_4" : "milloin_ehdotuksen_nahtavilla_alkaa_pieni_4"
      startModified = userHasModified(attributeStartText,deadlines,"Ehdotus")
      endModified = userHasModified("milloin_ehdotuksen_nahtavilla_paattyy_4",deadlines,"Ehdotus")
    }
    else if(data?.kaavaehdotus_uudelleen_nahtaville_3 === true && confirmStartAttr2 === true && data?.vahvista_ehdotus_esillaolo_paattyy_2 === true && startAttribute_3 && data?.milloin_ehdotuksen_nahtavilla_paattyy_3){
      hide = isConfirmed(data?.kaavaehdotus_uudelleen_nahtaville_4,confirmStartAttr3,data?.vahvista_ehdotus_esillaolo_paattyy_3,true)
      startDate = confirmStartAttr3
      endDate = data?.milloin_ehdotuksen_nahtavilla_paattyy_3
      const attributeStartText = data?.milloin_ehdotuksen_nahtavilla_alkaa_iso_3 ? "milloin_ehdotuksen_nahtavilla_alkaa_iso_3" : "milloin_ehdotuksen_nahtavilla_alkaa_pieni_3"
      startModified = userHasModified(attributeStartText,deadlines,"Ehdotus")
      endModified = userHasModified("milloin_ehdotuksen_nahtavilla_paattyy_3",deadlines,"Ehdotus")
    }
    else if(data?.kaavaehdotus_uudelleen_nahtaville_2 === true && confirmStartAttr === true && data?.vahvista_ehdotus_esillaolo_paattyy === true && startAttribute_2 && data?.milloin_ehdotuksen_nahtavilla_paattyy_2){
      hide = isConfirmed(data?.kaavaehdotus_uudelleen_nahtaville_3,confirmStartAttr2,data?.vahvista_ehdotus_esillaolo_paattyy_2,true)
      startDate = startAttribute_2
      endDate = data?.milloin_ehdotuksen_nahtavilla_paattyy_2
      const attributeStartText = data?.milloin_ehdotuksen_nahtavilla_alkaa_iso_2 ? "milloin_ehdotuksen_nahtavilla_alkaa_iso_2" : "milloin_ehdotuksen_nahtavilla_alkaa_pieni_2"
      startModified = userHasModified(attributeStartText,deadlines,"Ehdotus")
      endModified = userHasModified("milloin_ehdotuksen_nahtavilla_paattyy_2",deadlines,"Ehdotus")
    }
    else if(data?.kaavaehdotus_nahtaville_1 === true && confirmStartAttr !== true || data?.vahvista_ehdotus_esillaolo_paattyy !== true && startAttribute && data?.milloin_ehdotuksen_nahtavilla_paattyy){
      hide = isConfirmed(data?.kaavaehdotus_uudelleen_nahtaville_2,confirmStartAttr,data?.vahvista_ehdotus_esillaolo_paattyy,true)
      startDate = startAttribute
      endDate = data?.milloin_ehdotuksen_nahtavilla_paattyy
      const attributeStartText = data?.milloin_ehdotuksen_nahtavilla_alkaa_iso ? "milloin_ehdotuksen_nahtavilla_alkaa_iso" : "milloin_ehdotuksen_nahtavilla_alkaa_pieni"
      startModified = userHasModified(attributeStartText,deadlines,"Ehdotus")
      endModified = userHasModified("milloin_ehdotuksen_nahtavilla_paattyy",deadlines,"Ehdotus")
    }
    else{
      hide = isConfirmed(data?.kaavaehdotus_uudelleen_nahtaville_1,confirmStartAttr,data?.vahvista_ehdotus_esillaolo_paattyy,true)
      startDate = startAttribute
      endDate = data?.milloin_ehdotuksen_nahtavilla_paattyy
      const attributeStartText = data?.milloin_ehdotuksen_nahtavilla_alkaa_iso ? "milloin_ehdotuksen_nahtavilla_alkaa_iso" : "milloin_ehdotuksen_nahtavilla_alkaa_pieni"
      startModified = userHasModified(attributeStartText,deadlines,"Ehdotus")
      endModified = userHasModified("milloin_ehdotuksen_nahtavilla_paattyy",deadlines,"Ehdotus")
    }
  
    return [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified,starText,endText]
}

const getReviewSuggestion = (data,deadlines) =>{
    //Date info Tarkistettu ehdotus
    const boardDate = data?.milloin_tarkistettu_ehdotus_lautakunnassa
    const confirmBoard = data?.vahvista_tarkistettu_ehdotus_lautakunnassa
    const boardText = "custom-card.review-suggestion-board-text"
    const boardModified = userHasModified("milloin_tarkistettu_ehdotus_lautakunnassa",deadlines,"Tarkistettu ehdotus")
  
    return ["","",confirmBoard,true,true,boardDate,confirmBoard,boardText,boardModified]
}

const getAcceptanceDate = (data,name) =>{
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
  //Hyväksyminen phase hyväksymiskäsittely info box
  const boardText = "custom-card.acceptance-date-text"
  const acceptanceDate = date
  return ["","","",false,false,acceptanceDate,false,boardText,false]
}

const getInfoFieldData = (placeholder,name,data,deadlines,selectedPhase) => {
  //Phase id check if show both kerrosala and esilläolo and what phase data needs to be shown
  const suggestionPhase = [29, 21, 15, 9, 3].includes(selectedPhase)
  const reviewSuggestionPhase = [30, 22, 16, 10, 4].includes(selectedPhase)

  //Floor area info
  const living = data?.asuminen_yhteensa || 0
  const office = data?.toimitila_yhteensa || 0
  const general = data?.julkiset_yhteensa || 0
  const other = data?.muut_yhteensa || 0

  //Date info
  let [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText,boardModified,starText,endText] = ["","","",false,false,"",false,"",false,"",""]
  //There can be multiple start and end dates in one phases schedule at the same time
  //Show latest dates that has both start and end date and is not confirmed
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