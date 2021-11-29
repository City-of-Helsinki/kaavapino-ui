import React, { useState, useEffect } from 'react'
import projectUtils from '../../../utils/projectUtils'
import { Checkbox, Combobox } from 'hds-react'
import CustomADUserCombobox from '../../input/CustomADUserCombobox'
import { isObject } from 'lodash'

export default function MobileFilterList({
  filter,
  onChange,
  onUserFilterChange,
  filterValues
}) {
  const currentFilterValue = filterValues[filter.parameter]

  const currentFilter = {}

  currentFilterValue && currentFilterValue.forEach(value => (currentFilter[value] = true))
  const [checkedItems, setCheckedItems] = useState(currentFilter)

  useEffect(() => {
    let returnValue = []

    const keys = Object.keys(checkedItems)
    keys.forEach(key => {
      if (isObject(checkedItems[key])) {
        returnValue.push(checkedItems[key])
      } else {
        return checkedItems[key] === true ? returnValue.push(key) : null
      }
    })
    onChange(returnValue, filter.parameter)
  }, [checkedItems])

  const handleChange = e => {
    const item = e.target.id
    const isChecked = e.target.checked
    setCheckedItems({ ...checkedItems, [item]: isChecked })
  }
  const handleSingleChange = value => {
    onUserFilterChange([value], filter.parameter)
  }

  const handleUserChange = value => {
    onUserFilterChange(value, filter.parameter)
  }

  const renderFields = () => {
    if (filter.value_type === 'user') {
      return (
        <CustomADUserCombobox
          label={filter.name}
          input={{ onChange: handleUserChange }}
          multiselect={true}
          currentValue={currentFilterValue}
        />
      )
    }

    let choices = []
    if (!filter) {
      return null
    }
    if (!filter.choices || filter.choices.length === 0) {
      if (filter.accepts_year) {
        choices = projectUtils.generateArrayOfYearsForChart()
      }
    } else {
      choices = filter.choices
    }

    if (filter.accepts_year) {
      return (
        <Combobox
          options={choices}
          onChange={handleSingleChange}
          defaultValue={
            currentFilterValue && currentFilterValue[0] ? currentFilterValue[0] : null
          }
          multiselect={false}
          clearable={true}
        />
      )
    }

    return choices.map(field => {
      return (
        <Checkbox
          onChange={handleChange}
          id={field.value}
          key={field.value}
          label={field.label}
          checked={checkedItems[field.value]}
        />
      )
    })
  }
  return <div>{renderFields()}</div>
}
