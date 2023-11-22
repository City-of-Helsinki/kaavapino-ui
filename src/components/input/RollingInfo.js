import React from 'react'
import {IconPenLine,IconCheckCircle,Button } from 'hds-react'
import PropTypes from 'prop-types'

function RollingInfo({value,nonEditable,modifyText,rollingInfoText,editRollingField,isCurrentPhase,selectedPhase}) {

  //Starting page code for different sized projects(xs-xl)
  const firstPhase = selectedPhase === 1 || selectedPhase === 7 || selectedPhase === 13 || selectedPhase === 19 || selectedPhase === 25

  const openEdit = () => {
    editRollingField()
  }

  return (
    <>
    <div className='rolling-info-container'>
      <div className={value === "" ? "text-input-italic" : "text-input"}>
        <div className='content'>{value === "" ? "Tieto puuttuu." : value}</div>
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