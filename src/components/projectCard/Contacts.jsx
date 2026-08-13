import React from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { isArray } from 'lodash'

function Contacts({ fields, hideTitle, personnel }) {
  const { t } = useTranslation()

  const renderField = (field, index) => {
    if (!field.value) {
      return
    }
    let value = field.value
    let completeValue = []

    if (isArray(field.value)) {
      field.value.forEach(current => {
        if (!current) return;
        if (field.choices) {
          const choiceValue = field.choices?.find(choice => choice.value === current)
          completeValue.push(choiceValue?.label || current)
        } else {
          const currentPerson = personnel?.find(person => (person.id === current))
          completeValue.push(currentPerson?.name || current)
        }
      })
      value = completeValue.map(value => <div key={value}>{value}</div>)
    } else if (field.choices) {
        const foundValue = field.choices?.find(choice => choice.value === field.value)
        value = foundValue?.label
    } else {
      const current = personnel?.find(person => person.id === field.value)

      if (current) {
        value = current.name
      }
    }
    return (
      <div className="project-card-field" key={field.label + index}>
        <dt>{field.label}</dt>
        <dd lang="fi">{value}</dd>
      </div>
    )
  }

  return (
    <div className="contacts">
      {!hideTitle && <h2>{t('project.contact-title')}</h2>}
      <dl>
        {fields?.map((field, index) => {
          return renderField(field, index);
        })}
      </dl>
    </div>
  )
}

Contacts.propTypes = {
  fields: PropTypes.array,
  hideTitle: PropTypes.bool,
  personnel: PropTypes.array,
}

export default Contacts
