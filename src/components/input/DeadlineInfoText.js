import React, { useState, useEffect } from 'react'
import { getFormValues, autofill } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector, useDispatch, connect } from 'react-redux'
import dayjs from 'dayjs'
import { isNumber, isBoolean, isArray } from 'lodash'
import PropTypes from 'prop-types'
import { Notification } from 'hds-react'
import { editProjectTimetableFormSelector } from '../../selectors/formSelector'

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

  useEffect(() => {
    if (props.input?.name == 'nahtavillaolopaivien_lukumaara'){
      const start_name = 'milloin_ehdotuksen_nahtavilla_alkaa_pieni'
      const end_name = 'milloin_ehdotuksen_nahtavilla_paattyy'
      const start_date = start_name in props.timetableValues ? 
        new Date(props.timetableValues['milloin_ehdotuksen_nahtavilla_alkaa_pieni']) : null
      const end_date = end_name in props.timetableValues ?
        new Date(props.timetableValues['milloin_ehdotuksen_nahtavilla_paattyy']) : null
      if (end_date && start_date){
        const days = ((end_date - start_date) / 86400000) +1
        setCurrent(days)
      }
    }
  }, [props.timetableValues])

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

  return (
    <Notification className='deadline-info-notification' size="small" label={props.input.name} >{props.label} {value}</Notification>
  )
}

DeadlineInfoText.propTypes = {
  fieldData:PropTypes.object,
  meta: PropTypes.object,
  timetableValues: PropTypes.object,
  input: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ])
}

const mapStateToProps = (state) => {
  return {
    timetableValues: editProjectTimetableFormSelector(state).values
  }
}

export default connect(mapStateToProps, null)(DeadlineInfoText)
