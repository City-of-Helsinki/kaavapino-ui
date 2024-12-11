import React, { useState, useEffect } from 'react'
import { RadioButton, Button, IconPlus } from 'hds-react'
import RollingInfo from '../input/RollingInfo'
import { useTranslation } from 'react-i18next'
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
  rollingInfoText,
  phaseIsClosed,
  isProjectTimetableEdit
}) => {
  const { t } = useTranslation()
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

  const getReadableValue = (value) => {
    if(value === false){
      return "Ei";
    }
    else if(value === true){
      return "Kyllä";
    }
    return "";
  }
  
  const getProjectTimetableEditElements = (value, handleOnChange, t) => {
    return !value ? 
      <Button variant="supplementary" className='add-content' iconLeft={<IconPlus />} onClick={() => handleOnChange(true)}>{t('deadlines.new-esillaolo')}</Button> 
      : 
      <Button size='small' variant="danger" className='remove-content' onClick={() => handleOnChange(false)}>{t('deadlines.delete-esillaolo')}</Button>
  }
  
  const getRadioButton = (testId, label, id, key, disabled, className, value, error, name, onChange, checked) => {
    return (
      <RadioButton
        data-testid={testId}
        key={key}
        id={id}
        label={label}
        disabled={disabled}
        className={className}
        value={value}
        error={error}
        name={name}
        onChange={onChange}
        checked={checked}
      />
    );
  }
  
  const getNormalElements = (nonEditable, rollingInfo, editField, name, readableValue, modifyText, rollingInfoText, editRollingField, phaseIsClosed, className, disabled, timeTableDisabled, error, handleOnChange, radioValue, double, showNoInformation) => {
    return nonEditable || rollingInfo && !editField ?
      <RollingInfo 
        name={name} 
        value={readableValue} 
        nonEditable={nonEditable}
        modifyText={modifyText}
        rollingInfoText={rollingInfoText}
        editRollingField={editRollingField}
        type={"radio"}
        phaseIsClosed={phaseIsClosed}
      />
      : 
      <div className={className}>
        {getRadioButton("radio1", "Kyllä", `${name}-true`, `${name}-true`, disabled || timeTableDisabled, `radio-button radio-button-true ${disabled || timeTableDisabled ? 'radio-button-disabled' : ''}`, "Kyllä", error, name, () => handleOnChange(true), radioValue === true)}
        {getRadioButton("radio2", "Ei", `${name}-false`, `${name}-false`, disabled || timeTableDisabled, `radio-button radio-button-false ${disabled || timeTableDisabled ? 'radio-button-disabled' : ''}`, "Ei", error, name, () => handleOnChange(false), radioValue === false)}
        {!double && showNoInformation && getRadioButton("radio3", "Tieto puuttuu", `${name}-null`, `${name}-null`, disabled || timeTableDisabled, `radio-button radio-button-null ${disabled || timeTableDisabled ? 'radio-button-disabled' : ''}`, "", error, name, () => handleOnChange(null), radioValue !== false && radioValue !== true)}
      </div>
  }
  
  const normalOrRollingElement = () => {
    const showNoInformation = autofillReadonly ? value === '' : true
    let elements
    let readableValue = getReadableValue(value);
    
    if(isProjectTimetableEdit){
      elements = getProjectTimetableEditElements(value, handleOnChange, t);
    }
    else{
      elements = getNormalElements(nonEditable, rollingInfo, editField, name, readableValue, modifyText, rollingInfoText, editRollingField, phaseIsClosed, className, disabled, timeTableDisabled, error, handleOnChange, radioValue, double, showNoInformation);
    }
    
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
