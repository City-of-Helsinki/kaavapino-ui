import React, { useState } from 'react'
import { ToggleButton } from 'hds-react'

const HDSToggleButton = ({
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
    <span className={'hds-toggle-input-container'}>
      <ToggleButton
        hideLabel={true}
        onBlur={custom.onBlur}
        error={error}
        name={name}
        onChange={onChange}
        checked={checked}
        id={custom.fieldData.name}
      />
      <label htmlFor={custom.fieldData.name}>{custom.fieldData.label}</label>
    </span>
  )
}

export default HDSToggleButton
