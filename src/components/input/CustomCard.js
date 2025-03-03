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
  const [matchedDeadline, setMatchedDeadline] = useState({});
  const attributeData = useSelector(state => attributeDataSelector(state))
  const deadlinesData = useSelector(state => deadlinesSelector(state))

  useEffect(() => {
    setCardValues(infoFieldUtil.getInfoFieldData(type,name,data,deadlines,selectedPhase))
  }, [])

  useEffect(() => {
    setCardValues(infoFieldUtil.getInfoFieldData(props.placeholder,props.input?.name,attributeData,deadlinesData,selectedPhase))
  }, [attributeData,deadlinesData])

  useEffect(() => {
    if (type !== "Tarkasta kerrosalatiedot" && props?.fieldData?.fieldset_attributes[0]?.related_fields) {
      const phasesToCheck = [29, 21, 15, 9, 3, 30, 22, 16, 10, 4] //Ehdotus and Tarkistettu ehdotus phases
      if(phasesToCheck.includes(selectedPhase)){
        //Props for ehdotus and tarkistettu ehdotus does not contain the needed information so it needs to be fetch differently
        const matchedDeadline = findMatchedDeadline(data, deadlinesData,selectedPhase);
        setMatchedDeadline(matchedDeadline);
      }
      else{
        for (let x = 0; x < deadlinesData.length; x++) {
          if (props.fieldData.fieldset_attributes[0].related_fields.some(field => deadlinesData[x]?.deadline?.attribute === field)) {
            setMatchedDeadline(deadlinesData[x]?.deadline);
            break;
          }
          else if((props?.fieldData?.name === "merkitse_voimaantulo_paivamaarat_fieldset" || props?.fieldData?.name === "merkitse_muutoksenhaku_paivamaarat_fieldset") && deadlinesData[x]?.deadline?.attribute === "voimaantulo_pvm"){
            setMatchedDeadline(deadlinesData[x]?.deadline);
            break;
          }
        }
      }
    }
  }, [type, props, deadlinesData]);

  const findMatchedDeadline = (data, deadlinesData,phase) => {
    const ehdotusPhase = [29, 21, 15, 9, 3].includes(phase) ? true : false;
    //find matched deadline for ehdotus and tarkistettu ehdotus
    const keys = Object.keys(data).filter(key => ehdotusPhase ? key.includes('kaavaehdotus_uudelleen_nahtaville') || key.includes('kaavaehdotus_lautakuntaan') && data[key] === true : key.includes('vahvista_kaavaehdotus_lautakunnassa') && data[key] === true);

    let highestKeyValue
    let deadlineAttribute
    let highestKey

    if(ehdotusPhase){
      if(phase === 29 || phase === 21){
        highestKey = keys.length > 0 ? keys.reduce((a, b) => parseInt(a.split('_').pop()) > parseInt(b.split('_').pop()) ? a : b) : 'kaavaehdotus_lautakuntaan';
        highestKeyValue = highestKey === 'kaavaehdotus_lautakuntaan' ? '' : highestKey.split('_').pop();
        deadlineAttribute = `milloin_kaavaehdotus_lautakunnassa${highestKeyValue > 1 ? `_${highestKeyValue}` : ''}`;
      }
      else{
        highestKey = keys.length > 0 ? keys.reduce((a, b) => parseInt(a.split('_').pop()) > parseInt(b.split('_').pop()) ? a : b) : 'kaavaehdotus_uudelleen_nahtaville';
        highestKeyValue = highestKey === 'kaavaehdotus_uudelleen_nahtaville' ? '' : highestKey.split('_').pop();
        deadlineAttribute = `milloin_ehdotuksen_nahtavilla_alkaa_pieni${highestKeyValue > 1 ? `_${highestKeyValue}` : ''}`;
      }
    }
    else{
      highestKey = keys.length > 0 ? keys.reduce((a, b) => parseInt(a.split('_').pop()) > parseInt(b.split('_').pop()) ? a : b) : 'vahvista_kaavaehdotus_lautakunnassa';
      highestKeyValue = highestKey === 'vahvista_kaavaehdotus_lautakunnassa' ? '' : highestKey.split('_').pop();
      deadlineAttribute = `milloin_tarkistettu_ehdotus_lautakunnassa${highestKeyValue > 1 ? `_${highestKeyValue}` : ''}`;
    }
    const matchedDeadline = deadlinesData.find(deadline => deadline.deadline.attribute === deadlineAttribute);

    return matchedDeadline?.deadline;
  };

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
  
  if(type === "Tarkasta esilläolopäivät" || type === "Merkitse hyväksymispäivä" || type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät"){
    let startsText = props?.fieldData?.fieldset_attributes[0]?.label || ""
    let endsText = props?.fieldData?.fieldset_attributes[1]?.label || ""
    buttonText = t('custom-card.modify-date')
    heading = type === "Merkitse hyväksymispäivä" || type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät" ? props?.fieldData?.label : t('custom-card.check-date')
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
    <Button size='small' iconLeft={<IconPenLine />} onClick={() => dispatch(showTimetable(true,name,selectedPhase,matchedDeadline))} variant="supplementary" theme="black" role="link">{buttonText}</Button> 

    boardFields = 
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät" ? startsText : cardValues[11] ? t(cardValues[11]) : ""}</div>
      <div className='custom-card-date'>
        <span className='date'>{invalidDate ? <span className='italic'>{cardValues[9]}</span> : moment(cardValues[9]).format('DD.MM.YYYY')}</span>{type === "Merkitse hyväksymispäivä" || type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät" ? <>{invalidDate ? "" :<><span className='divider'>-</span><span className='status'> {t('custom-card.modified')}</span></>}</> : <><span className='divider'>-</span><span className='status'> {!cardValues[10] ? modifiedText : t('custom-card.confirmed')}</span></>}
      </div>
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
