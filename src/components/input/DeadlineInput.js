import React, { useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { useTranslation } from 'react-i18next'
import { TextInput, DateInput, IconAlertCircle } from 'hds-react'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector } from 'react-redux'
import { getFormValues } from 'redux-form'
import moment from 'moment'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'

const DeadLineInput = ({
  input,
  error,
  currentDeadline,
  editable,
  type,
  disabled,
  placeholder,
  className,
  autofillRule,
  timeTableDisabled
}) => {
  
  const { t } = useTranslation()
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

  if ( currentDeadline && currentDeadline.date ) [
    currentDeadlineDate = currentDeadline.date
  ]

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

  const isWeekend = (date) => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const tenYearsLater = new Date();
    tenYearsLater.setFullYear(tenYearsLater.getFullYear() + 10);
  
    if (date < tenYearsAgo || date > tenYearsLater) {
      return false;
    }
  
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  return (
    <div className='deadline-input'>
      {type === 'date' 
      ?
       <DateInput
       readOnly
       isDateDisabledBy={isWeekend}
        value={moment(currentValue).format("YYYY-MM-DD")}
        name={input.name}
        type={type}
        disabled={typeof timeTableDisabled !== "undefined" ? timeTableDisabled : disabled}
        placeholder={placeholder}
        error={error}
        aria-label={input.name}
        onChange={event => {
          const value = moment(event, "yyyy-MM-dd");
          if(value){
            setCurrentValue(value)
            input.onChange(value)
          }
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
          //onKeyDown={(e) => e.preventDefault()}
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
    </div>
  )
}

DeadLineInput.propTypes = {
  input: PropTypes.object.isRequired,
  timeTableDisabled: PropTypes.bool
}

export default DeadLineInput
