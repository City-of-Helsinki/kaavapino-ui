import React, { useCallback, useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput } from 'hds-react'
import { useSelector } from 'react-redux'
import {lockedSelector } from '../../selectors/projectSelector'

const CustomInput = ({ input, meta: { error }, ...custom }) => {
  const [readonly, setReadOnly] = useState({name:"",read:false})
  const lockedStatus = useSelector(state => lockedSelector(state))
  const oldValueRef = useRef('');

  useEffect(() => {
    oldValueRef.current = input.value;
    if(custom.type === "date"){
      setReadOnly({name:input.name,read:true})
    }
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
          setReadOnly({name:input.name,read:false})
          //Add changed value from db if there has been changes
          setValue(lockedStatus.lockData.attribute_lock.field_data)
          //Change styles from FormField
          custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
        }
        else{
          setReadOnly({name:input.name,read:true})
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

  const handleBlur = (event,readonly) => {
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
    if (typeof lockField === 'function') {
      //Send identifier data to change styles from FormField.js
      custom.lockField(false,false,identifier)
    }
    if (typeof custom.handleUnlockField === 'function') {
      //Sent a call to unlock field to backend
      custom.handleUnlockField(input.name)
    }
    if (event.target.value !== oldValueRef.current) {
      //prevent saving if locked
      if (!readonly) {
        //Sent call to save changes
        if (typeof custom.onBlur === 'function') {
          custom.onBlur();
          oldValueRef.current = event.target.value;
        }
      }
    }

    if(custom.type === "date"){
      setReadOnly({name:input.name,read:true})
    }
  }

  const setValue = (dbValue) => {
    if(dbValue && oldValueRef.current !== dbValue){
      input.onChange(dbValue, input.name)
    }
  }

  const handleInputChange = useCallback((event,readonly) => {
    if(!readonly || custom.type === "date"){
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
      onChange={(event) =>{handleInputChange(event,readonly.read)}}
      onBlur={(event) => {handleBlur(event,readonly.read)}}
      onFocus={handleFocus}
      readOnly={readonly.read}
    />
  )
}

CustomInput.propTypes = {
  input: PropTypes.object.isRequired
}

export default CustomInput