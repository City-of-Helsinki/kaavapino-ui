import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { useTranslation } from 'react-i18next'
import { TextInput, DateInput, IconAlertCircle } from 'hds-react'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import textUtil from '../../utils/textUtil'
import timeUtil from '../../utils/timeUtil'
import objectUtil from '../../utils/objectUtil'
import { useSelector,useDispatch } from 'react-redux'
import { getFormValues } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
//import { useValidateDate } from '../../utils/dateUtils';
import { updateDateTimeline } from '../../actions/projectActions';
import { validatedSelector } from '../../selectors/projectSelector';

const DeadLineInput = ({
  input,
  error,
  attributeData,
  currentDeadline,
  editable,
  type,
  disabled,
  placeholder,
  className,
  autofillRule,
  timeTableDisabled,
  dateTypes,
  deadlineSection,
  maxMoveGroup,
  maxDateToMove,
  groupName
}) => {

  const { t } = useTranslation()
  //const validateDate = useValidateDate();
  //const [warning, setWarning] = useState({warning:false,response:{reason:"",suggested_date:"",conflicting_deadline:""}})
  const validated = useSelector(validatedSelector);
  //const dateValidationResult = useSelector(dateValidationResultSelector);
  const dispatch = useDispatch();

  let inputValue = input.value
  if (autofillRule) {
    const formValues = useSelector(getFormValues(EDIT_PROJECT_TIMETABLE_FORM))
    
    if (autofillRule && autofillRule.length > 0) {
      inputValue = getFieldAutofillValue(
        autofillRule,
        formValues,
        input.name,
        EDIT_PROJECT_TIMETABLE_FORM
      )
    }
  }

  if ( inputValue === null ) {
    inputValue = ''
  }
  let currentDeadlineDate = ''
  const index = input.name.match(/\d+/);
  const indexString = index ? "_"+index[0] : '';

  if(currentDeadline?.deadline?.attribute && attributeData[currentDeadline.deadline.attribute]){
    currentDeadlineDate = attributeData[currentDeadline.deadline.attribute]
  }
  else if(input.name === 'luonnosaineiston_maaraaika'+indexString && attributeData['kaavaluonnos_kylk_aineiston_maaraaika'+indexString]){
    inputValue = attributeData['kaavaluonnos_kylk_aineiston_maaraaika'+indexString]
  }
  else if (currentDeadline?.date) {
    currentDeadlineDate = currentDeadline.date
  }

/*   useEffect(() => {
    if(dateValidationResult?.result?.date && input.name === dateValidationResult?.result?.identifier){
      const validValue = dateValidationResult?.result?.suggested_date ? dateValidationResult?.result?.suggested_date : dateValidationResult?.result?.date;
      setCurrentValue(validValue);
      //update redux formValues and re render
      dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, input.name, validValue));
    }
  }, [dateValidationResult]) */

  const [currentValue, setCurrentValue] = useState(
    currentDeadline ? currentDeadlineDate : inputValue 
  )
  let currentError
  const generated = currentDeadline && currentDeadline.generated

  const [valueGenerated, setValueGenerated] = useState(generated)

  if (currentDeadline && currentDeadline.is_under_min_distance_previous) {
    currentError = t('messages.min-distance')

    if (
      currentDeadline.deadline &&
      currentDeadline.deadline.error_min_distance_previous
    ) {
      currentError = currentDeadline.deadline.error_min_distance_previous
    }
  }
  if (currentDeadline && currentDeadline.is_under_min_distance_next) {
    currentError = t('messages.max-distance')

    if (currentDeadline.deadline && currentDeadline.warning_min_distance_next) {
      currentError = currentDeadline.warning_min_distance_next
    }
  }

  let currentClassName =
    generated && valueGenerated && editable
      ? `${className} deadline-estimated`
      : className

  const hasError =
    editable && (inputUtils.hasError(error) || inputUtils.hasError(currentError))
  if (hasError) {
    currentClassName = `${currentClassName} error-border`
  }

  useEffect(() => {
    //TODO add all other values to in useEffect so no spam render
    //Update when calendar is updated and UPDATE_DATE_TIMELINE logic happens
    setCurrentValue(input.value); 
  }, [attributeData])

  const getInitialMonth = (dateString) => {
    let date;
    if (dateString) {
        date = new Date(dateString);
    } else {
        date = new Date(); // Use current date if no date string is provided
    }
    return date;
  }

  const formatDate = (date) => {
    const year = date.getFullYear();
    // Pad the month and day with leading zeros if needed
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  const isDisabledDate = (date) => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const tenYearsLater = new Date();
    tenYearsLater.setFullYear(tenYearsLater.getFullYear() + 10);
    const ehdotusNahtavillaolo = currentDeadline?.deadline?.phase_name === "Ehdotus" && currentDeadline?.deadline?.deadlinegroup?.includes('nahtavillaolo')
    let datesToDisable
    if (ehdotusNahtavillaolo) {
      if (attributeData?.kaavaprosessin_kokoluokka === 'L' || attributeData?.kaavaprosessin_kokoluokka === 'XL') {
        datesToDisable = !dateTypes?.arkipäivät?.dates?.includes(formatDate(date));
      } else if (currentDeadline?.deadline?.attribute?.includes('maaraaika')) {
        datesToDisable = !dateTypes?.työpäivät?.dates?.includes(formatDate(date));
      } else {
        datesToDisable = !dateTypes?.arkipäivät?.dates?.includes(formatDate(date));
      }
    }
    else {
      let dateType;
      if (currentDeadline?.deadline?.deadlinegroup?.includes('esillaolo')) {
        dateType = currentDeadline?.deadline?.attribute?.includes('maaraaika') ? 'työpäivät' : 'esilläolopäivät';
        if(groupName !== maxMoveGroup && input.name.includes("_maaraaika")){
          //Disable maaraika dates when editing it from calendar when group IS NOT THE LAST ONE OF PHASE possible group of phase.
          //Disable to max next date taking inconsideration the lenghts of start and end dates before next phase
          //and min to next possible phase minium. If maaraaika is in lastly added group then it's date can be editet freely.
          const splitInputName = input.name.split("_");
          const firstElements = splitInputName.slice(0, 2); // Get the first two elements
          const dynamicKey = Object.keys(deadlineSection.deadlineSection)[0];
          const deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey]
          const endingKeyName = objectUtil.findValuesWithStrings(deadlineSectionValues,firstElements[0],firstElements[1],"_alkaa","milloin")
          const distanceTo = endingKeyName?.distance_from_previous + endingKeyName?.distance_to_next
          const lastPossibleDateToSelect = timeUtil.subtractDays("esilläolo",maxDateToMove,distanceTo,dateTypes?.[dateType]?.dates,true)
          let newDisabledDates = dateTypes?.[dateType]?.dates
          if(currentDeadline?.deadline?.phase_name === "Periaatteet"){
            //Add check to previous phase end date + minium length
            const dataToCompate = attributeData["kaynnistys_paattyy_pvm"]
            const minEndDate = timeUtil.addDays("esilläolo",dataToCompate,5,dateTypes?.[dateType]?.dates,true)
            newDisabledDates = newDisabledDates.filter(date => date >= minEndDate)
          }
          if(currentDeadline?.deadline?.phase_name === "Luonnos"){
            const attributeValue = objectUtil.findLargestSuffix(attributeData,/^milloin_oas_esillaolo_paattyy(?:_(\d+))?/)
            if(attributeData){
              const minEndDate = timeUtil.addDays("esilläolo",attributeValue,5,dateTypes?.[dateType]?.dates,true)
              newDisabledDates = newDisabledDates.filter(date => date >= minEndDate)
            }
          }
          newDisabledDates = newDisabledDates.filter(date => date <= lastPossibleDateToSelect);
          return !newDisabledDates.includes(formatDate(date));
        }
        if(input.name.includes("_alkaa") || input.name.includes("_paattyy")){
          //Disable dates when editing dates from calendar start and end and min start date and max end date
          const endingDateKey = textUtil.replacePattern(input.name,"_alkaa","_paattyy")
          const dynamicKey = Object.keys(deadlineSection.deadlineSection)[0];
          const deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey]
          const distanceTo = input.name.includes("_paattyy") ? deadlineSectionValues.find(({ name }) => name === input.name).distance_from_previous : deadlineSectionValues.find(({ name }) => name === input.name).distance_to_next
          let newDisabledDates = dateTypes?.[dateType]?.dates
          const lastPossibleDateToSelect = timeUtil.subtractDays("esilläolo",attributeData[endingDateKey],distanceTo,dateTypes?.[dateType]?.dates,true)
          newDisabledDates = input.name.includes("_paattyy") ? newDisabledDates.filter(date => date >= lastPossibleDateToSelect) : newDisabledDates.filter(date => date <= lastPossibleDateToSelect);
          return !newDisabledDates.includes(formatDate(date));
        }
      } else if (currentDeadline?.deadline?.deadlinegroup?.includes('lautakunta')) {
        dateType = currentDeadline?.deadline?.attribute?.includes('maaraaika') ? 'työpäivät' : 'lautakunnan_kokouspäivät';
      } else {
        dateType = 'arkipäivät';
      }
    
      datesToDisable = !dateTypes?.[dateType]?.dates?.includes(formatDate(date));
    }

    if (date < tenYearsAgo || date > tenYearsLater) {
      return false;
    }
  
    const day = date.getDay();

    return day === 0 || day === 6 || datesToDisable;
  }
  
  const formatDateToYYYYMMDD = (date) => {
    if(typeof date !== 'object' && date?.includes('.')){
      const dateParts = date.split(".");
      const eventDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      const year = eventDate.getFullYear();
      const month = ("0" + (eventDate.getMonth() + 1)).slice(-2); // Months are 0-based, so add 1 and pad with 0 if necessary
      const day = ("0" + eventDate.getDate()).slice(-2); // Pad with 0 if necessary
      return `${year}-${month}-${day}`;
    }
     else {
      return date;
    }
  };

  const handleDateChange = (formattedDate) => {
    try {
      const field = input.name;
      //const projectName = attributeData['projektin_nimi'];
      //Get date type objects and send them to reducer to be moved according to input date changed
      const dynamicKey = Object.keys(deadlineSection.deadlineSection)[0];
      const deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey].filter(section => section.type === "date");
      dispatch(updateDateTimeline(field,formattedDate,deadlineSectionValues));
      //let date = validateDate(field, projectName, formattedDate, setWarning);
      //if (date !== currentValue) {
      //input.onChange(formattedDate);
      //setCurrentValue(formattedDate);
      //}
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return (
    <>
      <div className='deadline-input'>
        {type === 'date' ?
        !validated ?
        <DateInput
          readOnly
          language='fi'
          initialMonth={getInitialMonth(currentValue)}
          isDateDisabledBy={isDisabledDate}
          value={formatDateToYYYYMMDD(currentValue)}
          name={input.name}
          type={type}
          disabled={typeof timeTableDisabled !== "undefined" ? timeTableDisabled : disabled}
          placeholder={placeholder}
          error={error}
          aria-label={input.name}
          onChange={(event) => {
            let formattedDate
            const dateString = event;
            if (dateString.includes('.')) {
              formattedDate = formatDateToYYYYMMDD(dateString);
            } else {
              formattedDate = dateString;
            }
            handleDateChange(formattedDate);
          }}
          className={currentClassName}
          onBlur={() => {
            if (input.value !== input.defaultValue) {
              setValueGenerated(false)
            } else {
              setValueGenerated(true)
            }
          }}
        /> : "Ladataan..."
        :
          <TextInput
            value={currentValue}
            name={input.name}
            type={type}
            disabled={typeof timeTableDisabled !== "undefined" ? timeTableDisabled : disabled}
            placeholder={placeholder}
            error={error}
            aria-label={input.name}
            onChange={event => {
              const value = event.target.value
              setCurrentValue(value)
              input.onChange(value)
            }}
            className={currentClassName}
            onBlur={() => {
              if (input.value !== input.defaultValue) {
                setValueGenerated(false)
              } else {
                setValueGenerated(true)
              }
            }}
          />
        }
      </div>
      {editable && valueGenerated ? (
        <span className="deadline-estimated">{t('deadlines.estimated')}</span>
      ) : (
        ''
      )}
      {editable && hasError && (
        <div className="error-text">
          <IconAlertCircle size="xs" /> {currentError}{' '}
        </div>
      )}
{/*       {warning.warning && (
        <Notification label={warning.response.reason} type="alert" style={{marginTop: 'var(--spacing-s)'}}>
        Seuraavien päivämäärien siirtäminen ei ole mahdollista, koska minimietäisyys viereisiin etappeihin on täyttynyt.
        {warning.response.conflicting_deadline}. Asetettu seuraava kelvollinen päivä {warning.response.suggested_date}</Notification>
      )} */}
    </>
  )
}

DeadLineInput.propTypes = {
  input: PropTypes.object.isRequired,
  error: PropTypes.string,
  attributeData: PropTypes.object,
  currentDeadline: PropTypes.object,
  editable: PropTypes.bool,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  autofillRule: PropTypes.string,
  timeTableDisabled: PropTypes.bool
}

export default DeadLineInput
