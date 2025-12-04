import React, { useState, useEffect } from 'react'
import { RadioButton, Button, IconPlus } from 'hds-react'
import RollingInfo from '../input/RollingInfo.jsx'
import NetworkErrorState from './NetworkErrorState.jsx'
import { useSelector } from 'react-redux'
import { savingSelector,lastModifiedSelector } from '../../selectors/projectSelector'
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
  const lastModified = useSelector(state => lastModifiedSelector(state))
  const [isThisFieldSaving, setIsThisFieldSaving] = useState(false)
  const saving =  useSelector(state => savingSelector(state))
  useEffect(() => {
    // Reset isThisFieldSaving when saving is complete for this field
    if (!saving) {
      setIsThisFieldSaving(false);
    }
  }, [saving, lastModified, name, isThisFieldSaving])
  
  const handleOnChange = (value) => {
    setRadioValue(value)
    rest.onChange(value)
    if (onRadioChange) {
      setIsThisFieldSaving(true);
      onRadioChange(name)
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
    const radioButtonClass = isThisFieldSaving ? 'radio-button-wrapper blurred' : `radio-button-wrapper ${className}`;
    const isDisabled = disabled || timeTableDisabled || isThisFieldSaving;
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
      <div className={radioButtonClass}>
        {getRadioButton("radio1", "Kyllä", `${name}-true`, `${name}-true`, isDisabled, `radio-button radio-button-true ${isDisabled ? 'radio-button-disabled' : ''}`, "Kyllä", error, name, () => handleOnChange(true), radioValue === true)}
        {getRadioButton("radio2", "Ei", `${name}-false`, `${name}-false`, isDisabled, `radio-button radio-button-false ${isDisabled ? 'radio-button-disabled' : ''}`, "Ei", error, name, () => handleOnChange(false), radioValue === false)}
        {!double && showNoInformation && getRadioButton("radio3", "Tieto puuttuu", `${name}-null`, `${name}-null`, isDisabled, `radio-button radio-button-null ${isDisabled ? 'radio-button-disabled' : ''}`, "", error, name, () => handleOnChange(null), radioValue !== false && radioValue !== true)}
        <NetworkErrorState fieldName={name} />
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
