import React, { useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { useTranslation } from 'react-i18next'
import { TextInput, IconAlertCircle } from 'hds-react'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector } from 'react-redux'
import { getFormValues } from 'redux-form'
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
  autofillRule
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

  return (
    <div>
      <TextInput
        value={currentValue}
        name={input.name}
        type={type}
        disabled={disabled}
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
  input: PropTypes.object.isRequired
}

export default DeadLineInput
