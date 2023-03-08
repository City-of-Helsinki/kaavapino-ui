import React, {useCallback,useRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput } from 'hds-react'

const CustomInput = ({ input, meta: { error }, ...custom }) => {

  const oldValueRef = useRef('');

  useEffect(() => {
    oldValueRef.current = input.value;
  }, [])

  const handleFocus = () => {
    custom.onFocus();
  }

  const handleBlur = (event) =>{
    if(event.target.value !== oldValueRef.current){
      custom.onBlur();
      oldValueRef.current = event.target.value;
    }
 }

  const handleInputChange = useCallback((event) => {
   input.onChange(event, input.name);

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
    />
  )
}

CustomInput.propTypes = {
  input: PropTypes.object.isRequired
}

export default CustomInput