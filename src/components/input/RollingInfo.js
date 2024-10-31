import React from 'react'
import { useSelector } from 'react-redux'
import { usersSelector } from '../../selectors/userSelector'
import {IconPenLine,IconCheckCircle,IconAlertCircleFill,Button } from 'hds-react'
import projectUtils from '../../utils/projectUtils'
import { useTranslation } from 'react-i18next'
import ReactQuill from 'react-quill'
import infoBothDir from '../../assets/icons/Infobothdir.svg'
import PropTypes from 'prop-types'

function RollingInfo({name,value,nonEditable,modifyText,rollingInfoText,editRollingField,type,phaseIsClosed,factaInfo,maxSizeOver}) {

  const { t } = useTranslation()

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
  
  const formatInputText = (input) => {
    if (!input){
      return noValue
    }
    if (input.constructor !== Array) {
      return value === "" ? noValue : input
    }
    return <>{
      input.map((str) => 
      <p key={str}>{str.charAt(0).toUpperCase() + str.slice(1)}</p>)
    }</>
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
        <div className='content'>{formatInputText(inputText)}</div>
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
    {value && !maxSizeOver ?
      <>
        <img alt='' aria-hidden="true" src={infoBothDir} />
        <span>{rollingInfoText}</span>
      </>
      :
      <>
      </>
    }
    {maxSizeOver ?
      <div className='max-chars-error'>
        <IconAlertCircleFill color="#B01038" aria-hidden="true"/>
         {t('project.charsover')}
      </div>
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
  phaseIsClosed: PropTypes.bool,
  factaInfo: PropTypes.string,
  maxSizeOver: PropTypes.bool
}

export default RollingInfo