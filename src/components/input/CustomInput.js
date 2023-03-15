import React, {useCallback,useRef, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput } from 'hds-react'

const CustomInput = ({ input, meta: { error }, ...custom }) => {

  const oldValueRef = useRef('');
  //Replace with props returned from store
  const [lockStyle, setLockStyle] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeunload', handleClose)
    oldValueRef.current = input.value;
    return () => {
      window.removeEventListener('beforeunload', handleClose)
    };
  }, [])

  const handleFocus = () => {
    console.log(input)
    console.log(custom)
    setLockStyle(true)
    custom.onFocus(input.name);
  }

  const handleBlur = (event) =>{
    console.log("handleblur")
    //Add logic to call handleUnlockField if closing browser or tab when in input
    setLockStyle(false)
    custom.handleUnlockField()
    if(event.target.value !== oldValueRef.current){
      custom.onBlur();
      oldValueRef.current = event.target.value;
    }
 }

  const handleInputChange = useCallback((event) => {
   input.onChange(event, input.name);

   }, [input.name, input.value]);

   const handleClose = () => {
    if(lockStyle){
      setLockStyle(false)
      custom.handleUnlockField()
    }
   }

  return (
    <TextInput
      className="text-input"
      style={lockStyle ? {backgroundColor:'blue'} : {backgroundColor:''} }
      aria-label={input.name}
      error={inputUtils.hasError(error).toString()}
      fluid="true"
      {...input}
      {...custom}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      //add disabled or readonly according to locked props and if you are not the user who locked
      //readOnly={lockStyle ? "false" : "true" }
    />
  )
}

CustomInput.propTypes = {
  input: PropTypes.object.isRequired
}

export default CustomInput