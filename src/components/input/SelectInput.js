import React from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { Select } from 'hds-react'

const SelectInput = ({
  input,
  error,
  options,
  onBlur,
  placeholder,
  disabled,
  multiple
}) => {
  const currentValue = []

  const getValue = value => {
    const current = options.find(option => option.value === value)
    return current && current.label
  }
  let currentSingleValue

  if (multiple) {
    input.value.forEach(value =>
      currentValue.push({ label: getValue(value), value: value })
    )
  } else {
    const current = options.find(option => option.value === input.value)
    currentSingleValue = {
      label: current && current.label,
      value: current && current.value
    }
  }

  return (
    <Select
      placeholder={placeholder}
      className="selection"
      id={input.name}
          name={input.name}
      multiselect={multiple}
      error={inputUtils.hasError(error)}
      onBlur={onBlur}
      clearable="true"
      disabled={disabled}
      defaultValue={multiple ? currentValue : currentSingleValue}
      options={options}
      onChange={data => {
        let returnValue
        if (multiple) {
          returnValue = data.map(currentValue => currentValue.value)
        } else {
          returnValue = data.value
        }

        if (returnValue === '') {
          returnValue = null
        }
        input.onChange(returnValue)
      }}
    />
  )
}

SelectInput.propTypes = {
  input: PropTypes.object.isRequired,
  options: PropTypes.array.isRequired
}

export default SelectInput
