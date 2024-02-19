import React, { useState, useEffect } from 'react'
import { getFormValues } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector } from 'react-redux'
import { Checkbox } from 'hds-react'

const CustomCheckbox = ({
  input: { name, value, onChange },
  meta: { error },
  autofillRule,
  label,
  className,
  disabled,
  updated,
  formName,
  display
}) => {
  const formValues = useSelector(getFormValues(formName ? formName : EDIT_PROJECT_TIMETABLE_FORM))
  let checkboxDisabled
  if(name === "kaavaluonnos_lautakuntaan_1" || name === "periaatteet_lautakuntaan_1"){
    checkboxDisabled = disabled
  }
  else{
    checkboxDisabled = autofillRule || disabled
  }
  const [checked, setChecked] = useState()

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
 
  const onChangeSave = () => {
    onChange(!checked)
    setChecked( !checked )
  }
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

export default CustomCheckbox
