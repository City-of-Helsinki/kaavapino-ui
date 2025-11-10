import React from 'react'
import { useSelector } from 'react-redux'
import { usersSelector } from '../../selectors/userSelector'
import {IconPenLine,IconCheckCircle,IconAlertCircleFill,Button } from 'hds-react'
import projectUtils from '../../utils/projectUtils'
import { useTranslation } from 'react-i18next'
import ReactQuill from 'react-quill'
import infoBothDir from '../../assets/icons/Infobothdir.svg'
import PropTypes from 'prop-types'

function RollingInfo({name,value,nonEditable,modifyText,rollingInfoText,editRollingField,type,phaseIsClosed,factaInfo,maxSizeOver,attributeData}) {
  const { t } = useTranslation()

  const users = useSelector(state => usersSelector(state))
  let inputText = value
  let noInfoText = name === "voimassa_asemakaavat" || name === "voimassa_olevat_rakennuskiellot" ? "Ei ole" : "Ei"
  let noValue = factaInfo ? noInfoText : "Tieto puuttuu."
  
  if(name === "vastuuhenkilo_nimi_readonly" && value && users){
    const user = projectUtils.formatUsersName(users.find(u => u.id === value))
    inputText = user
  } 

  //Derive lines from milta_muilta_pyydetaan_lausunto_fieldset when special readonly field name
  if(name === 'viranomaistahon_nimi_ehdotus_readonly'
    && attributeData
    && Array.isArray(attributeData.milta_muilta_pyydetaan_lausunto_fieldset)
    && attributeData.milta_muilta_pyydetaan_lausunto_fieldset.length){
    const lines = attributeData.milta_muilta_pyydetaan_lausunto_fieldset
      .filter(item => item && !item._deleted)
      .map(item => {
        const delta = item && item.viranomaistahon_nimi_ehdotus
        if(!delta || !Array.isArray(delta.ops)) return null
        const text = delta.ops
          .map(op => (op && typeof op.insert === 'string') ? op.insert : '')
          .join('')
          .split('\n') // preserve explicit line breaks inside one delta
          .map(s => s.trim())
          .filter(Boolean)
        return text
      })
      .filter(Boolean)
      .flat()
    if(lines.length){
      inputText = {
        ops: lines.flatMap(l => [{ insert: l }, { insert: '\n' }])
      }
    }
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
      input.filter(str => str).map((str) => 
      <p key={str}>{str.charAt(0).toUpperCase() + str.slice(1)}</p>)
    }</>
  }

  return (
    <>
    <div className='rolling-info-container'>
      <div className={value === "" ? "text-input-italic" : "text-input"}>
        {type === "richtext" ?
        <ReactQuill
          value={
            name === 'viranomaistahon_nimi_ehdotus_readonly'
              ? (inputText || noValue)
              : (value === "" ? noValue : value)
          }
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