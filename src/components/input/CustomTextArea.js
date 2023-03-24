import React, { useCallback, useRef, useEffect } from 'react'
import { TextArea } from 'hds-react'

const CustomTextArea = ({ input, meta: { error }, ...custom }) => {

  const oldValueRef = useRef('');

  useEffect(() => {
    oldValueRef.current = input.value;
    window.addEventListener('beforeunload', handleClose)
    return () => {
      window.removeEventListener('beforeunload', handleClose)
    };
  }, [])

  const handleInputChange = useCallback((event) => {
      input.onChange(event.target.value, input.name)
  }, [input.name, input.value]);

  const handleFocus = () => {
    custom.onFocus(input.name);
  }

  const handleBlur = (event) => {
    custom.handleUnlockField()
    if (event.target.value !== oldValueRef.current) {
      if (!custom.isLocked) {
        custom.onBlur();
        oldValueRef.current = event.target.value;
      }
    }
  }

  const handleClose = () => {
    if (custom.isLocked) {
      custom.handleUnlockField()
    }
  }

  return (
    <div className="textarea-wrapper">
      <TextArea
        {...input}
        {...custom}
        error={error}
        onFocus={handleFocus}
        onChange={handleInputChange}
        onBlur={handleBlur}
      />
    </div>
  )
}

export default CustomTextArea