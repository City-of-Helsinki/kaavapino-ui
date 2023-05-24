import React, { useCallback, useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput } from 'hds-react'
import { useSelector } from 'react-redux'
import {lockedSelector } from '../../selectors/projectSelector'

const CustomInput = ({ input, meta: { error }, ...custom }) => {
  const lockedStatus = useSelector(state => lockedSelector(state))
  const oldValueRef = useRef('');
  const [readonly, setReadOnly] = useState(false)

  useEffect(() => {
    oldValueRef.current = input.value;
    return () => {

    };
  }, [])

  useEffect(() => {
    //Chekcs that locked status has more data then inital empty object
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
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
          if(lockedStatus.lockData.attribute_lock.field_data && oldValueRef.current !== lockedStatus.lockData.attribute_lock.field_data){
            setValue(lockedStatus.lockData.attribute_lock.field_data)
          }
          //Change styles from FormField
          custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
        }
        else{
          setReadOnly(true)
          //Change styles from FormField
          custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
        }
      }
    }
  }, [lockedStatus]);

  const handleFocus = () => {
    if (typeof custom.onFocus === 'function') {
      //Sent a call to lock field to backend
      custom.onFocus(input.name);
    }
  }

  const handleBlur = (event) => {
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
    //Send identifier data to change styles from FormField.js
    custom.lockField(false,false,identifier)
    if (typeof custom.handleUnlockField === 'function') {
      //Sent a call to unlock field to backend
      custom.handleUnlockField(input.name)
    }
    if (event.target.value !== oldValueRef.current) {
      //prevent saving if locked
      if (!readonly) {
        //Sent call to save changes
        custom.onBlur();
        oldValueRef.current = event.target.value;
      }
    }
  }

  const setValue = (dbValue) => {
    input.onChange(dbValue, input.name)
  }

  const handleInputChange = useCallback((event) => {
    if(!readonly){
      input.onChange(event.target.value, input.name)
    }
  }, [input.name, input.value]);

  return (
    <TextInput
      className="text-input"
      aria-label={input.name}
      error={inputUtils.hasError(error).toString()}
      fluid="true"
      {...input}
      {...custom}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      readOnly={readonly}
    />
  )
}

CustomInput.propTypes = {
  input: PropTypes.object.isRequired
}

export default CustomInput