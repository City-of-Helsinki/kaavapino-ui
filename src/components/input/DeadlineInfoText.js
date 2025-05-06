import React, { useState, useEffect } from 'react'
import { getFormValues, autofill } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import { useSelector, useDispatch } from 'react-redux'
import dayjs from 'dayjs'
import { isNumber, isBoolean, isArray } from 'lodash'
import PropTypes from 'prop-types'
import { Notification } from 'hds-react'
import { useTranslation } from 'react-i18next'

const DeadlineInfoText = props => {
  const formValues = useSelector(getFormValues(EDIT_PROJECT_TIMETABLE_FORM))
  let inputValue = props.input?.value
  let readonlyValue

  const [current, setCurrent] = useState()

  const dispatch = useDispatch()
  const { t } = useTranslation()

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

  const calculateDaysBetweenDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const differenceInMilliseconds = end - start;
    const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
    return differenceInDays;
  }

  const determineFieldValue = (current, props) => {

    if (isNumber(current) || isBoolean(current)) {
      return current
    }

    if(props.input.name.includes("nahtavillaolopaivien_lukumaara")){
      const regex = /_x(\d+)/;
      const match = props.input.name.match(regex);
      const index = match ? "_"+match[1] : "";
      let start = formValues["milloin_ehdotuksen_nahtavilla_alkaa_iso"+index] ?? formValues["milloin_ehdotuksen_nahtavilla_alkaa_pieni"+index]
      let end = formValues["milloin_ehdotuksen_nahtavilla_paattyy"+index]
      return calculateDaysBetweenDates(start, end)
    }
    // Expect date in value
    const dateValue = current && dayjs(current).format('DD.MM.YYYY')
    if (dateValue === 'Invalid Date') {
      if(isArray(current) && props?.fieldData?.autofill_readonly && props?.fieldData?.type === "readonly" && props?.fieldData?.unit === "päivää"){
        //Fixes situation if int has at somepoint on old project been converted to date/array of some sort because of bug and converts it back to int
        return props?.meta?.initial
      }
      return current
    }
    return dateValue
  }

  let value = determineFieldValue(current, props)

  if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
    value = '';
    console.warn("Plain object found in DeadlineInfoText value");
  }

  const phaseMap = {
    periaatteista: "Periaatteet",
    oas: "OAS",
    luonnos: "Luonnos"
  };

  const phaseKey = Object.keys(phaseMap).find(key => props?.input?.name?.includes(key));
  const phase = phaseMap[phaseKey];
  //Check if event is set to be organized in formValues
  const eventKey = phase === "Luonnos" ? `jarjestetaan_${phase?.toLowerCase()}vaiheessa_tilaisuus` : `jarjestetaan_${phase?.toLowerCase()}_tilaisuus`
  const shouldShowNotification = phase && formValues && formValues[eventKey];

  // Extract the event date if it exists and shouldShowNotification is true
  let eventDate = "";
  if (shouldShowNotification) {
    const eventDateKey = `${phase?.toLowerCase()}_tilaisuus_fieldset`;
    eventDate = formValues[eventDateKey]?.[0]?.[`${phase?.toLowerCase()}_tilaisuus_pvm`] || t('common.date-missing');
    if (eventDate?.includes('-')) {
      eventDate = eventDate.replace(/-/g, '.');
      const [year, month, day] = eventDate.split('.');
      eventDate = `${day}.${month}.${year}`;
    }
  }

  return (
    <>
      {shouldShowNotification && (
        <Notification
          className="event-info-notification"
          size="small"
          label={`${phase}${phase === "Luonnos" ? "" : "-"}vaiheen tilaisuus: ${eventDate}`}
        >
          {`${phase}${phase === "Luonnos" ? "" : "-"}vaiheen tilaisuus: ${eventDate}`}
        </Notification>
      )}
      {props.input.name.includes("nahtavillaolopaivien_lukumaara") ?
        <p className="deadline-info-readonlytext">{props.label}: {value} pv </p>
        : <Notification className='deadline-info-notification' size="small" label={props.input.name}>{props.label + ': '}{value}</Notification>
      }
    </>
  );

}

DeadlineInfoText.propTypes = {
  fieldData:PropTypes.object,
  meta: PropTypes.object,
  input: PropTypes.shape({
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
    ]),
    name: PropTypes.string,
  }),
  label: PropTypes.string,
}

export default DeadlineInfoText
