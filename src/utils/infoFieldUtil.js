const getInfoFieldData = (placeholder,name,data) => {
  //Floor area info
  const living = data?.asuminen_yhteensa
  const office = data?.toimitila_yhteensa
  const general = data?.julkiset_yhteensa
  const other = data?.muut_yhteensa
  //Date info
  let startDate = ""
  let endDate = ""
  let startModified = false
  let endModified = false
  
  let hide = false

  //There can be multiple start and end dates in one phases schedule at the same time
  //Show latest dates that has both start and end date and is not confirmed
  if(placeholder === "Tarkasta esilläolopäivät"){
    if(name === "tarkasta_esillaolo_periaatteet_fieldset"){
      if(data?.jarjestetaan_periaatteet_esillaolo_3 && data?.milloin_periaatteet_esillaolo_alkaa_3 && data?.milloin_periaatteet_esillaolo_paattyy_3){
        startDate = data?.milloin_periaatteet_esillaolo_alkaa_3
        endDate = data?.milloin_periaatteet_esillaolo_paattyy_3
        if(data?.vahvista_periaatteet_esillaolo_alkaa_3 && data?.vahvista_periaatteet_esillaolo_paattyy_3){
          hide = true
        }
      }
      else if(data?.jarjestetaan_periaatteet_esillaolo_2 && data?.milloin_periaatteet_esillaolo_alkaa_2 && data?.milloin_periaatteet_esillaolo_paattyy_2){
        startDate = data?.milloin_periaatteet_esillaolo_alkaa_2
        endDate = data?.milloin_periaatteet_esillaolo_paattyy_2
        if(data?.vahvista_periaatteet_esillaolo_alkaa_2 && data?.vahvista_periaatteet_esillaolo_paattyy_2){
          hide = true
        }
      }
      else if(data?.jarjestetaan_periaatteet_esillaolo_1 && data?.milloin_periaatteet_esillaolo_alkaa && data?.milloin_periaatteet_esillaolo_paattyy){
        startDate = data?.milloin_periaatteet_esillaolo_alkaa
        endDate = data?.milloin_periaatteet_esillaolo_paattyy
        if(data?.vahvista_periaatteet_esillaolo_alkaa && data?.vahvista_periaatteet_esillaolo_paattyy){
          hide = true
        }
      }

    }
    else if(name === "tarkasta_esillaolo_luonnos_fieldset" && data?.luonnos_luotu && data?.jarjestetaan_luonnos_esillaolo_1 && data?.milloin_luonnos_esillaolo_alkaa && data?.milloin_luonnos_esillaolo_paattyy){
      startDate = data?.milloin_luonnos_esillaolo_alkaa
      endDate = data?.milloin_luonnos_esillaolo_paattyy
      if(data?.vahvista_luonnos_esillaolo_alkaa && data?.vahvista_luonnos_esillaolo_paattyy){
        hide = true
      }
    }
    else if(name === "tarkasta_esillaolo_oas_fieldset"){
      if(data?.jarjestetaan_oas_esillaolo_3 && data?.milloin_oas_esillaolo_alkaa_3 && data?.milloin_oas_esillaolo_paattyy_3){
        startDate = data?.milloin_oas_esillaolo_alkaa_3
        endDate = data?.milloin_oas_esillaolo_paattyy_3
        if(data?.vahvista_oas_esillaolo_alkaa_3 && data?.vahvista_oas_esillaolo_paattyy_3){
          hide = true
        }
      }
      else if(data?.jarjestetaan_oas_esillaolo_2 && data?.milloin_oas_esillaolo_alkaa_2 && data?.milloin_oas_esillaolo_paattyy_2){
        startDate = data?.milloin_oas_esillaolo_alkaa_2
        endDate = data?.milloin_oas_esillaolo_paattyy_2
        if(data?.vahvista_oas_esillaolo_alkaa_2 && data?.vahvista_oas_esillaolo_paattyy_2){
          hide = true
        }
      }
      else if(data?.jarjestetaan_oas_esillaolo_1 && data?.milloin_oas_esillaolo_alkaa && data?.milloin_oas_esillaolo_paattyy){
        startDate = data?.milloin_oas_esillaolo_alkaa
        endDate = data?.milloin_oas_esillaolo_paattyy
        if(data?.vahvista_oas_esillaolo_alkaa && data?.vahvista_oas_esillaolo_paattyy){
          hide = true
        }
      }
    }
  }
  
  return [startDate,endDate,startModified,endModified,hide,living,office,general,other]
}
  
export default {
  getInfoFieldData
}