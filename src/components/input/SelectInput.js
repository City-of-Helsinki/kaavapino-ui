import React from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { Select } from 'hds-react'
import { isArray } from 'lodash'

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

  const getLabel = value => {
    const current = options && options.find(option => option.value === value)
    if (current && current.label && current.label !== ' ') {
      return current.label
    } else {
      return value
    }
  }
  let currentSingleValue

  if (multiple) {
    if (isArray(input && input.value)) {
      input.value.forEach(value =>
        currentValue.push({ label: getLabel(value), value: value })
      )
    } else {
      currentValue.push(input.value)
    }
  } else {
    const current = options && options.find(option => option.value === input.value)

    if (current) {
      currentSingleValue = {
        label: current && current.label,
        value: current && current.value
      }
    } else {
      currentSingleValue = {
        label: input.value,
        value: input.value
      }
    }
  }

  options = options
    ? options.filter(option => option.label && option.label.trim() !== '')
    : []

  if (!multiple) {
    return (
      <Select
        placeholder={placeholder}
        className="selection"
        id={input.name}
        name={input.name}
        multiselect={false}
        error={inputUtils.hasError(error)}
        onBlur={onBlur}
        clearable={true}
        disabled={disabled}
        options={options}
        value={currentSingleValue}
        onChange={data => {
          let returnValue = data ? data.value : null
          if (returnValue === '') {
            returnValue = null
          }
          input.onChange(returnValue)
        }}
      />
    )
  }
  return (
    <Select
      placeholder={placeholder}
      className="selection"
      id={input.name}
      name={input.name}
      multiselect={multiple}
      error={error}
      onBlur={onBlur}
      clearable={true}
      disabled={disabled}
      options={options}
      defaultValue={currentValue}
      onChange={data => {
        let returnValue = data && data.map(currentValue => currentValue.value)
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
