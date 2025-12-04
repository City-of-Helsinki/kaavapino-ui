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
  const [cardData, setCardData] = useState(
    {
      startDate: "",
      endDate: "",
      startModified: false,
      endModified: false,
      confirmed: true,
      livingFloorArea: 0,
      officeFloorArea: 0,
      generalFloorArea: 0,
      otherFloorArea: 0,
      boardDate: "",
      boardConfirmed: false,
      boardModified: false,
      startText: "",
      endText: "",
      boardText: "",
      isSuggestionPhase: false,
    }
  );
  const [matchedDeadline, setMatchedDeadline] = useState({});
  const attributeData = useSelector(state => attributeDataSelector(state));
  const deadlinesData = useSelector(state => deadlinesSelector(state));


  useEffect(() => {
    setCardData({...cardData, ...infoFieldUtil.getInfoFieldData(props.placeholder,props.input?.name,attributeData,deadlinesData,selectedPhase)})
  }, [attributeData,deadlinesData]);

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

  const getEhdotusKeys = (data) => {
    return Object.keys(data).filter(
      key =>
        (key.includes('kaavaehdotus_uudelleen_nahtaville') && data[key] === true) ||
        (key.includes('kaavaehdotus_lautakuntaan') && data[key] === true)
    );
  }

  const getTarkistettuKeys = (data) => {
    return Object.keys(data).filter(
      key =>
        (key.includes('vahvista_kaavaehdotus_lautakunnassa') && data[key] === true)
    );
  }

  const getHighestKey = (keys, defaultKey) => {
    if (keys.length === 0) return defaultKey;
    return keys.reduce((a, b) => {
      const aValue = parseInt(a.split('_').pop());
      const bValue = parseInt(b.split('_').pop());
      return aValue > bValue ? a : b;
    }, defaultKey);
  }

  const buildDeadlineAttribute = (type, value) => {
    const suffix = value > 1 ? `_${value}` : '';
    if (type === 'iso') {
      return 'milloin_ehdotuksen_nahtavilla_alkaa_iso' + suffix;
    }
    if (type === 'pieni') {
      return 'milloin_ehdotuksen_nahtavilla_alkaa_pieni' + suffix;
    }
    return 'milloin_tarkistettu_ehdotus_lautakunnassa' + suffix;
  }

  const findMatchedDeadline = (data, deadlinesData, phase) => {
    const ehdotusPhase = [29, 21, 15, 9, 3].includes(phase);
    const keys = ehdotusPhase ? getEhdotusKeys(data) : getTarkistettuKeys(data);
    const defaultKey = ehdotusPhase ? 'kaavaehdotus_uudelleen_nahtaville' : 'vahvista_kaavaehdotus_lautakunnassa';
    const highestKey = getHighestKey(keys, defaultKey);
    const highestKeyValue = highestKey === defaultKey ? '' : highestKey.split('_').pop();

    let deadlineAttribute;
    if (ehdotusPhase) {
      deadlineAttribute = buildDeadlineAttribute(
        (phase === 29 || phase === 21) ? 'iso' : 'pieni',
        highestKeyValue
      );
    } else {
      deadlineAttribute = buildDeadlineAttribute('tarkistettu', highestKeyValue);
    }

    const matchedDeadline = deadlinesData.find(
      deadline => deadline.deadline.attribute === deadlineAttribute
    );
    return matchedDeadline?.deadline;
  }

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
  let modifiedText = cardData.boardModified ? t('custom-card.modified') : t('custom-card.evaluation')
  const unit = "k-m²"
  
  if(type === "Tarkasta esilläolopäivät" || type === "Merkitse hyväksymispäivä" || type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät"){
    let startsText = props?.fieldData?.fieldset_attributes[0]?.label || ""
    let endsText = props?.fieldData?.fieldset_attributes[1]?.label || ""
    buttonText = t('custom-card.modify-date')
    heading = type === "Merkitse hyväksymispäivä" || type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät" ? props?.fieldData?.label : t('custom-card.check-date')
    if(showBoth){
      startsText = cardData.startText ? t(cardData.startText) : ""
      endsText = cardData.endText ? t(cardData.endText) : ""
    }

    const startStatus = cardData.confirmed
      ? t('custom-card.confirmed')
      : cardData.startModified
        ? t('custom-card.modified')
        : t('custom-card.evaluation');

    const endStatus = cardData.confirmed
      ? t('custom-card.confirmed')
      : cardData.endModified
        ? t('custom-card.modified')
        : t('custom-card.evaluation');

    fields = <>  
      {cardData.startDate &&
        <div className='custom-card-info-container'>
          <div className='custom-card-info'>{startsText}</div>
          <div className='custom-card-date'>
            <span className='date'>{moment(cardData.startDate).format('DD.MM.YYYY')}</span>
            <span className='divider'>-</span>
            <span className='status'>{startStatus}</span>
          </div>
        </div>
      }
      {cardData.endDate &&
        <div className='custom-card-info-container'>
          <div className='custom-card-info'>{endsText}</div>
          <div className='custom-card-date'>
            <span className='date'>{moment(cardData.endDate).format('DD.MM.YYYY')}</span>
            <span className='divider'>-</span>
            <span className='status'>{endStatus}</span>
          </div>
        </div>
      }
    </>

    const allConfirmed = !(
      (cardData.startDate && !cardData.confirmed) ||
      (cardData.boardDate && !cardData.boardConfirmed)
    );
    const invalidDate = moment(cardData.boardDate).format('DD.MM.YYYY') === "Invalid date"

    editDataLink = 
    allConfirmed
    ? 
    <div className='rolling-text'>
      <IconCheckCircle aria-hidden="true" />
      <span>{t('custom-card.already-confirmed')}</span>
    </div>
    :     
    <Button size='small' iconLeft={<IconPenLine />} onClick={() => dispatch(showTimetable(true,name,selectedPhase,matchedDeadline))} variant="supplementary" theme="black" role="link">{buttonText}</Button> 

    boardFields = 
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät" ? startsText : cardData.boardText ? t(cardData.boardText) : ""}</div>
      <div className='custom-card-date'>
        <span className='date'>{invalidDate ? <span className='italic'>{cardData.boardDate}</span> : moment(cardData.boardDate).format('DD.MM.YYYY')}</span>{type === "Merkitse hyväksymispäivä" || type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät" ? <>{invalidDate ? "" :<><span className='divider'>-</span><span className='status'> {t('custom-card.modified')}</span></>}</> : <><span className='divider'>-</span><span className='status'> {!cardData.boardConfirmed ? modifiedText : t('custom-card.confirmed')}</span></>}
      </div>
    </div>

    container =       
    cardData.boardDate ?
      <div className='custom-card-container'>
        <div className='custom-card-item-container'>
          {boardFields}
        </div>
      </div>
      :
      ""

    container2 = 
    cardData.startDate || cardData.endDate ?
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
      <div className='custom-card-floor-info'><span>{cardData.livingFloorArea} {unit}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.office')}</div>
      <div className='custom-card-floor-info'><span>{cardData.officeFloorArea} {unit}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.public')}</div>
      <div className='custom-card-floor-info'><span>{cardData.generalFloorArea} {unit}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.other')}</div>
      <div className='custom-card-floor-info'><span>{cardData.otherFloorArea} {unit}</span></div>
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
    getFieldsInOrder(cardData.isSuggestionPhase,heading,container,container2,editDataLink)
  )
  

}

CustomCard.propTypes = {
  type: PropTypes.string,
  props: PropTypes.object,
  name: PropTypes.string,
  data: PropTypes.object,
  deadlines: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  placeholder: PropTypes.string,
  input: PropTypes.object,
  fieldData: PropTypes.object
}

export default CustomCard
