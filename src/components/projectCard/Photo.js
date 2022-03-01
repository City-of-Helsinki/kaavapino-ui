import React from 'react'
import PropTypes from 'prop-types'

function Photo({ field }) {
  if (!field) {
    return null
  }

  return (
    <div className="photo">
      <div>
        <div className="project-image-container">
          {field.link && <img className="project-image" src={field.link} alt={field.description} />}
        </div>
      </div>
    </div>
  )
}

Photo.propTypes = {
  field: PropTypes.object
}

export default Photo
