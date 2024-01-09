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

const getPrincipleDates = (data,deadlines) =>{
  //Date info periaatteet
  let startDate = ""
  let endDate = ""
  let hide = false
  let startModified = false
  let endModified = false
  const boardDate = data?.milloin_periaatteet_lautakunnassa
  const confirmBoard = data?.vahvista_periaatteet_lautakunnassa
  const boardText = "custom-card.principles-board-text"

  if(data?.vahvista_periaatteet_esillaolo_alkaa_3 === true && data?.vahvista_periaatteet_esillaolo_paattyy_3 === true){
    hide = true
    startDate = data?.milloin_periaatteet_esillaolo_alkaa_3
    endDate = data?.milloin_periaatteet_esillaolo_paattyy_3
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa_3",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy_3",deadlines,"Periaatteet")
  }
  else if(data?.vahvista_periaatteet_esillaolo_alkaa_2 === true && data?.vahvista_periaatteet_esillaolo_paattyy_2 === true && data?.jarjestetaan_periaatteet_esillaolo_3 && data?.milloin_periaatteet_esillaolo_alkaa_3 && data?.milloin_periaatteet_esillaolo_paattyy_3){
    startDate = data?.milloin_periaatteet_esillaolo_alkaa_3
    endDate = data?.milloin_periaatteet_esillaolo_paattyy_3
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa_3",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy_3",deadlines,"Periaatteet")
  }
  else if(data?.vahvista_periaatteet_esillaolo_alkaa === true && data?.vahvista_periaatteet_esillaolo_paattyy === true && data?.jarjestetaan_periaatteet_esillaolo_2 && data?.milloin_periaatteet_esillaolo_alkaa_2 && data?.milloin_periaatteet_esillaolo_paattyy_2){
    startDate = data?.milloin_periaatteet_esillaolo_alkaa_2
    endDate = data?.milloin_periaatteet_esillaolo_paattyy_2
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa_2",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy_2",deadlines,"Periaatteet")
  }
  else if(data?.jarjestetaan_periaatteet_esillaolo_1 && data?.vahvista_periaatteet_esillaolo_alkaa !== true || data?.vahvista_periaatteet_esillaolo_paattyy !== true && data?.milloin_periaatteet_esillaolo_alkaa && data?.milloin_periaatteet_esillaolo_paattyy){
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
    hide = true
  }

  return [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText]
}

const getOASDates = (data,deadlines) =>{
  //Date info OAS
  let startDate = ""
  let endDate = ""
  let hide = false
  let startModified = false
  let endModified = false

  if(data?.vahvista_oas_esillaolo_alkaa_3 === true && data?.vahvista_oas_esillaolo_paattyy_3 === true){
    hide = true
    startDate = data?.milloin_oas_esillaolo_alkaa_3
    endDate = data?.milloin_oas_esillaolo_paattyy_3
    startModified = userHasModified("milloin_oas_esillaolo_alkaa_3",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy_3",deadlines,"OAS")
  }
  else if(data?.vahvista_oas_esillaolo_alkaa_2 === true && data?.vahvista_oas_esillaolo_paattyy_2 === true && data?.jarjestetaan_oas_esillaolo_3 && data?.milloin_oas_esillaolo_alkaa_3 && data?.milloin_oas_esillaolo_paattyy_3){
    startDate = data?.milloin_oas_esillaolo_alkaa_3
    endDate = data?.milloin_oas_esillaolo_paattyy_3
    startModified = userHasModified("milloin_oas_esillaolo_alkaa_3",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy_3",deadlines,"OAS")
  }
  else if(data?.vahvista_oas_esillaolo_alkaa === true && data?.vahvista_oas_esillaolo_paattyy === true && data?.jarjestetaan_oas_esillaolo_2 && data?.milloin_oas_esillaolo_alkaa_2 && data?.milloin_oas_esillaolo_paattyy_2){
    startDate = data?.milloin_oas_esillaolo_alkaa_2
    endDate = data?.milloin_oas_esillaolo_paattyy_2
    startModified = userHasModified("milloin_oas_esillaolo_alkaa_2",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy_2",deadlines,"OAS")
  }
  else if(data?.vahvista_oas_esillaolo_alkaa !== true || data?.vahvista_oas_esillaolo_paattyy !== true && data?.milloin_oas_esillaolo_alkaa && data?.milloin_oas_esillaolo_paattyy){
    startDate = data?.milloin_oas_esillaolo_alkaa
    endDate = data?.milloin_oas_esillaolo_paattyy
    startModified = userHasModified("milloin_oas_esillaolo_alkaa",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy",deadlines,"OAS")
  }
  else{
    hide = true
    //Not optional in OAS phase, required to have
    startDate = data?.milloin_oas_esillaolo_alkaa
    endDate = data?.milloin_oas_esillaolo_paattyy
    startModified = userHasModified("milloin_oas_esillaolo_alkaa",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy",deadlines,"OAS")
  }

  return [startDate,endDate,hide,startModified,endModified]
}

const getDraftDates = (data,deadlines) =>{
  //Date info luonnos
  const hide = data?.vahvista_luonnos_esillaolo_alkaa && data?.vahvista_luonnos_esillaolo_paattyy
  let startDate = ""
  let endDate = ""
  const startModified = userHasModified("milloin_luonnos_esillaolo_alkaa",deadlines,"Luonnos")
  const endModified = userHasModified("milloin_luonnos_esillaolo_paattyy",deadlines,"Luonnos")
  const boardDate = data?.milloin_kaavaluonnos_lautakunnassa
  const confirmBoard = data?.vahvista_kaavaluonnos_lautakunnassa
  const boardText = "custom-card.draft-board-text"
  //Dates are optional and possibly hidden in projects
  if(data?.jarjestetaan_luonnos_esillaolo_1){
    startDate = data?.milloin_luonnos_esillaolo_alkaa
    endDate = data?.milloin_luonnos_esillaolo_paattyy
  }

  return [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText]
}

const getInfoFieldData = (placeholder,name,data,deadlines) => {
  //Floor area info
  const living = data?.asuminen_yhteensa || 0
  const office = data?.toimitila_yhteensa || 0
  const general = data?.julkiset_yhteensa || 0
  const other = data?.muut_yhteensa || 0

  //Date info
  let [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText] = ["","","",false,false,"",false,""]
  //There can be multiple start and end dates in one phases schedule at the same time
  //Show latest dates that has both start and end date and is not confirmed
  if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_periaatteet_fieldset"){
    [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText] = getPrincipleDates(data,deadlines)
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_luonnos_fieldset" && data?.luonnos_luotu){
    [startDate,endDate,hide,startModified,endModified,boardDate,confirmBoard,boardText] = getDraftDates(data,deadlines)
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_oas_fieldset"){
    [startDate,endDate,hide,startModified,endModified] = getOASDates(data,deadlines) 
  }
/*TODO later when excel is up to date name === "tarkasta_lautakunta_ehdotus_fieldset"
  name === "tarkasta_lautakunta_tarkistettu_ehdotus_fieldset"*/

  return [startDate,endDate,startModified,endModified,hide,living,office,general,other,boardDate,confirmBoard,boardText]
}
  
export default {
  getInfoFieldData
}