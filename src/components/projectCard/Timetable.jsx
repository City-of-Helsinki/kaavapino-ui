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
    } else if (field.choices) {
        const foundValue = field.choices?.find(current => current.value === field.value)
        value = foundValue?.label
      } else {
        value = dayjs(field.value).format('DD.MM.YYYY')
      }

    const labelContent = field.date_format  || field.label;
    return (
      <div className="timetable-field" key={labelContent + index}>
        <dt>{labelContent}</dt>
        <dd><time dateTime={field.value}>{value}</time></dd>
      </div>
    )
  }

  const renderFields = () => {
    missingData = true
    return (
      <dl className="timetable-fields">
        {fields?.map((field, fieldIndex) => {
            return renderField(field, fieldIndex)
          })
        }
        {missingData && <div className="missing-data">{t('project.missing-data')}</div>}
      </dl>
    )
  }
  const fieldsComponent = renderFields()

  return (
    <div className="timetable">
      {!hideTitle && <h2>{t('project.timetable-title')}</h2>}
      {fieldsComponent}
    </div>
  )
}

TimeTable.propTypes = {
  fields: PropTypes.array,
  hideTitle: PropTypes.bool
}

export default TimeTable
