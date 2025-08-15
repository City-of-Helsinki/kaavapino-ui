import React, { useState } from 'react'
import { ToggleButton as HDSToggleButton } from 'hds-react'

const ToggleButton = ({
  input: { value, name, ...rest },
  meta: { error },
  ...custom
}) => {
  const [checked, setChecked] = useState(!!value)

  const onChange = (newValue) => {
    setChecked(!newValue)
    rest.onChange(!newValue)
  }
  return (
    <div className="radio-input-container">
      <HDSToggleButton
        id={name}
        checked={checked}
        label={custom.label}
        onChange={onChange}
        onBlur={custom.onBlur}
        name={name}
        aria-invalid={!!error}
      />
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default ToggleButton
