import React, { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { Select } from 'hds-react'
import { isArray } from 'lodash'

// Label when there are more than one same option. To avoid key errors.
const MORE_LABEL = ' (2)'
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
  const oldValueRef = useRef('');
  const [selectValues, setSelectValues] = useState('')

  useEffect(() => {
    oldValueRef.current = input.value;
    setSelectValues(input.value);
    return () => {

    };
  }, [])

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

  const currentOptions = []

  const modifyOptionIfExist = currentOption => {
    if (!currentOption) {
      return
    }

    // Check if the list already has same value
    if (
      currentOptions.some(current => current && current.label === currentOption.label)
    ) {
      currentOption.label = currentOption.label + MORE_LABEL
    }
    return currentOption
  }

  const handleBlur = () => {
    if (selectValues !== oldValueRef.current) {
      onBlur();
      oldValueRef.current = selectValues;
    }
  }

  options = options
    ? options.filter(option => option.label && option.label.trim() !== '')
    : []

  options.forEach(option => option && currentOptions.push(modifyOptionIfExist(option)))

  if (!multiple) {
    return (
      <Select
        placeholder={placeholder}
        className="selection"
        id={input.name}
        multiselect={false}
        error={inputUtils.hasError(error)}
        onBlur={handleBlur}
        clearable={true}
        disabled={disabled}
        options={currentOptions}
        value={currentSingleValue}
        onChange={data => {
          let returnValue = data ? data.value : null
          if (returnValue === '') {
            returnValue = null
          }
          setSelectValues(returnValue)
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
      onBlur={handleBlur}
      clearable={true}
      disabled={disabled}
      options={currentOptions}
      defaultValue={currentValue}
      onChange={data => {
        let returnValue = data && data.map(currentValue => currentValue.value)
        setSelectValues(returnValue)
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
