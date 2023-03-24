import React, { useCallback, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput } from 'hds-react'

const CustomInput = ({ input, meta: { error }, ...custom }) => {
  const oldValueRef = useRef('');

  useEffect(() => {
    window.addEventListener('beforeunload', handleClose)
    oldValueRef.current = input.value;
    return () => {
      window.removeEventListener('beforeunload', handleClose)
    };
  }, [])

  const handleFocus = () => {
    custom.onFocus(input.name);
  }

  const handleBlur = (event) => {
    custom.handleUnlockField(input.name)
    if (event.target.value !== oldValueRef.current) {
      //prevent saving if locked
      if (!custom.isLocked) {
        custom.onBlur();
        oldValueRef.current = event.target.value;
      }
    }
  }

  const handleInputChange = useCallback((event) => {
      let val = custom.onChange(event.target.value);
      if(val){
        input.onChange(val,input.name)
      }
  }, [input.name, input.value]);

  const handleClose = () => {
    if (custom.isLocked) {
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
    />
  )
}

CustomInput.propTypes = {
  input: PropTypes.object.isRequired
}

export default CustomInput