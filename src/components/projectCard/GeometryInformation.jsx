import React from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import Geometry from '../input/Geometry'

function GeometryInformation(props) {
  const { t } = useTranslation()

  return (
    <div>
      {!props.hideTitle && <h3>{t('project.planning-area-constraints')}</h3>}
      <div className="geometry-input-container">
        <Geometry
          input={{ value: props.field?.value }}
        />
      </div>
    </div>
  )
}

GeometryInformation.propTypes = {
  field: PropTypes.object,
  hideTitle: PropTypes.bool
}

export default GeometryInformation
