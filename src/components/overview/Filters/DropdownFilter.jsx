import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Select } from 'hds-react'
import './styles.scss'

function DropdownFilter({
  id,
  name,
  defaultValue,
  options,
  placeholder,
  onChange,
  disabled,
  multiSelect = true,
  yearSelect
}) {
  const [currentValue, setCurrentValue] = useState()
  const [currentParameter, setCurrentParameter] = useState()

  useEffect(() => {
    const current = [];

    options?.forEach(option => {
      setCurrentParameter(option.parameter);
      if (multiSelect) {
        defaultValue?.forEach(value => {
          if (option.value === value) {
            current.push(option);
            setCurrentValue(current);
          }
        });
      } else if (option.value === defaultValue) {
        setCurrentValue(option);
      }
    });
  }, [defaultValue, options, multiSelect]);

  return (
    <Select
      name={name}
      clearable={true}
      id={id}
      multiselect={multiSelect}
      options={options}
      onBlur={() => {
        onChange(currentValue, currentParameter)
      }}
      onChange={data => {
        setCurrentValue(data)
        if (!multiSelect) {
          onChange(data, currentParameter)
        }
      }}
      className="filter-dropdown"
      placeholder={yearSelect ? defaultValue : placeholder}
      disabled={disabled}
    />
  )
}

DropdownFilter.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array
  ]),
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  multiSelect: PropTypes.bool,
  yearSelect: PropTypes.bool
}

export default DropdownFilter
