import React from 'react'
import { TextInput,IconPenLine,IconCheckCircle,Button } from 'hds-react'

function RollingInfo({name,value,nonEditable,modifyText,rollingInfoText,editRollingField}) {

  const openEdit = () => {
    editRollingField()
  }

  return (
    <>
    <div className='rolling-info-container'>
      <div className={value === "" ? "text-input-italic" : "text-input"}>
        <TextInput
          aria-label={name}
          fluid="true"
          disabled
          defaultValue={value === "" ? "Tieto puuttuu." : value}
        />
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

export default RollingInfo