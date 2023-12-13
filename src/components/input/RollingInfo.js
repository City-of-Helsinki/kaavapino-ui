import React from 'react'
import { useSelector } from 'react-redux'
import { usersSelector } from '../../selectors/userSelector'
import {IconPenLine,IconCheckCircle,Button } from 'hds-react'
import projectUtils from '../../utils/projectUtils'
import PropTypes from 'prop-types'

function RollingInfo({name,value,nonEditable,modifyText,rollingInfoText,editRollingField,isCurrentPhase,selectedPhase}) {
  let inputText = value 
  if(name === "vastuuhenkilo_nimi_readonly" && value){
    const users = useSelector(state => usersSelector(state))
    if(users){
      const user = projectUtils.formatUsersName(users.find(u => u.id === value))
      inputText = user
    }
  } 
  //Starting page code for different sized projects(xs-xl)
  const firstPhase = selectedPhase === 1 || selectedPhase === 7 || selectedPhase === 13 || selectedPhase === 19 || selectedPhase === 25

  const openEdit = () => {
    editRollingField()
  }

  return (
    <>
    <div className='rolling-info-container'>
      <div className={value === "" ? "text-input-italic" : "text-input"}>
        <div className='content'>{value === "" ? "Tieto puuttuu." : inputText}</div>
      </div>
      {nonEditable ? 
      <></> 
      : 
      <Button disabled={!firstPhase && !isCurrentPhase} onClick={() => {openEdit()}} size="small" variant="supplementary" iconLeft={<IconPenLine />}>
        {modifyText}
      </Button>}
    </div>
    {!nonEditable && !firstPhase && !isCurrentPhase ?
    <div className='rolling-text'></div> :
    <div className='rolling-text'>
      {firstPhase && rollingInfoText === "Tieto siirtynyt aiemmasta vaiheesta" ? 
      <></> 
      : 
      <>
        <IconCheckCircle aria-hidden="true" /><span>{rollingInfoText}</span>
      </>
      }
    </div>
    }
  </>
  )
}

RollingInfo.propTypes = {
  name:PropTypes.string,
  value:PropTypes.string,
  nonEditable: PropTypes.bool,
  modifyText: PropTypes.string,
  rollingInfoText: PropTypes.string,
  editRollingField: PropTypes.func,
  isCurrentPhase:PropTypes.bool,
  selectedPhase:PropTypes.number
}

export default RollingInfo