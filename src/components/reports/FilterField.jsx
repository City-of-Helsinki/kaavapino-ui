import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { change } from 'redux-form'
import SelectInput from '../input/SelectInput'
import { TextInput } from 'hds-react'
import { REPORT_FORM } from '../../constants'
import CustomADUserCombobox from '../input/CustomADUserCombobox'
import { isArray } from 'lodash'

function FilterField({ type, id, options, change, disabled, inputType, name }) {
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const [selectVal,setSelectVal] = useState([])

  useEffect(() => {
    if (!start || !end) {
      return
    }
    const value = `${start},${end}`
    change(REPORT_FORM, id, value)
  }, [start, end])

  const changeSelection = (form, id, value) => {
    //Visually change
    setSelectVal(value)
    //Redux form change
    change(form, id, value)
  }

  const renderUser = () => {
    return (
    
      <CustomADUserCombobox
        input={{
          onChange: value => {
            if (!isArray(value)) {
              value && change(REPORT_FORM, id, value.id)
            } else {
              let returnValue = []
              value.forEach(current => returnValue.push(current.id))
              change(REPORT_FORM, id, returnValue.toString())
            }
          }
        }}
        disabled={disabled}
        multiselect={true}
        label={name}
      />
    )
  }
  const renderSelect = () => {
    return (
      <SelectInput
        multiple={type === 'multiple' || type === 'set' ? true : false}
        options={options}
        className="filter-field"
        disabled={disabled}
        input={{
          value: selectVal,
          onChange: value => changeSelection(REPORT_FORM, id, value)
        }}
        label={name}
      />
    )
  }
  const renderRange = type => {
    return (
      <div>
        <div className="range-filters">
          <div className="range-grid">
            <div className="col col-1">
              <TextInput
                onChange={(event) => setStart(event.target.value)}
                type={type}
                className="date-input"
                disabled={disabled}
                aria-label="Alkupvm"
              />
            </div>

            <div className="col center-horizontal">-</div>

            <div className="col col-2">
              <TextInput
                onChange={(event) => setEnd(event.target.value)}
                type={type}
                className="date-input"
                disabled={disabled}
                aria-label="Loppu pvm"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTextInput = () => {
    let currentType
    let label

    if (type === 'string') {
      currentType = 'text'
      label = 'text'
    }
    if (type === 'number') {
      currentType = 'number'
      label = 'number'
    }

    return (
      <TextInput
        onChange={event => {
          change(REPORT_FORM, id, event.target.value)
        }}
        type={currentType}
        input={{
          value: null
        }}
        disabled={disabled}
        aria-label={label}

      />
    )
  }

  const renderComponent = () => {
    if (options && options.length > 0) {
      return renderSelect()
    }

    if (inputType === 'personnel') {
      return renderUser()
    }

    if (type === 'range') {
      return renderRange(inputType)
    }

    return renderTextInput()
  }

  return renderComponent()
}

const mapDispatchToProps = {
  change
}

export default connect(null, mapDispatchToProps)(FilterField)
