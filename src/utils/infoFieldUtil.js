const userHasModified = (field,deadlines,phase) => {
  //Check if user has updated fields and field is no longer automatically generated date 
  for (let i = 0; i < deadlines.length; i++) {
    if(deadlines[i].deadline.phase_name === phase && deadlines[i].deadline?.attribute === field){
      if(deadlines[i]?.edited){
        return true
      }
      else{
        return false
      }
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

  if(!data?.vahvista_periaatteet_esillaolo_alkaa_3 && !data?.vahvista_periaatteet_esillaolo_paattyy_3 && data?.jarjestetaan_periaatteet_esillaolo_3 && data?.milloin_periaatteet_esillaolo_alkaa_3 && data?.milloin_periaatteet_esillaolo_paattyy_3){
    startDate = data?.milloin_periaatteet_esillaolo_alkaa_3
    endDate = data?.milloin_periaatteet_esillaolo_paattyy_3
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa_3",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy_3",deadlines,"Periaatteet")
  }
  else if(!data?.vahvista_periaatteet_esillaolo_alkaa_2 && !data?.vahvista_periaatteet_esillaolo_paattyy_2 && data?.jarjestetaan_periaatteet_esillaolo_2 && data?.milloin_periaatteet_esillaolo_alkaa_2 && data?.milloin_periaatteet_esillaolo_paattyy_2){
    startDate = data?.milloin_periaatteet_esillaolo_alkaa_2
    endDate = data?.milloin_periaatteet_esillaolo_paattyy_2
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa_2",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy_2",deadlines,"Periaatteet")
  }
  else if(!data?.vahvista_periaatteet_esillaolo_alkaa && !data?.vahvista_periaatteet_esillaolo_paattyy && data?.jarjestetaan_periaatteet_esillaolo_1 && data?.milloin_periaatteet_esillaolo_alkaa && data?.milloin_periaatteet_esillaolo_paattyy){
    startDate = data?.milloin_periaatteet_esillaolo_alkaa
    endDate = data?.milloin_periaatteet_esillaolo_paattyy
    startModified = userHasModified("milloin_periaatteet_esillaolo_alkaa",deadlines,"Periaatteet")
    endModified = userHasModified("milloin_periaatteet_esillaolo_paattyy",deadlines,"Periaatteet")
  }
  else{
    hide = true
  }

  return [startDate,endDate,hide,startModified,endModified]
}

const getOASDates = (data,deadlines) =>{
  //Date info OAS
  let startDate = ""
  let endDate = ""
  let hide = false
  let startModified = false
  let endModified = false

  if(!data?.vahvista_oas_esillaolo_alkaa_3 && !data?.vahvista_oas_esillaolo_paattyy_3 && data?.jarjestetaan_oas_esillaolo_3 && data?.milloin_oas_esillaolo_alkaa_3 && data?.milloin_oas_esillaolo_paattyy_3){
    startDate = data?.milloin_oas_esillaolo_alkaa_3
    endDate = data?.milloin_oas_esillaolo_paattyy_3
    startModified = userHasModified("milloin_oas_esillaolo_alkaa_3",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy_3",deadlines,"OAS")
  }
  else if(!data?.vahvista_oas_esillaolo_alkaa_2 && !data?.vahvista_oas_esillaolo_paattyy_2 && data?.jarjestetaan_oas_esillaolo_2 && data?.milloin_oas_esillaolo_alkaa_2 && data?.milloin_oas_esillaolo_paattyy_2){
    startDate = data?.milloin_oas_esillaolo_alkaa_2
    endDate = data?.milloin_oas_esillaolo_paattyy_2
    startModified = userHasModified("milloin_oas_esillaolo_alkaa_2",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy_2",deadlines,"OAS")
  }
  else if(!data?.vahvista_oas_esillaolo_alkaa && !data?.vahvista_oas_esillaolo_paattyy && data?.jarjestetaan_oas_esillaolo_1 && data?.milloin_oas_esillaolo_alkaa && data?.milloin_oas_esillaolo_paattyy){
    startDate = data?.milloin_oas_esillaolo_alkaa
    endDate = data?.milloin_oas_esillaolo_paattyy
    startModified = userHasModified("milloin_oas_esillaolo_alkaa",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy",deadlines,"OAS")
  }
  else if(!data?.vahvista_oas_esillaolo_alkaa && !data?.vahvista_oas_esillaolo_paattyy && data?.milloin_oas_esillaolo_alkaa && data?.milloin_oas_esillaolo_paattyy){
    startDate = data?.milloin_oas_esillaolo_alkaa
    endDate = data?.milloin_oas_esillaolo_paattyy
    startModified = userHasModified("milloin_oas_esillaolo_alkaa",deadlines,"OAS")
    endModified = userHasModified("milloin_oas_esillaolo_paattyy",deadlines,"OAS")
  }
  else{
    hide = true
  }

  return [startDate,endDate,hide,startModified,endModified]
}

const getDraftDates = (data,deadlines) =>{
  //Date info luonnos
  const hide = data?.vahvista_luonnos_esillaolo_alkaa && data?.vahvista_luonnos_esillaolo_paattyy
  const startDate = hide ? "" : data?.milloin_luonnos_esillaolo_alkaa
  const endDate = hide ? "" : data?.milloin_luonnos_esillaolo_paattyy
  const startModified = hide ? false : userHasModified("milloin_luonnos_esillaolo_alkaa",deadlines,"Luonnos")
  const endModified = hide ? false : userHasModified("milloin_luonnos_esillaolo_paattyy",deadlines,"Luonnos")

  return [startDate,endDate,hide,startModified,endModified]
}

const getInfoFieldData = (placeholder,name,data,deadlines) => {
  //Floor area info
  const living = data?.asuminen_yhteensa
  const office = data?.toimitila_yhteensa
  const general = data?.julkiset_yhteensa
  const other = data?.muut_yhteensa

  //Date info
  let [startDate,endDate,hide,startModified,endModified] = ["","","",false,false]

  //There can be multiple start and end dates in one phases schedule at the same time
  //Show latest dates that has both start and end date and is not confirmed
  if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_periaatteet_fieldset"){
    [startDate,endDate,hide,startModified,endModified] = getPrincipleDates(data,deadlines)
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_luonnos_fieldset" && data?.luonnos_luotu && data?.jarjestetaan_luonnos_esillaolo_1 && data?.milloin_luonnos_esillaolo_alkaa && data?.milloin_luonnos_esillaolo_paattyy){
    [startDate,endDate,hide,startModified,endModified] = getDraftDates(data,deadlines)
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_oas_fieldset"){
    [startDate,endDate,hide,startModified,endModified] = getOASDates(data,deadlines) 
  }
  else if(placeholder === "Tarkasta kerrosalatiedot"){
    //show floor area info if even one data exists
    hide = !living && !office && !general && !other
  }
  
  return [startDate,endDate,startModified,endModified,hide,living,office,general,other]
}
  
export default {
  getInfoFieldData
}