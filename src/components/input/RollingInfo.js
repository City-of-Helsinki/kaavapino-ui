import React from 'react'
import { useSelector } from 'react-redux'
import { usersSelector } from '../../selectors/userSelector'
import {IconPenLine,IconCheckCircle,Button } from 'hds-react'
import projectUtils from '../../utils/projectUtils'
import ReactQuill from 'react-quill'
import infoBothDir from '../../assets/icons/Infobothdir.svg'
import PropTypes from 'prop-types'

function RollingInfo({name,value,nonEditable,modifyText,rollingInfoText,editRollingField,type,phaseIsClosed,factaInfo}) {

  const users = useSelector(state => usersSelector(state))
  let inputText = value
  let noInfoText = name === "voimassa_asemakaavat" || name === "voimassa_olevat_rakennuskiellot" ? "Ei ole" : "Ei"
  let noValue = factaInfo ? noInfoText : "Tieto puuttuu."
  
  if(name === "vastuuhenkilo_nimi_readonly" && value && users){
    const user = projectUtils.formatUsersName(users.find(u => u.id === value))
    inputText = user
  } 

  const openEdit = () => {
    editRollingField()
  }

  return (
    <>
    <div className='rolling-info-container'>
      <div className={value === "" ? "text-input-italic" : "text-input"}>
        {type === "richtext" ?
        <ReactQuill
          value={value === "" ? noValue : value}
          tabIndex="0"
          theme="snow"
          readOnly={true}
          className="rolling-richtext"
        />
        :
        <div className='content'>{value === "" ? noValue : inputText}</div>
        }
      </div>
      {nonEditable ? 
      <></> 
      : 
      <Button disabled={phaseIsClosed} onClick={() => {openEdit()}} size="small" variant="supplementary" iconLeft={<IconPenLine />}>
        {modifyText}
      </Button>}
    </div>
    {nonEditable ?
    <div className='rolling-text'>
      <IconCheckCircle aria-hidden="true" />
      <span>{rollingInfoText}</span>
    </div> :
    <div className='rolling-text'>
    {value ?
      <>
        <img alt='' aria-hidden="true" src={infoBothDir} />
        <span>{rollingInfoText}</span>
      </>
      :
      <>
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
  type:PropTypes.string,
  phaseIsClosed: PropTypes.bool
}

export default RollingInfo