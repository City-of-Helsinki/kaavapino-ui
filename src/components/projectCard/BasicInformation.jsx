import React from 'react'
import { Link } from 'hds-react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

function BasicInformation({ fields, hideTitle }) {
  const { t } = useTranslation()

  const isUrl = (val) =>
    typeof val === 'string' && val.includes('://')

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
        <dt>{field.label}:</dt>
        <dd>{isUrl(value) ? 
          <Link href={value} target="_blank" rel="noreferrer" external openInNewTab> {value} </Link> 
          : value}
        </dd>
      </div>
    )
  }

  return (
    <div className="basic-information">
      {!hideTitle && <h2>{t('project.basic-information-title')}</h2>}
      <dl>
        {fields?.map((field, index) => renderField(field, index))}
      </dl>
    </div>
  )
}

BasicInformation.propTypes = {
  fields: PropTypes.array,
  hideTitle: PropTypes.bool
}

export default BasicInformation
