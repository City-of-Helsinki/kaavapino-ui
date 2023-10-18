const getPrincipleDates = (data) =>{
  //Date info periaatteet
  let startDate = ""
  let endDate = ""
  let hide = false

  if(data?.jarjestetaan_periaatteet_esillaolo_3 && data?.milloin_periaatteet_esillaolo_alkaa_3 && data?.milloin_periaatteet_esillaolo_paattyy_3){
    startDate = data?.milloin_periaatteet_esillaolo_alkaa_3
    endDate = data?.milloin_periaatteet_esillaolo_paattyy_3
    hide = data?.vahvista_periaatteet_esillaolo_alkaa_3 && data?.vahvista_periaatteet_esillaolo_paattyy_3
  }
  else if(data?.jarjestetaan_periaatteet_esillaolo_2 && data?.milloin_periaatteet_esillaolo_alkaa_2 && data?.milloin_periaatteet_esillaolo_paattyy_2){
    startDate = data?.milloin_periaatteet_esillaolo_alkaa_2
    endDate = data?.milloin_periaatteet_esillaolo_paattyy_2
    hide = data?.vahvista_periaatteet_esillaolo_alkaa_2 && data?.vahvista_periaatteet_esillaolo_paattyy_2
  }
  else if(data?.jarjestetaan_periaatteet_esillaolo_1 && data?.milloin_periaatteet_esillaolo_alkaa && data?.milloin_periaatteet_esillaolo_paattyy){
    startDate = data?.milloin_periaatteet_esillaolo_alkaa
    endDate = data?.milloin_periaatteet_esillaolo_paattyy
    hide = data?.vahvista_periaatteet_esillaolo_alkaa && data?.vahvista_periaatteet_esillaolo_paattyy
  }
  return [startDate,endDate,hide]
}

const getOASDates = (data) =>{
  //Date info OAS
  let startDate = ""
  let endDate = ""
  let hide = false

  if(data?.jarjestetaan_oas_esillaolo_3 && data?.milloin_oas_esillaolo_alkaa_3 && data?.milloin_oas_esillaolo_paattyy_3){
    startDate = data?.milloin_oas_esillaolo_alkaa_3
    endDate = data?.milloin_oas_esillaolo_paattyy_3
    hide = data?.vahvista_oas_esillaolo_alkaa_3 && data?.vahvista_oas_esillaolo_paattyy_3
  }
  else if(data?.jarjestetaan_oas_esillaolo_2 && data?.milloin_oas_esillaolo_alkaa_2 && data?.milloin_oas_esillaolo_paattyy_2){
    startDate = data?.milloin_oas_esillaolo_alkaa_2
    endDate = data?.milloin_oas_esillaolo_paattyy_2
    hide = data?.vahvista_oas_esillaolo_alkaa_2 && data?.vahvista_oas_esillaolo_paattyy_2
  }
  else if(data?.jarjestetaan_oas_esillaolo_1 && data?.milloin_oas_esillaolo_alkaa && data?.milloin_oas_esillaolo_paattyy){
    startDate = data?.milloin_oas_esillaolo_alkaa
    endDate = data?.milloin_oas_esillaolo_paattyy
    hide = data?.vahvista_oas_esillaolo_alkaa && data?.vahvista_oas_esillaolo_paattyy
  }

  return [startDate,endDate,hide]
}

const getDraftDates = (data) =>{
  //Date info luonnos
  const startDate = data?.milloin_luonnos_esillaolo_alkaa
  const endDate = data?.milloin_luonnos_esillaolo_paattyy
  const hide = data?.vahvista_luonnos_esillaolo_alkaa && data?.vahvista_luonnos_esillaolo_paattyy

  return [startDate,endDate,hide]
}

const getInfoFieldData = (placeholder,name,data) => {
  //Floor area info
  const living = data?.asuminen_yhteensa
  const office = data?.toimitila_yhteensa
  const general = data?.julkiset_yhteensa
  const other = data?.muut_yhteensa

  //Date info
  let startModified = false
  let endModified = false
  let [startDate,endDate,hide] = ["","",""]

  //There can be multiple start and end dates in one phases schedule at the same time
  //Show latest dates that has both start and end date and is not confirmed
  if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_periaatteet_fieldset"){
    [startDate,endDate,hide] = getPrincipleDates(data)
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_luonnos_fieldset" && data?.luonnos_luotu && data?.jarjestetaan_luonnos_esillaolo_1 && data?.milloin_luonnos_esillaolo_alkaa && data?.milloin_luonnos_esillaolo_paattyy){
    [startDate,endDate,hide] = getDraftDates(data)
  }
  else if(placeholder === "Tarkasta esilläolopäivät" && name === "tarkasta_esillaolo_oas_fieldset"){
    [startDate,endDate,hide] = getOASDates(data) 
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