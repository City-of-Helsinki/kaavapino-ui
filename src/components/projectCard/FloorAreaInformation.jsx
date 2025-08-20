import React from 'react'
import PropTypes from 'prop-types'
import { Grid } from 'semantic-ui-react'
import { useTranslation } from 'react-i18next'

function FloorAreaInformation({ fields, hideTitle }) {
  const { t } = useTranslation()

  const renderField = (field, index) => {
    if (field.unit === 'k-m2') {
      return (
        <Grid.Column key={field.label + index}>
          <div>
            {field.label}
            <div className="floor-area-value">{field.value} k-m&sup2;</div>
          </div>
        </Grid.Column>
      )
    } else {
      return (
        <Grid.Column key={field.label + index}>
          <div className="floor-area-field">
            <div>{field.label}</div>
            <div className="floor-area-value">
              {field.value} {field.unit}
            </div>
          </div>
        </Grid.Column>
      )
    }
  }
  const renderFields = () => {
    return (
      <div>
        {!hideTitle && <h3>{t('project.floor-area-title')}</h3>}
        <Grid stackable columns="equal">
          {fields &&
            fields.map((field, index) => {
              return renderField(field, index)
            })}
        </Grid>
      </div>
    )
  }
  const fieldsComponent = renderFields()

  return <div className="floor-area-information">{fieldsComponent}</div>
}

FloorAreaInformation.propTypes = {
  fields: PropTypes.array
}

export default FloorAreaInformation
