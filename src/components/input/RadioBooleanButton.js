import React, { useState, useEffect } from 'react'
import { RadioButton } from 'hds-react'

const RadioBooleanButton = ({
  input: { value, name, ...rest },
  meta: { error },
  double,
  onRadioChange,
  disabled,
  className,
  autofillReadonly
}) => {
  const [radioValue, setRadioValue] = useState(null)

  const handleOnChange = value => {
    setRadioValue(value)
    rest.onChange(value)
    if (onRadioChange) {
      onRadioChange()
    }
  }

  useEffect(() => {
    setRadioValue(value)
  }, [value])


  const showNoInformation = autofillReadonly ? value === '' : true
   
  return (
    <div className={className}>
      <RadioButton
        key={`${name}-true`}
        id={`${name}-true`}
        label="Kyllä"
        disabled={disabled}
        className={`radio-button radio-button-true ${disabled ? 'radio-button-disabled' : ''}`}
        value="Kyllä"
        error={error}
        name={name}
        onChange={() => handleOnChange(true)}
        checked={radioValue === true}
      />
      <RadioButton
        label="Ei"
        id={`${name}-false`}
        key={`${name}-false`}
        disabled={disabled}
        className={`radio-button radio-button-false ${disabled ? 'radio-button-disabled' : ''}`}
        error={error}
        value="Ei"
        name={name}
        onChange={() => handleOnChange(false)}
        checked={radioValue === false}
      />
      {!double && showNoInformation && (
        <RadioButton
          key={`${name}-null`}
          id={`${name}-null`}
          label="Tieto puuttuu"
          disabled={disabled}
          className={`radio-button radio-button-null ${disabled ? 'radio-button-disabled' : ''}`}
          value=""
          error={error}
          name={name}
          onChange={() => handleOnChange(null)}
          checked={radioValue !== false && radioValue !== true}
        />
      )}
    </div>
  )
}

export default RadioBooleanButton
