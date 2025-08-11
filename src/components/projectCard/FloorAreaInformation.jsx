import React from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

function FloorAreaInformation({ fields, hideTitle }) {
  const { t } = useTranslation()

const renderField = (field, index) => {
  const label = field.label
  const splitPoint = label.lastIndexOf(' yhteensä')
  const labelTop = splitPoint !== -1 ? label.slice(0, splitPoint) : label
  const labelBottom = splitPoint !== -1 ? 'yhteensä' : ''

  return (
    <div
      key={field.label + index}
      className={`floor-area-column ${index === 1 ? 'with-divider' : ''}`}
    >
      <div className="floor-area-field">
        <div className="floor-area-label">
          {labelTop}
          <br />
          {labelBottom && (
            <span className="floor-area-description">{labelBottom}</span>
          )}
        </div>
        <div className="floor-area-value">
          {field.value}{' '}
          {field.unit === 'k-m2' ? (
            <>
              k-m<sup>2</sup>
            </>
          ) : (
            field.unit
          )}
        </div>
      </div>
    </div>
  )
}

const renderFields = () => {
  return (
    <>
      {!hideTitle && <h3>{t('project.floor-area-title')}</h3>}
      <div className="floor-area-grid">
        {fields.map((field, index) => renderField(field, index))}
      </div>
    </>
  )
}

  return <div className="floor-area-information">{renderFields()}</div>
}

FloorAreaInformation.propTypes = {
  fields: PropTypes.array,
  hideTitle: PropTypes.bool
}

export default FloorAreaInformation
