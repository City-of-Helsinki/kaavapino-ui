import React, { useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { useTranslation } from 'react-i18next'
import { TextInput, DateInput, IconAlertCircle, Notification } from 'hds-react'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector } from 'react-redux'
import { getFormValues } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { useValidateDate } from '../../utils/dateUtils';

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
  dateTypes
}) => {

  const { t } = useTranslation()
  const validateDate = useValidateDate();
  const [warning, setWarning] = useState({warning:false,response:{reason:"",suggested_date:"",conflicting_deadline:""}})

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

  if(currentDeadline?.deadline?.attribute && attributeData[currentDeadline.deadline.attribute]){
    currentDeadlineDate = attributeData[currentDeadline.deadline.attribute]
  }
  else if(input.name === 'ehdotus_nahtaville_aineiston_maaraaika' && attributeData['ehdotus_kylk_aineiston_maaraaika']){
    inputValue = attributeData['ehdotus_kylk_aineiston_maaraaika']
  }
  else if (currentDeadline?.date) {
    currentDeadlineDate = currentDeadline.date
  }

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
    if(date?.includes('.')){
      const dateParts = date.split(".");
      const eventDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      const year = eventDate.getFullYear();
      const month = ("0" + (eventDate.getMonth() + 1)).slice(-2); // Months are 0-based, so add 1 and pad with 0 if necessary
      const day = ("0" + eventDate.getDate()).slice(-2); // Pad with 0 if necessary
      return `${year}-${month}-${day}`;
    } else {
      return date;
    }
  };

  const handleDateChange = async (formattedDate) => {
    try {
      const field = input.name;
      const projectName = attributeData['projektin_nimi'];
      let date = await validateDate(field, projectName, formattedDate, setWarning);
      if (date !== currentValue) {
        input.onChange(date);
        setCurrentValue(date);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return (
    <>
      <div className='deadline-input'>
        {type === 'date' 
        ?
        <DateInput
          readOnly
          language='fi'
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
        /> 
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
      {warning.warning && (
        <Notification label={warning.response.reason} type="alert" style={{marginTop: 'var(--spacing-s)'}}>
        Seuraavien päivämäärien siirtäminen ei ole mahdollista, koska minimietäisyys viereisiin etappeihin on täyttynyt.
        {warning.response.conflicting_deadline}. Asetettu seuraava kelvollinen päivä {warning.response.suggested_date}</Notification>
      )}
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
