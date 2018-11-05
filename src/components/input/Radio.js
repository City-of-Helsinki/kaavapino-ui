import React from 'react'
import { Radio } from 'semantic-ui-react'

const CustomRadio = ({ input: { value, name, ...rest }, ...custom }) => {
  let checked = 'n'
  if (value === '' || value === null) {
    checked = '-'
  } else if (value) {
    checked = 'y'
  }
  return (
    <div className='radio-input-container'>
      <Radio
        label='Kyllä'
        { ...custom }
        name={name}
        onChange={() => rest.onChange(true)}
        checked={ checked === 'y' }
      />
      <Radio
        label='Ei'
        { ...custom }
        name={name}
        onChange={() => rest.onChange(false)}
        checked={ checked === 'n' }
      />
      <Radio
        label='Tieto puuttuu'
        { ...custom }
        name={name}
        onChange={() => rest.onChange(null)}
        checked={ checked === '-' }
      />
    </div>
  )
}

export default CustomRadio