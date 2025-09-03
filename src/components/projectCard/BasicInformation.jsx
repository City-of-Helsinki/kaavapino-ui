import React from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

function BasicInformation({ fields, hideTitle }) {
  const { t } = useTranslation()

  const renderField = (field, index) => {
    let value = field.value
    if (field.choices) {
      const choice = field.choices.find(choice => choice.value === field.value)

      if (choice) {
        value = choice.label
      }
    }
    return (
      <div className="project-card-field" key={field.label + index}>
        {field.label}: <b>{value}</b>{' '}
      </div>
    )
  }
  const renderFields = () => {
    return (
      <div key="basic-information">
        {!hideTitle && <h3>{t('project.basic-information-title')}</h3>}
        {fields &&
          fields.map((field, index) => {
            return renderField(field, index)
          })}
      </div>
    )
  }
  const fieldsComponent = renderFields()

  return <div className="basic-information">{fieldsComponent}</div>
}

BasicInformation.propTypes = {
  fields: PropTypes.array
}

export default BasicInformation
