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
    window.addEventListener('beforeunload', handleClose)
    oldValueRef.current = input.value;
    return () => {
      window.removeEventListener('beforeunload', handleClose)
    };
  }, [])

  useEffect(() => {
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      if(lockedStatus.lock === false){
        let identifier;
        if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
          identifier = lockedStatus.lockData.attribute_lock.field_identifier;
        }
        else{
          identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
        }

        const lock = input.name === identifier
        if(lock && lockedStatus.lockData.attribute_lock.owner){
          setReadOnly(false)
          custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
        }
        else{
          setReadOnly(true)
          custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
        }
      }
    }
  }, [lockedStatus]);

  const handleFocus = () => {
    if (typeof custom.onFocus === 'function') {
      custom.onFocus(input.name);
    }
  }

  const handleBlur = (event) => {
    let identifier;
    if(lockedStatus){
      if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
        identifier = lockedStatus.lockData.attribute_lock.field_identifier;
      }
      else{
        identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
      }
    }
    custom.lockField(false,false,identifier)
    if (typeof custom.handleUnlockField === 'function') {
      custom.handleUnlockField(input.name)
    }
    if (event.target.value !== oldValueRef.current) {
      //prevent saving if locked
      if (!readonly) {
        custom.onBlur();
        oldValueRef.current = event.target.value;
      }
    }
  }

  const handleInputChange = useCallback((event) => {
    if(!readonly){
      input.onChange(event.target.value, input.name)
    }
  }, [input.name, input.value]);

  const handleClose = () => {
    if (!readonly) {
      custom.handleUnlockField(input.name)
    }
  }

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