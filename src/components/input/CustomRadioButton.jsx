import React, { useState } from 'react'
import { Checkbox } from 'hds-react'
import PropTypes from 'prop-types'

const RadioButton = ({
  input: { value, name, ...rest },
  meta: { error },
  options,
  disabled
}) => {

  const [checked, setChecked] = useState(value ? value : false)

  return (
    <span className="checkbox">
      {options.map((option, i) => (
        <Checkbox
          key={i}
          id={i}
          label={option.label}
          error={error}
          name={name}
          onChange={() => {
            rest.onChange(option.value)
            setChecked(option.value)
          }}
          checked={option.value === checked}
          className="checkbox-item"
          disabled={disabled}
        ></Checkbox>
      ))}
    </span>
  )
}

RadioButton.propTypes = {
  input: PropTypes.object,
  meta: PropTypes.object,
  options: PropTypes.array,
  disabled: PropTypes.bool,
}

export default RadioButton
