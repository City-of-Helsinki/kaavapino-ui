import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { useTranslation } from 'react-i18next'
import { TextInput, DateInput, IconAlertCircle } from 'hds-react'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import timeUtil from '../../utils/timeUtil'
import { useSelector,useDispatch } from 'react-redux'
import { getFormValues } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
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
  deadlineSections,
  confirmedValue,
  sectionAttributes,
  allowedToEdit,
  timetable_editable
}) => {

  const dispatch = useDispatch();
  const { t } = useTranslation()
  const validated = useSelector(validatedSelector);
  const formValues = useSelector(getFormValues(EDIT_PROJECT_TIMETABLE_FORM))
  const [currentValue, setCurrentValue] = useState("")
  const [disabledState, setDisabledState] = useState(true)


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
    let inputValue = input.value
    if (autofillRule) {
      
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
    else if(input.name === "hyvaksymispaatos_pvm" && attributeData["hyvaksyminenvaihe_paattyy_pvm"]){
      attributeData["hyvaksyminenvaihe_paattyy_pvm"] = inputValue === '' ? attributeData["hyvaksyminenvaihe_paattyy_pvm"] : inputValue
    }

    setCurrentValue(currentDeadline ? currentDeadlineDate : inputValue )
    setDisabledState(typeof timeTableDisabled !== "undefined" ? timeTableDisabled : disabled)
  },[])

  useEffect(() => {
    //Update calendar values when value has changed
    if(currentValue !== input.value){
      setCurrentValue(input.value); 
    }
  }, [input.value,formValues])

  useEffect(() => {
    setDisabledState(formValues[confirmedValue])
  },[formValues[confirmedValue]])

  const getInitialMonth = (dateString) => {
    return dateString ? new Date(dateString) : new Date();
  }

  const formatDate = (date) => {
    const year = date.getFullYear();
    // Pad the month and day with leading zeros if needed
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  const getFixedSectionAttributes = () => {
    // Absurd hack because "Lausunnot viimeistään" is not included in sectionAttributes for some reason
    // Remove this and just use sectionAttributes if this gets refactored in the future
    if (!currentDeadline?.deadline?.attribute.includes("viimeistaan_lausunnot_ehdotuksesta")) {
      return sectionAttributes;
    }
    const ehdotus_section = deadlineSections.find(section => section.title === "Ehdotus");
    const grouped_section = ehdotus_section?.grouped_sections?.[0]?.attributes?.[currentDeadline?.deadline?.deadlinegroup]?.["Nähtäville"];
    const lausunnot_attr_section = grouped_section?.find((attr) => attr.label === "Lausunnot viimeistään");
    
    if (!lausunnot_attr_section) {
      return sectionAttributes;
    }
    const result = JSON.parse(JSON.stringify(sectionAttributes));
    result.push(lausunnot_attr_section);
    return result;
  }

  const isDisabledDate = (date) => {
    //20 years is the calendars range to check work days, holidays etc from current date
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    const twentyYearsLater = new Date();
    twentyYearsLater.setFullYear(twentyYearsLater.getFullYear() + 20);
    const ehdotusNahtavillaolo = currentDeadline?.deadline?.phase_name === "Ehdotus" && currentDeadline?.deadline?.deadlinegroup?.includes('nahtavillaolo')
    const datesToDisable = timeUtil.calculateDisabledDates(
      ehdotusNahtavillaolo, attributeData?.kaavaprosessin_kokoluokka, dateTypes, input.name, formValues,
      getFixedSectionAttributes(), currentDeadline
    );
    if (date < twentyYearsAgo || date > twentyYearsLater || !datesToDisable || datesToDisable.length === 0) {
      return false;
    }
    return !datesToDisable?.includes(formatDate(date));
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

  const formatDateToDMYYYY = (dateString) => {
    // Required by hds-DateInput
    if(typeof dateString !== 'object' && dateString?.includes('-')){
      const removeZero = (datePart) => datePart.startsWith('0') ? datePart.slice(1) : datePart;
      const dateParts = dateString.split("-");
      return `${removeZero(dateParts[2])}.${removeZero(dateParts[1])}.${dateParts[0]}`;
    } else {
      return dateString;
    }
  }

  const handleDateChange = (formattedDate) => {
    try {
      let field = input.name;
      setCurrentValue(formattedDate)
      dispatch(updateDateTimeline(field,formattedDate,formValues,false,deadlineSections));
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
          initialMonth={getInitialMonth(currentValue ? currentValue : input.value)}
          isDateDisabledBy={isDisabledDate}
          value={formatDateToDMYYYY(currentValue ? currentValue : input.value)}
          name={input.name}
          type='text' // type='date' works poorly with hds-DateInput
          disabled={!timetable_editable || disabledState}
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
      {editable && valueGenerated && !EDIT_PROJECT_TIMETABLE_FORM ? (
        <span className="deadline-estimated">{t('deadlines.estimated')}</span>
      ) : (
        ''
      )}
      {editable && hasError && !EDIT_PROJECT_TIMETABLE_FORM && (
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
  autofillRule: PropTypes.array,
  timeTableDisabled: PropTypes.bool,
  dateTypes: PropTypes.object,
  deadlineSection: PropTypes.object,
  maxMoveGroup: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  maxDateToMove: PropTypes.string,
  groupName: PropTypes.string,
  visGroups: PropTypes.array,
  visItems: PropTypes.array,
  deadlineSections: PropTypes.array,
  confirmedValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ]),
  sectionAttributes: PropTypes.array
}

export default DeadLineInput
