import React, { useCallback, useRef, useEffect, useState } from 'react'
import { TextArea } from 'hds-react'

const CustomTextArea = ({ input, meta: { error }, ...custom }) => {

  const oldValueRef = useRef('');
  //Replace with props returned from store
  const [lockStyle, setLockStyle] = useState(false);

  useEffect(() => {
    oldValueRef.current = input.value;
    window.addEventListener('beforeunload', handleClose)
    return () => {
      window.removeEventListener('beforeunload', handleClose)
    };
  }, [])

  const handleInputChange = useCallback((event) => {
    input.onChange(event, input.name);

  }, [input.name, input.value]);

  const handleFocus = () => {
    console.log(input)
    console.log(custom)
    setLockStyle(true)
    custom.onFocus(input.name);
  }

  const handleBlur = (event) => {
    //Add logic to call handleUnlockField if closing browser or tab when in input
    setLockStyle(false)
    custom.handleUnlockField()
    if (event.target.value !== oldValueRef.current) {
      custom.onBlur();
      oldValueRef.current = event.target.value;
    }
  }

  const handleClose = () => {
    if(lockStyle){
      setLockStyle(false)
      custom.handleUnlockField()
    }
   }

  return (
    <div className="textarea-wrapper">
      <TextArea
        style={lockStyle ? { border: '1px solid red' } : { border: '' }}
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