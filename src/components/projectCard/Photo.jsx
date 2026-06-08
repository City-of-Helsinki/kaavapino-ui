import React from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

function Photo({ field }) {
  const { t } = useTranslation()
  if (!field) {
    return null
  }

  return (
    <div className="photo">
      <h2>{t('project.photo-title')}</h2>
        <div className="project-image-container">
          {field.link && <img className="project-image" src={field.link} alt={field.description} />}
        </div>
    </div>
  )
}

Photo.propTypes = {
  field: PropTypes.object
}

export default Photo
