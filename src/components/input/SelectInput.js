import React, { useRef, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { Select } from 'hds-react'
import { isArray } from 'lodash'
import { useSelector } from 'react-redux'
import {lockedSelector } from '../../selectors/projectSelector'

// Label when there are more than one same option. To avoid key errors.
const MORE_LABEL = ' (2)'
const SelectInput = ({
  input,
  error,
  lockField,
  options,
  onFocus,
  onBlur,
  placeholder,
  disabled,
  multiple,
  handleUnlockField,
  insideFieldset
}) => {
  const currentValue = []
  const oldValueRef = useRef('');
  const [selectValues, setSelectValues] = useState('')
  const lockedStatus = useSelector(state => lockedSelector(state))
  const [readonly, setReadOnly] = useState(false)
  const [fieldName, setFieldName] = useState("")
  const currentOptions = []
  useEffect(() => {
    //Chekcs that locked status has more data then inital empty object
    if(!insideFieldset && lockedStatus && Object.keys(lockedStatus).length > 0){
      if(lockedStatus.lock === false){
        let identifier;
        //Field is fieldset field and has different type of identifier
        //else is normal field
        if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
          identifier = lockedStatus.lockData.attribute_lock.field_identifier;
        }
        else{
          identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
        }
        const lock = input.name === identifier
        //Check if locked field name matches with instance and that owner is true to allow edit
        //else someone else is editing and prevent editing
        if(lock && lockedStatus.lockData.attribute_lock.owner){
          setReadOnly(false)
          //Add changed value from db if there has been changes
          setSelectValue(lockedStatus.lockData.attribute_lock.field_data)
          //Change styles from FormField
          lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
        }
        else{
          setReadOnly(true)
          setFieldName(identifier)
          //Change styles from FormField
          lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
        }
      }
    }
    else if(insideFieldset && lockedStatus && Object.keys(lockedStatus).length > 0){
      //Fieldsets lock happends on Fieldset.js
      //Get most recent data for all fields inside fieldset when accordian is clicked and whole fieldset is locked.
      if(lockedStatus.lock === false){
        let identifier;
        let name = input.name;
        if(name){
          //Get index of fieldset
          name = name.split('.')[0]
        }
        //Field is fieldset field and has different type of identifier
        //else is normal field
        if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
          identifier = lockedStatus.lockData.attribute_lock.field_identifier;
        }
        else{
          identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
        }
        //Compares which index not which field
        const lock = name === identifier
        if(lock){
          let fieldData
          let field = input.name
          const fieldSetFields = lockedStatus.lockData.attribute_lock.field_data

          if(field){
            //Get single field
            field = field.split('.')[1]
          }

          for (const [key, value] of Object.entries(fieldSetFields)) {
            if(key === field){
              //If field is this instance of component then set value for it from db
              fieldData = value
            }
          }

          setSelectValue(fieldData)
          lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
          setReadOnly(false)
        }
        else{
          lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
          setReadOnly(false)
        }
      }
    }
  }, [lockedStatus]);

  useEffect(() => {
    oldValueRef.current = input.value;
    setSelectValues(input.value);
    return () => {

    };
  }, [])

  const getLabel = value => {
    const current = options && options.find(option => option.value === value)
    if (current && current.label && current.label !== ' ') {
      return current.label
    } else {
      return value
    }
  }
  let currentSingleValue

  if(!readonly){
    if (multiple) {
      if (isArray(input && input.value)) {
        input.value.forEach(value =>
          currentValue.push({ label: getLabel(value), value: value })
        )
      } else {
        currentValue.push(input.value)
      }
    } else {
      const current = options && options.find(option => option.value === input.value)
  
      if (current) {
        currentSingleValue = {
          label: current && current.label,
          value: current && current.value
        }
      } else {
        currentSingleValue = {
          label: input.value,
          value: input.value
        }
      }
    }
  }

  const modifyOptionIfExist = currentOption => {
    if (!currentOption) {
      return
    }

    // Check if the list already has same value
    if (
      currentOptions.some(current => current && current.label === currentOption.label)
    ) {
      currentOption.label = currentOption.label + MORE_LABEL
    }
    return currentOption
  }

  const handleFocus = () => {
    if (typeof onFocus === 'function' && !insideFieldset) {
      //Sent a call to lock field to backend
      onFocus(input.name);
    }
  }

  const handleBlur = () => {
    let identifier;
    //Chekcs that locked status has more data then inital empty object
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      //Field is fieldset field and has different type of identifier
      //else is normal field
      if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
        identifier = lockedStatus.lockData.attribute_lock.field_identifier;
      }
      else{
        identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
      }
    }
    //Check lockfield if component is used somewhere where locking is not used.
    if (typeof lockField === 'function' && !insideFieldset) {
      //Send identifier data to change styles from FormField.js
      lockField(false,false,identifier)
    }
    
    if (typeof handleUnlockField === 'function' && !insideFieldset) {
      //Sent a call to unlock field to backend
      handleUnlockField(input.name)
    }
    if (selectValues !== oldValueRef.current) {
      //prevent saving if locked
      if (!readonly) {
        if (typeof onBlur === 'function') {
          //Sent call to save changes
          onBlur();
          oldValueRef.current = selectValues;
        }
      }
    }
    setFieldName("")
  }

  const setSelectValue = (dbValue) => {
    if(oldValueRef.current !== dbValue){
      input.onChange(dbValue, input.name)
    }
  }

  const handleInputChange = useCallback((val) => {
    if(!readonly){
      input.onChange(val, input.name)
    }
  }, [input.name, input.value]);

  if(!readonly){
    options = options
    ? options.filter(option => option.label && option.label.trim() !== '')
    : []

    options.forEach(option => option && currentOptions.push(modifyOptionIfExist(option)))
  }

  let notSelectable = readonly === true && fieldName === input.name
  let readOnlyStyle = notSelectable ? 'selection readonly' : 'selection'
  if (!multiple) {
    return (
      <Select
        data-testid="select-single"
        placeholder={placeholder}
        className={readOnlyStyle}
        id={input.name}
        multiselect={false}
        error={inputUtils.hasError(error)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        clearable={true}
        disabled={disabled}
        options={currentOptions}
        value={currentSingleValue}
        onChange={data => {
          if(!notSelectable){
            let returnValue = data ? data.value : null
            if (returnValue === '') {
              returnValue = null
            }
            setSelectValues(returnValue)
            handleInputChange(returnValue)
          }
        }}
      />
    )
  }
  return (
    <Select
      data-testid="select-multi"
      placeholder={placeholder}
      className={readOnlyStyle}
      id={input.name}
      name={input.name}
      multiselect={multiple}
      error={error}
      onBlur={handleBlur}
      onFocus={handleFocus}
      clearable={true}
      disabled={disabled}
      options={currentOptions}
      defaultValue={currentValue}
      onChange={data => {
        if(!notSelectable){
          let returnValue = data && data.map(currentValue => currentValue.value)
          setSelectValues(returnValue)
          handleInputChange(returnValue)
        }
      }}
    />
  )
}

SelectInput.propTypes = {
  input: PropTypes.object.isRequired,
  options: PropTypes.array.isRequired
}

export default SelectInput
