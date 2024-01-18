import React, { useState, useEffect } from 'react'
import { getFormValues, autofill } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector, useDispatch } from 'react-redux'
import dayjs from 'dayjs'
import { isNumber, isBoolean, isArray } from 'lodash'
import PropTypes from 'prop-types'

const DeadlineInfoText = props => {
  const formValues = useSelector(getFormValues(EDIT_PROJECT_TIMETABLE_FORM))
  let inputValue = props.input && props.input.value
  let readonlyValue

  const [current, setCurrent] = useState()

  const dispatch = useDispatch()

  useEffect(() => {
    console.log(inputValue)
    console.log(formValues)
    console.log(props)
    if(isArray(inputValue)){
      dispatch(
        autofill(
          EDIT_PROJECT_TIMETABLE_FORM,
          props.input.name,
          props?.meta?.initial
        )
      )
      inputValue = props?.meta?.initial
    }
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
      if (current === undefined){
        dispatch(
          autofill(
            EDIT_PROJECT_TIMETABLE_FORM,
            props.input.name,
            readonlyValue !== undefined ? readonlyValue : undefined
          )
        )
      }
      if(isArray(current) && props?.fieldData?.autofill_readonly && props?.fieldData?.type === "readonly" && props?.fieldData?.unit === "päivää"){
        console.log(readonlyValue,props?.meta?.initial)
        dispatch(
          autofill(
            EDIT_PROJECT_TIMETABLE_FORM,
            props.input.name,
            props?.meta?.initial
          )
        )
      }
        setCurrent( readonlyValue )
    }
  }, [])

  let value

  if (isNumber(current) || isBoolean(current)) {
    value = current
  } else {
    // Expect date in value
    value = current && dayjs(current).format('DD.MM.YYYY')
    if (value === 'Invalid Date') {
      if(isArray(current) && props?.fieldData?.autofill_readonly && props?.fieldData?.type === "readonly" && props?.fieldData?.unit === "päivää"){
        console.log(props,formValues,inputValue)
        value = props?.meta?.initial
      }
      else{
        value = current
      }
    }
  }

  return (
    <div name={props.input.name} className="deadline-info-text">
      {props.label} {value}
    </div>
  )
}

DeadlineInfoText.propTypes = {
  fieldData:PropTypes.object,
  meta: PropTypes.object,
}

export default DeadlineInfoText
