import React, { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { Select } from 'hds-react'
import { isArray } from 'lodash'

// Label when there are more than one same option. To avoid key errors.
const MORE_LABEL = ' (2)'
const SelectInput = ({
  isLocked,
  input,
  error,
  options,
  onBlur,
  placeholder,
  disabled,
  multiple,
  onFocus,
  handleUnlockField,
  onChange
}) => {
  const currentValue = []
  const oldValueRef = useRef('');
  const [selectValues, setSelectValues] = useState('')

  useEffect(() => {
    oldValueRef.current = input.value;
    setSelectValues(input.value);
    window.addEventListener('beforeunload', handleClose)
    return () => {
      window.removeEventListener('beforeunload', handleClose)
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

  const handleFocus = () => {
    onFocus(input.name);
  }

  const handleBlur = () => {
    handleUnlockField()
    if (selectValues !== oldValueRef.current) {
      //prevent saving if locked
      if (!isLocked) {
        onBlur();
        oldValueRef.current = selectValues;
      }
    }
  }

  const handleClose = () => {
    if (isLocked) {
      handleUnlockField()
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
        onFocus={handleFocus}
        clearable={true}
        disabled={disabled}
        options={currentOptions}
        value={currentSingleValue}
        onChange={data => {
          let returnValue = data ? data.value : null
          if (returnValue === '') {
            returnValue = null
          }
          let val = onChange(returnValue);
          if(val){
            setSelectValues(returnValue)
            input.onChange(returnValue)
          }
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
      onFocus={handleFocus}
      clearable={true}
      disabled={disabled}
      options={currentOptions}
      defaultValue={currentValue}
      onChange={data => {
        let returnValue = data && data.map(currentValue => currentValue.value)
        let val = onChange(returnValue);
        if(val){
          setSelectValues(returnValue)
          input.onChange(returnValue)
        }
      }}
    />
  )
}

SelectInput.propTypes = {
  input: PropTypes.object.isRequired,
  options: PropTypes.array.isRequired
}

export default SelectInput
