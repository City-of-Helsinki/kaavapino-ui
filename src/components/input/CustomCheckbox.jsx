import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { getFormValues } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector } from 'react-redux'
import { Checkbox,Button,Notification } from 'hds-react'
import { useTranslation } from 'react-i18next'
import { useFieldPassivation } from '../../hooks/useFieldPassivation';

const CustomCheckbox = ({
  input: { name, value, onChange },
  meta,
  autofillRule,
  label,
  className,
  disabled,
  lautakuntaInPast,
  tooltip,
  updated,
  formName,
  display,
  isProjectTimetableEdit,
  isAdmin
}) => {
  const { t } = useTranslation()
  const shouldDisableForErrors = useFieldPassivation(name, { formName: meta.form })
  const formValues = useSelector(getFormValues(formName || EDIT_PROJECT_TIMETABLE_FORM))
  const checkboxDisabled = autofillRule || disabled || shouldDisableForErrors
  const [checked, setChecked] = useState()

  useEffect(() => {
    if(value === ""){
      //If project is just created the value is empty string, set to autofill value which is either true or false
      const inputValue = getFieldAutofillValue(autofillRule, formValues, name)
      onChange( inputValue )
      setChecked( inputValue )
    }
  },[])


  useEffect(() => {
    let inputValue = value
    if (autofillRule) {
      inputValue = getFieldAutofillValue(autofillRule, formValues, name)
      if ( display === 'readonly_checkbox') {
        onChange( inputValue )
      }
    }
    setChecked( inputValue )
  }, [value])
 
  const toggleCheckbox = () => {
    setChecked(!checked)
    onChange(!checked)
  }

  const getConfirmationNotification = () => {
    return checked ? (
      <div className='deadlines-col'>
        <Notification
          className='deadlines-confirmed-notification'
          size="small"
          label="Päivämäärä vahvistettu"
          type="success"
          headingLevel={3}
        >
          {t('deadlines.dates-confirmed')}
        </Notification>
      </div>
    ) : (
      <Notification
        className='deadlines-preliminary-notification'
        size="small"
        label="Aikataulutiedot ovat alustavia"
        type="info"
        headingLevel={3}
      >
        {t('deadlines.dates-are-preliminary')}
      </Notification>
    );
  }

  const getConfirmationButton = () => {
    const className = checked ? 'deadlines-cancel-button' : 'deadlines-confirm-button';
    const variant = checked ? "danger" : "primary";
    const buttonText = checked ? t('deadlines.cancel-confirmation') : t('deadlines.confirm-dates');
    const isDisabled = checked ? (checkboxDisabled || lautakuntaInPast) : checkboxDisabled;
    const buttonStyle = isDisabled ? { opacity: 1, pointerEvents: 'auto', cursor: 'pointer' } : {};
    return (
      <div className='deadlines-col' style={{ position: 'relative', display: 'inline-block' }}>
        <Button
          className={className}
          size='small'
          variant={variant}
          onClick={toggleCheckbox}
          disabled={isDisabled}
          style={buttonStyle}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : 0}
        >
          {buttonText}
        </Button>
        {isDisabled && tooltip && (
          <div className="custom-tooltip">{tooltip}</div>
        )}
      </div>
    );
  }

 if (isProjectTimetableEdit) {
    return (
      <>
        { getConfirmationNotification() }
        {isAdmin && display !== 'readonly_checkbox' && getConfirmationButton()}
      </>
    );
  } else{
    return (
      <Checkbox
        aria-label={name}
        disabled={checkboxDisabled}
        label={label}
        updated={updated}
        error={meta.error}
        name={name}
        id={name}
        checked={checked}
        className={className}
        onChange={toggleCheckbox}
      />
    )
  }
}

CustomCheckbox.propTypes = {
  input: PropTypes.shape({
    name: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    onChange: PropTypes.func,
  }),
  meta: PropTypes.shape({
    error: PropTypes.string,
    form: PropTypes.string,
  }),
  autofillRule: PropTypes.array,
  label: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  updated: PropTypes.object,
  formName: PropTypes.string,
  display: PropTypes.string,
  isProjectTimetableEdit: PropTypes.bool,
  lautakuntaInPast: PropTypes.bool,
  tooltip: PropTypes.string,
  isAdmin: PropTypes.bool,
};

export default CustomCheckbox
