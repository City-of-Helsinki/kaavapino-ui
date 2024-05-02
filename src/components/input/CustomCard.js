import React, {useEffect,useState} from 'react'
import PropTypes from 'prop-types'
import { useDispatch,useSelector } from 'react-redux';
import {Button,IconPenLine,IconCheckCircle } from 'hds-react'
import {showFloorArea, showTimetable} from '../../actions/projectActions'
import {attributeDataSelector,deadlinesSelector} from '../../selectors/projectSelector'
import { useTranslation } from 'react-i18next'
import infoFieldUtil from '../../utils/infoFieldUtil'
import moment from 'moment'

function CustomCard({type, props, name, data, deadlines, selectedPhase, showBoth}) {
  const [cardValues, setCardValues] = useState(["","","","",true,0,0,0,0,"",false,"",false,"","",false]);
  
  const attributeData = useSelector(state => attributeDataSelector(state))
  const deadlinesData = useSelector(state => deadlinesSelector(state))

  useEffect(() => {
    setCardValues(infoFieldUtil.getInfoFieldData(type,name,data,deadlines,selectedPhase))
  }, [])

  useEffect(() => {
    setCardValues(infoFieldUtil.getInfoFieldData(props.placeholder,props.input?.name,attributeData,deadlinesData,selectedPhase))
  }, [attributeData,deadlinesData])

  const getFieldsInOrder = (suggestionPhase,heading,container,container2,editDataLink) => {
    if(suggestionPhase){
      return (
        <div className='custom-card' >
        <div className='heading'>{heading}</div>
        {container}
        {container2}
        {editDataLink}
      </div>
      )
    }
    else{
      return (
        <div className='custom-card' >
          <div className='heading'>{heading}</div>
          {container2}
          {container}
          {editDataLink}
        </div>
      )
    }
  }

  const dispatch = useDispatch()
  const { t } = useTranslation()

  let buttonText
  let heading
  let fields
  let editDataLink
  let boardFields = ""
  let container
  let container2
  let modifiedText = cardValues[12] ? t('custom-card.modified') : t('custom-card.evaluation')
  const unit = "k-m²"
  
  if(type === "Tarkasta esilläolopäivät" || type === "Merkitse hyväksymispäivä"){
    let startsText = props?.fieldData?.fieldset_attributes[0]?.label || ""
    let endsText = props?.fieldData?.fieldset_attributes[1]?.label || ""
    buttonText = t('custom-card.modify-date')
    heading = t('custom-card.check-date')
    
    if(showBoth){
      startsText = cardValues[13] ? t(cardValues[13]) : ""
      endsText = cardValues[14] ? t(cardValues[14]) : ""
    }

    fields = <>  
    {cardValues[0] ?
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{startsText}</div>
      <div className='custom-card-date'><span className='date'>{moment(cardValues[0]).format('DD.MM.YYYY')}</span><span className='divider'>-</span><span className='status'> {!cardValues[4] ? cardValues[2] ? t('custom-card.modified') : t('custom-card.evaluation') : t('custom-card.confirmed')}</span></div>
    </div>
    :
    ""
    }
    {cardValues[1] ?
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{endsText}</div>
      <div className='custom-card-date'><span className='date'>{moment(cardValues[1]).format('DD.MM.YYYY')}</span><span className='divider'>-</span><span className='status'> {!cardValues[4] ? cardValues[3] ? t('custom-card.modified') : t('custom-card.evaluation') : t('custom-card.confirmed')}</span></div>
    </div>
    :
    ""
    }
    </>

    //XL princibles and draft phases have 2 acceptance checkboxes others only one. Selecting all acceptance checkboxes in current phase disables edit button.
    const disableEdit = selectedPhase === 26 || selectedPhase === 28 ? cardValues[4] && cardValues[10] : cardValues[4] || cardValues[10]
    const invalidDate = moment(cardValues[9]).format('DD.MM.YYYY') === "Invalid date"
    editDataLink = 
    disableEdit
    ? 
    <div className='rolling-text'>
      <IconCheckCircle aria-hidden="true" />
      <span>{t('custom-card.already-confirmed')}</span>
    </div>
    :     
    <Button size='small' iconLeft={<IconPenLine />} onClick={() => dispatch(showTimetable(true))} variant="supplementary" theme="black" role="link">{buttonText}</Button> 

    boardFields = 
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{cardValues[11] ? t(cardValues[11]) : ""}</div>
      <div className='custom-card-date'><span className='date'>{invalidDate ? <span className='italic'>{cardValues[9]}</span> : moment(cardValues[9]).format('DD.MM.YYYY')}</span>{type === "Merkitse hyväksymispäivä" ? <>{invalidDate ? "" :<><span className='divider'>-</span><span className='status'> {t('custom-card.modified')}</span></>}</> : <><span className='divider'>-</span><span className='status'> {!cardValues[10] ? modifiedText : t('custom-card.confirmed')}</span></>}</div>
    </div>

    container =       
    cardValues[9] ?
      <div className='custom-card-container'>
        <div className='custom-card-item-container'>
          {boardFields}
        </div>
      </div>
      :
      ""

    container2 = 
    cardValues[0] || cardValues[1] ?
      <div className='custom-card-container'>
        <div className='custom-card-item-container'>
          {fields}
        </div>
      </div>
      :
      ""
  }
  if(type === "Tarkasta kerrosalatiedot"){
    buttonText = t('custom-card.modify-floor-area')
    heading = t('custom-card.check-floor-area')
    fields = <>  
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.living')}</div>
      <div className='custom-card-floor-info'><span>{cardValues[5]} {unit}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.office')}</div>
      <div className='custom-card-floor-info'><span>{cardValues[6]} {unit}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.public')}</div>
      <div className='custom-card-floor-info'><span>{cardValues[7]} {unit}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.other')}</div>
      <div className='custom-card-floor-info'><span>{cardValues[8]} {unit}</span></div>
    </div>
    </>
    editDataLink = <Button size='small' iconLeft={<IconPenLine />} onClick={() => dispatch(showFloorArea(true))} variant="supplementary" theme="black" role="link">{buttonText}</Button>
    container = 
    <div className='custom-card-container'>
      <div className='custom-card-item-container'>
        {fields}
      </div>
    </div> 
  }
  //Order is reverse in ehdotus phase
  return (
    getFieldsInOrder(cardValues[15],heading,container,container2,editDataLink)
  )
  

}

CustomCard.propTypes = {
  type: PropTypes.string,
  props: PropTypes.object,
  name: PropTypes.string,
  data: PropTypes.object,
  deadlines: PropTypes.object,
  placeholder: PropTypes.string,
  input: PropTypes.object,
  fieldData: PropTypes.object
}

export default CustomCard
