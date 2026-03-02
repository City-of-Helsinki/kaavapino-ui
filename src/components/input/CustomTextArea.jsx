import React, { useCallback, useRef, useEffect } from 'react'
import { TextArea } from 'hds-react'
import { useFieldPassivation } from '../../hooks/useFieldPassivation';

const CustomTextArea = ({ input, meta: { error }, ...custom }) => {

  const shouldDisableForErrors = useFieldPassivation(input.name);
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
        disabled={shouldDisableForErrors || custom.disabled}
        onFocus={handleFocus}
        onChange={handleInputChange}
        onBlur={handleBlur}
        data-testid="text1"
      />
    </div>
  )
}

export default CustomTextArea