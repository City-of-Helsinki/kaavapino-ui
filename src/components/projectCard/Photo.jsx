import React from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

function Photo({ field }) {
  const { t } = useTranslation()
  if (!field) {
    return null
  }
  const altText = [null, undefined, "undefined"].includes(field.description) ? t('project.photo-title') : field.description
  return (
    <div className="photo">
      <h2>{t('project.photo-title')}</h2>
        <div className="project-image-container">
          {field.link && <img className="project-image" src={field.link} alt={altText} />}
        </div>
    </div>
  )
}

Photo.propTypes = {
  field: PropTypes.shape({
    link: PropTypes.string,
    description: PropTypes.string
  })
}

export default Photo
