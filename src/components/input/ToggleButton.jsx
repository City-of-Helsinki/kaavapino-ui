import React, { useState } from 'react'
import { Radio } from 'semantic-ui-react'

const ToggleButton = ({
  input: { value, name, ...rest },
  meta: { error },
  ...custom
}) => {
  const [checked, setChecked ] = useState(value ? true : false)

  const onChange = () => {
    setChecked( !checked )
    rest.onChange( !checked )
  }
  return (
    <div className={'radio-input-container'}>
      <Radio
        toggle
        label={custom.label}
        placeholder={custom.placeholder}
        onBlur={custom.onBlur}
        error={error}
        name={name}
        onChange={onChange}
        checked={checked}
      />
    </div>
  )
}

export default ToggleButton
