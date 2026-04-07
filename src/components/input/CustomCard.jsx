import React, {useEffect,useState} from 'react'
import PropTypes from 'prop-types'
import { useDispatch,useSelector } from 'react-redux';
import {Button,IconPenLine,IconCheckCircle } from 'hds-react'
import {showFloorArea, showTimetable} from '../../actions/projectActions'
import {attributeDataSelector,deadlinesSelector} from '../../selectors/projectSelector'
import { useTranslation } from 'react-i18next'
import infoFieldUtil from '../../utils/infoFieldUtil'
import moment from 'moment'
import { useFieldPassivation } from '../../hooks/useFieldPassivation'

const getDateStatus = (confirmed, modified, t) => {
  if (confirmed) return t('custom-card.confirmed');
  if (modified) return t('custom-card.modified');
  return t('custom-card.evaluation');
};

const buildBoardFieldsJSX = (type, cardData, startsText, t) => {
  const modifiedText = cardData.boardModified ? t('custom-card.modified') : t('custom-card.evaluation');
  const invalidDate = moment(cardData.boardDate).format('DD.MM.YYYY') === "Invalid date";
  const isSpecialApprovalType = type === "Merkitse hyväksymispäivä"
    || type === "Merkitse muutoksenhakua koskevat päivämäärät"
    || type === "Merkitse voimaantuloa koskevat päivämäärät";
  const isMuutoksenHakuType = type === "Merkitse muutoksenhakua koskevat päivämäärät"
    || type === "Merkitse voimaantuloa koskevat päivämäärät";
  const boardInfoText = isMuutoksenHakuType
    ? startsText
    : (cardData.boardText ? t(cardData.boardText) : "");
  const dateDisplay = invalidDate
    ? <span className='italic'>{cardData.boardDate}</span>
    : moment(cardData.boardDate).format('DD.MM.YYYY');
  const statusDisplay = isSpecialApprovalType
    ? <>{invalidDate ? "" : <><span className='divider'>-</span><span className='status'> {t('custom-card.modified')}</span></>}</>
    : <><span className='divider'>-</span><span className='status'> {!cardData.boardConfirmed ? modifiedText : t('custom-card.confirmed')}</span></>;
  return (
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{boardInfoText}</div>
      <div className='custom-card-date'>
        <span className='date'>{dateDisplay}</span>{statusDisplay}
      </div>
    </div>
  );
};

const buildDateContainers = (cardData, boardFields, fields, t) => {
  let container = cardData.boardDate
    ? <div className='custom-card-container'><div className='custom-card-item-container'>{boardFields}</div></div>
    : "";
  let container2 = (cardData.startDate || cardData.endDate)
    ? <div className='custom-card-container'><div className='custom-card-item-container'>{fields}</div></div>
    : "";
  if (!container && !container2) {
    container = (
      <div className='custom-card-container'>
        <div className='custom-card-item-container'>
          <div className='custom-card-info-container'>
            <div className='custom-card-info'>
              {t('custom-card.no-dates-set')}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return { container, container2 };
};

const buildDateCardContent = ({ type, cardData, props, showBoth, t, dispatch, matchedDeadline, name, selectedPhase, shouldDisableForErrors }) => {
  let startsText = props?.fieldData?.fieldset_attributes[0]?.label || "";
  let endsText = props?.fieldData?.fieldset_attributes[1]?.label || "";
  const buttonText = t('custom-card.modify-date');
  const heading = type === "Merkitse hyväksymispäivä" || type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät"
    ? props?.fieldData?.label
    : t('custom-card.check-date');
  if (showBoth) {
    startsText = cardData.startText ? t(cardData.startText) : "";
    endsText = cardData.endText ? t(cardData.endText) : "";
  }
  const startStatus = getDateStatus(cardData.confirmed, cardData.startModified, t);
  const endStatus = getDateStatus(cardData.confirmed, cardData.endModified, t);
  const fields = <>
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
  </>;
  let allConfirmed = !(
    (cardData.acceptanceDate) ||
    (cardData.startDate && !cardData.confirmed) ||
    (cardData.boardDate && !cardData.boardConfirmed)
  );
  if (!cardData.startDate && !cardData.endDate && !cardData.boardDate) {
    allConfirmed = false;
  }
  const editDataLink = allConfirmed
    ? <div className='rolling-text'><IconCheckCircle aria-hidden="true" /><span>{t('custom-card.already-confirmed')}</span></div>
    : <Button size='small' iconLeft={<IconPenLine />} onClick={() => dispatch(showTimetable(true, name, selectedPhase, matchedDeadline))} disabled={shouldDisableForErrors} variant="supplementary" theme="black" role="link">{buttonText}</Button>;
  const boardFields = buildBoardFieldsJSX(type, cardData, startsText, t);
  const { container, container2 } = buildDateContainers(cardData, boardFields, fields, t);
  return { buttonText, heading, fields, editDataLink, boardFields, container, container2 };
};

const buildFloorAreaContent = ({ cardData, t, dispatch, shouldDisableForErrors }) => {
  const buttonText = t('custom-card.modify-floor-area');
  const heading = t('custom-card.check-floor-area');
  const unit = "k-m²";
  const fields = <>
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
  </>;
  const editDataLink = <Button size='small' iconLeft={<IconPenLine />} onClick={() => dispatch(showFloorArea(true))} disabled={shouldDisableForErrors} variant="supplementary" theme="black" role="link">{buttonText}</Button>;
  const container = (
    <div className='custom-card-container'>
      <div className='custom-card-item-container'>
        {fields}
      </div>
    </div>
  );
  return { buttonText, heading, fields, editDataLink, container };
};

function CustomCard({type, props, name, data, deadlines, selectedPhase, showBoth, formName}) {
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
  
  // Check if other fields have errors - passivate card edit buttons
  const shouldDisableForErrors = useFieldPassivation(name, { formName })

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
  
  if(type === "Tarkasta esilläolopäivät" || type === "Merkitse hyväksymispäivä" || type === "Merkitse muutoksenhakua koskevat päivämäärät" || type === "Merkitse voimaantuloa koskevat päivämäärät"){
    ({buttonText, heading, fields, editDataLink, boardFields, container, container2} = buildDateCardContent({type, cardData, props, showBoth, t, dispatch, matchedDeadline, name, selectedPhase, shouldDisableForErrors}));
  }
  if(type === "Tarkasta kerrosalatiedot"){
    ({buttonText, heading, fields, editDataLink, container} = buildFloorAreaContent({cardData, t, dispatch, shouldDisableForErrors}));
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
  fieldData: PropTypes.object,
  selectedPhase: PropTypes.number,
  showBoth: PropTypes.bool,
  formName: PropTypes.string
}

export default CustomCard
