import React, { useCallback, useRef, useEffect } from 'react'
import { TextArea } from 'hds-react'

const CustomTextArea = ({ input, meta: { error }, ...custom }) => {

  const oldValueRef = useRef('');

  useEffect(() => {
    oldValueRef.current = input.value;
    return () => {
    };
  }, [])

  const handleInputChange = useCallback((event) => {
    input.onChange(event, input.name);
  }, [input.name, input.value]);

  const handleFocus = () => {
    custom.onFocus(input.name);
  }

  const handleBlur = (event) => {
    custom.handleUnlockField()
    if (event.target.value !== oldValueRef.current) {
        custom.onBlur();
        oldValueRef.current = event.target.value;
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
        data-testid="text1"
      />
    </div>
  )
}

export default CustomTextArea