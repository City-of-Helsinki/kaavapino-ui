import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { getFormValues } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector } from 'react-redux'
import { Checkbox,Button,Notification } from 'hds-react'
import { useTranslation } from 'react-i18next'

const CustomCheckbox = ({
  input: { name, value, onChange },
  meta: { error },
  autofillRule,
  label,
  className,
  disabled,
  updated,
  formName,
  display,
  isProjectTimetableEdit,
  isAdmin
}) => {
  const { t } = useTranslation()
  const formValues = useSelector(getFormValues(formName ? formName : EDIT_PROJECT_TIMETABLE_FORM))
  const notDisabledBoxes = name === "kaavaluonnos_lautakuntaan_1" || name === "periaatteet_lautakuntaan_1" 
  || name === "jarjestetaan_periaatteet_esillaolo_1" || name === "jarjestetaan_luonnos_esillaolo_1"
  let checkboxDisabled

  if(notDisabledBoxes){
    checkboxDisabled = disabled
  }
  else{
    checkboxDisabled = autofillRule || disabled
  }
  const [checked, setChecked] = useState()

  useEffect(() => {

    let inputValue = value
    if(notDisabledBoxes){
      //If project is just created the value is empty string, set to autofill value which is either true or false
      //Otherwise don't do nothing
      if(inputValue === ""){
        inputValue = getFieldAutofillValue(autofillRule, formValues, name)
        onChange( inputValue )
        setChecked( inputValue )
      }
    }
  },[]) 

  useEffect(() => {

    let inputValue = value

    if (!notDisabledBoxes && autofillRule) {
      inputValue = getFieldAutofillValue(autofillRule, formValues, name)
      if ( display === 'readonly_checkbox') {
        onChange( inputValue )
      }
    }

    setChecked( inputValue )
  }, [value])
 
  const onChangeSave = () => {
    setChecked( !checked )
    onChange(!checked)
  }

  if(isProjectTimetableEdit){
    //Only users with admin role can confirm the dates
    if(isAdmin && !checkboxDisabled){
      return (
        <>
          {checked 
          ? 
          <>
            <div className='deadlines-col'>
              <Notification className='deadlines-confirmed-notification' size="small" label="Päivämäärä vahvistettu" type="success" >{t('deadlines.dates-confirmed')}</Notification>
            </div>
            {display !== 'readonly_checkbox' &&
            <div className='deadlines-col'>
              <Button className='deadlines-cancel-button' size='small' variant="danger" onClick={onChangeSave}>
                {t('deadlines.cancel-confirmation')}
              </Button>
            </div>
            }
          </> 
          :
          <>
            <Notification className='deadlines-preliminary-notification' size="small" label="Aikataulutiedot ovat alustavia" type="info">
              {t('deadlines.dates-are-preliminary')}
            </Notification>
            {display !== 'readonly_checkbox' &&
            <Button className='deadlines-confirm-button' size='small' onClick={onChangeSave}>
              {t('deadlines.confirm-dates')}
            </Button>
            }
          </>
          }
        </>
      )
    }
  }
  else{
    return (
      <Checkbox
        aria-label={name}
        disabled={checkboxDisabled}
        label={label}
        updated={updated}
        error={error}
        name={name}
        id={name}
        checked={checked}
        className={className}
        onChange={onChangeSave}
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
  }),
  autofillRule: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  updated: PropTypes.object,
  formName: PropTypes.string,
  display: PropTypes.string,
  isProjectTimetableEdit: PropTypes.bool
};

export default CustomCheckbox
