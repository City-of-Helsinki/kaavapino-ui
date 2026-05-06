import React from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { projectOverviewMapDataSelector } from '../../selectors/projectSelector'
import { connect } from 'react-redux'

import { LoadingSpinner } from 'hds-react'
import { isEmpty } from 'lodash'
import OverviewMapCanvas from './OverviewMapCanvas'

function CustomMapMobile({ mapData, isPrivileged }) {
  const { t } = useTranslation()

  return (
    <div className="map-area">
      <div className="geometry-input-container">
        <h3 className="mobile-header">{t('map-area.title')}</h3>
        {isEmpty(mapData) && (
          <span className="loading-info">
            <LoadingSpinner small={true} className="loader-icon header-spinner" theme={{ '--spinner-color': '#0000BF' }} />
            {t('map-area.loading-data')}
          </span>
        )}
        <OverviewMapCanvas
          mapData={mapData}
          isPrivileged={isPrivileged}
          className="geometry-input-mobile"
        />
      </div>
    </div>
  )
}

CustomMapMobile.propTypes = {
  mapData: PropTypes.object,
  isPrivileged: PropTypes.bool
}

const mapStateToProps = state => {
  return {
    mapData: projectOverviewMapDataSelector(state)
  }
}

export default connect(mapStateToProps)(CustomMapMobile)
