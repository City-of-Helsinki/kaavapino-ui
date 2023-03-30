import React, { useCallback, useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput } from 'hds-react'

const CustomInput = ({ input, meta: { error }, ...custom }) => {
  const oldValueRef = useRef('');
  const [readonly, setReadOnly] = useState(false)

  useEffect(() => {
    window.addEventListener('beforeunload', handleClose)
    oldValueRef.current = input.value;
    return () => {
      window.removeEventListener('beforeunload', handleClose)
    };
  }, [])

  const handleFocus = () => {
    if (typeof custom.onFocus === 'function') {
      custom.onFocus(input.name);
    }
  }

  const handleBlur = (event) => {
    if (typeof custom.handleUnlockField === 'function') {
      custom.handleUnlockField(input.name)
    }
    if (event.target.value !== oldValueRef.current) {
      //prevent saving if locked
      if (custom.isLockedOwner) {
        custom.onBlur();
        oldValueRef.current = event.target.value;
      }
    }
  }

  const handleInputChange = useCallback((event) => {
    //Check from parent is it okay to edit or is someone else editing
    //return false if not ok to edit and sets input readonly
    let val = custom.onChange(event.target.value);
    if (val || val === "") {
      setReadOnly(false)
      input.onChange(val, input.name)
    }
    else {
      setReadOnly(true)
    }
  }, [input.name, input.value]);

  const handleClose = () => {
    if (custom.isLockedOwner) {
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