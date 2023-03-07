import React, {useCallback,useRef, useEffect} from 'react'
import { TextArea } from 'hds-react'

const CustomTextArea = ({ input, meta: { error }, ...custom }) => {

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
    <div className="textarea-wrapper">
      <TextArea 
      {...input} 
      {...custom} 
      error={error} 
      onChange={handleInputChange}
      onBlur={handleBlur}
      />
    </div>
  )
}

export default CustomTextArea