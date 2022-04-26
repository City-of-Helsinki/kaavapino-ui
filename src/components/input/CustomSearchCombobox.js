import React, { useEffect, useState } from 'react'
import { Combobox } from 'hds-react'
import { toLower } from 'lodash'
const MORE_LABEL = ' (2)'

function CustomSearchCombobox({ options, disabled, input, onBlur, name }) {
  const [currentValue, setCurrentValue] = useState(null)

  useEffect(() => {
    selectPerson()
  }, [])

  const selectPerson = () => {
    if (input.value) {
      setCurrentValue(currentOptions.find(option => option.value === input.value))
    }
  }

  const handleFilter = (items, search) => {
    return items.filter(
      item => item.label && toLower(item.label).includes(toLower(search))
    )
  }
  let currentOptions = []
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

  options = options
    ? options.filter(option => option.label && option.label.trim() !== '')
    : []

  options.forEach(option => option && currentOptions.push(modifyOptionIfExist(option)))

  currentOptions = currentOptions.sort( (a,b) => a.label > b.label ? 1 : -1)

  return (
    <div id="test" className="ad-combobox">
      <Combobox
        options={currentOptions}
        multiselect={false}
        filter={handleFilter}
        disabled={disabled}
        clearable={true}
        onChange={value => {
          input.onChange(value ? value.value : null)
          setCurrentValue(value)
        }}
        onBlur={onBlur}
        aria-label={name}
        value={currentValue}
      />
    </div>
  )
}

export default CustomSearchCombobox
