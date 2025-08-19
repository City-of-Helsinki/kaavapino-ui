import React from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { isArray } from 'lodash'

function TimeTable({ fields, hideTitle }) {
  const { t } = useTranslation()
  let missingData = true

  const renderField = (field, index) => {
    if (!field.value) {
      return
    }
    let value = field.value
    let completeValue = ''
    if(missingData) missingData = value == null

    if (isArray(field.value)) {
      field.value.forEach(current => {
        if (current) {
          completeValue = completeValue + ' ' + dayjs(current).format('DD.MM.YYYY')
        }
      })
      value = completeValue
    } else {
      if (field.choices) {
        const foundValue =
          field.choices && field.choices.find(current => current.value === field.value)
        value = foundValue.label
      } else {
        value = dayjs(field.value).format('DD.MM.YYYY')
      }
    }

    return <div key={field.label + index}>{renderFieldValue(field, index, value)}</div>
  }
  const renderFieldValue = (field, index, value) => {
    return field.date_format ? (
      <div key={field.label + index}>
        {field.date_format} <b>{value}</b>
      </div>
    ) : (
      <div key={field.label + index}>
        <div>{field.label}</div>
        <div>
          <b>
            {field.date_format} {value}
          </b>
        </div>
      </div>
    )
  }

  const renderFields = () => {
    missingData = true
    return (
      <div>
        {fields &&
          fields.map((field, fieldIndex) => {
            return renderField(field, fieldIndex)
          })
        }
        {missingData && <label className="missing-data">{t('project.missing-data')}</label>}
      </div>
    )
  }
  const fieldsComponent = renderFields()

  return (
    <div className="timetable">
      {!hideTitle && <h3>{t('project.timetable-title')}</h3>}
      {fieldsComponent}
    </div>
  )
}

TimeTable.propTypes = {
  fields: PropTypes.array
}

export default TimeTable
