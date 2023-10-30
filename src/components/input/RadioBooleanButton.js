import React, { useState, useEffect } from 'react'
import { RadioButton } from 'hds-react'
import RollingInfo from '../input/RollingInfo'
import PropTypes from 'prop-types';

const RadioBooleanButton = ({
  input: { value, name, ...rest },
  meta: { error },
  double,
  onRadioChange,
  disabled,
  className,
  autofillReadonly,
  timeTableDisabled,
  nonEditable, 
  rollingInfo, 
  modifyText, 
  rollingInfoText
}) => {
  const [radioValue, setRadioValue] = useState(null)
  const [editField,setEditField] = useState(false)

  const handleOnChange = value => {
    setRadioValue(value)
    rest.onChange(value)
    if (onRadioChange) {
      onRadioChange()
    }
    if(rollingInfo){
      setEditField(false)
    }
  }

  useEffect(() => {
    setRadioValue(value)
  }, [value])

  const editRollingField = () => {
    setEditField(true)
  }

  const normalOrRollingElement = () => {
    const showNoInformation = autofillReadonly ? value === '' : true
    //Render rolling info field or normal edit field
    //If clicking rolling field button makes positive lock check then show normal editable field
    //Rolling field can be nonEditable
    let readableValue = ""
    if(value === false){
      readableValue = "Ei"
    }
    else if(value === true){
      readableValue = "Kyllä"
    }

    const elements = nonEditable || rollingInfo && !editField ?
      <RollingInfo 
        name={name} 
        value={readableValue} 
        nonEditable={nonEditable}
        modifyText={modifyText}
        rollingInfoText={rollingInfoText}
        editRollingField={editRollingField}
      />
      : 
      <div className={className}>
        <RadioButton
          data-testid="radio1"
          key={`${name}-true`}
          id={`${name}-true`}
          label="Kyllä"
          disabled={disabled || timeTableDisabled}
          className={`radio-button radio-button-true ${disabled || timeTableDisabled ? 'radio-button-disabled' : ''}`}
          value="Kyllä"
          error={error}
          name={name}
          onChange={() => handleOnChange(true)}
          checked={radioValue === true}
        />
        <RadioButton
          data-testid="radio2"
          label="Ei"
          id={`${name}-false`}
          key={`${name}-false`}
          disabled={disabled || timeTableDisabled}
          className={`radio-button radio-button-false ${disabled || timeTableDisabled ? 'radio-button-disabled' : ''}`}
          error={error}
          value="Ei"
          name={name}
          onChange={() => handleOnChange(false)}
          checked={radioValue === false}
        />
        {!double && showNoInformation && (
          <RadioButton
            data-testid="radio3"
            key={`${name}-null`}
            id={`${name}-null`}
            label="Tieto puuttuu"
            disabled={disabled || timeTableDisabled}
            className={`radio-button radio-button-null ${disabled || timeTableDisabled ? 'radio-button-disabled' : ''}`}
            value=""
            error={error}
            name={name}
            onChange={() => handleOnChange(null)}
            checked={radioValue !== false && radioValue !== true}
          />
        )}
      </div>
    
    return elements
  }

  return (
    normalOrRollingElement()
  )
}

RadioBooleanButton.propTypes = {
  timeTableDisabled: PropTypes.bool
}

export default RadioBooleanButton
