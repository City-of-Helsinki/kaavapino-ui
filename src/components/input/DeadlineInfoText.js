import React, { useState, useEffect } from 'react'
import { getFormValues, autofill } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector, useDispatch } from 'react-redux'
import dayjs from 'dayjs'
import { isNumber, isBoolean } from 'lodash'

const DeadlineInfoText = props => {
  const formValues = useSelector(getFormValues(EDIT_PROJECT_TIMETABLE_FORM))
  let inputValue = props.input && props.input.value
  let readonlyValue

  const [current, setCurrent] = useState()

  const dispatch = useDispatch()

  useEffect(() => {
    setCurrent(inputValue)
  }, [inputValue])

  useEffect(() => {
    if (props.autofillRule && props.autofillRule.length > 0) {
      readonlyValue = getFieldAutofillValue(
        props.autofillRule,
        formValues,
        props.input.name,
        EDIT_PROJECT_TIMETABLE_FORM
      )

      if (current === undefined)
        dispatch(
          autofill(
            EDIT_PROJECT_TIMETABLE_FORM,
            props.input.name,
            readonlyValue !== undefined ? readonlyValue : undefined
          )
        )
        setCurrent( readonlyValue )
    }
  }, [])

  let value

  if (isNumber(current) || isBoolean(current)) {
    console.log("number or boolean", current)
    value = current
  } else {
    // Expect date in value
    value = current && dayjs(current).format('DD.MM.YYYY')
    console.log("else", value)
    if (value === 'Invalid Date') {
      value = current
      console.log("invalid data", value)
    }
  }

  return (
    <div name={props.input.name} className="deadline-info-text">
      {props.label} {value}
    </div>
  )
}

export default DeadlineInfoText
