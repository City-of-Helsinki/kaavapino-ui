import React, {useCallback,useRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput } from 'hds-react'

const CustomInput = ({ input, meta: { error }, ...custom }) => {

  const oldValueRef = useRef('');

  useEffect(() => {
    oldValueRef.current = input.value;
  }, [])

  const handleInputChange = useCallback((event) => {
   input.onChange(event, input.name);

   }, [input.name, input.value]);

   const handleBlur = (event) =>{
      if(event.target.value !== oldValueRef.current){
        custom.onBlur();
        oldValueRef.current = event.target.value;
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
    />
  )
}

CustomInput.propTypes = {
  input: PropTypes.object.isRequired
}

export default CustomInput