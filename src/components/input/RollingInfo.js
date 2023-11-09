import React from 'react'
import {IconPenLine,IconCheckCircle,Button } from 'hds-react'
import PropTypes from 'prop-types'

function RollingInfo({value,nonEditable,modifyText,rollingInfoText,editRollingField}) {

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
      <></> : 
      <Button onClick={() => {openEdit()}} size="small" variant="supplementary" iconLeft={<IconPenLine />}>
        {modifyText}
      </Button>}
    </div>
    <div className='rolling-text'>
      <IconCheckCircle aria-hidden="true" /><span>{rollingInfoText}</span>
    </div>
  </>
  )
}

RollingInfo.propTypes = {
  name:PropTypes.string,
  value:PropTypes.string,
  nonEditable: PropTypes.bool,
  modifyText: PropTypes.string,
  rollingInfoText: PropTypes.string,
  editRollingField: PropTypes.func
}

export default RollingInfo