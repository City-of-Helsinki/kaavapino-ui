import React, { useState, useEffect } from 'react'
import { getFormValues, autofill } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector, useDispatch } from 'react-redux'
import dayjs from 'dayjs'
import { isNumber, isBoolean, isArray } from 'lodash'
import PropTypes from 'prop-types'
import { Notification } from 'hds-react'

const DeadlineInfoText = props => {
  const formValues = useSelector(getFormValues(EDIT_PROJECT_TIMETABLE_FORM))
  let inputValue = props.input && props.input.value
  let readonlyValue

  const [current, setCurrent] = useState()

  const dispatch = useDispatch()

  useEffect(() => {
    if(isArray(inputValue) && props?.fieldData?.autofill_readonly && props?.fieldData?.type === "readonly" && props?.fieldData?.unit === "päivää"){
      //Fixes situation if int has at somepoint on old project been converted to date/array of some sort because of bug and converts it back to int
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
        //Fixes situation if int has at somepoint on old project been converted to date/array of some sort because of bug and converts it back to int
        value = props?.meta?.initial
      }
      else{
        value = current
      }
    }
  }

  if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
    value = '';
    console.warn("Plain object found in DeadlineInfoText value");
  }

  return (
    <Notification className='deadline-info-notification' size="small" label={props.input.name} >{props.label} {value}</Notification>
  )
}

DeadlineInfoText.propTypes = {
  fieldData:PropTypes.object,
  meta: PropTypes.object,
}

export default DeadlineInfoText
