import React, { useState } from 'react'
import { Checkbox } from 'hds-react'

const OnHoldCheckbox = ({
  name,
  error,
  projectOnhold,
  disabled,
  saveProjectBase,
  label
}) => {
  const [checked, setChecked] = useState(projectOnhold)
  const onChangeSave = () => {
    setChecked(!checked)
    saveProjectBase(!checked)
  }

  return (
    <Checkbox
      label={label}
      error={error}
      name={name}
      id={name}
      onChange={onChangeSave}
      checked={checked}
      disabled={disabled}
    />
  )
}

export default OnHoldCheckbox
