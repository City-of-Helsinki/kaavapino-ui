import React, { useState, useEffect } from 'react'
import { Map, TileLayer } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import { formatGeoJSONToPositions, helsinkiCenter } from '../../utils/mapUtils'
import { projectOverviewMapDataSelector } from '../../selectors/projectSelector'
import { connect } from 'react-redux'

import { LoadingSpinner } from 'hds-react'
import { isEmpty } from 'lodash'
import { EPSG3879 } from '../../utils/mapUtils'
import CustomMapPolygon from './CustomMapPolygon'

function CustomMapMobile({ mapData, isPrivileged }) {
  const crs = EPSG3879()

  const [currentMapData, setCurrentMapData] = useState(null)

  useEffect(() => {
    setCurrentMapData(mapData)
  }, [])

  useEffect(() => {
    setCurrentMapData(mapData)
  }, [mapData])

  const getCoordinates = geoserver_data => {
    if (!geoserver_data || !geoserver_data.suunnittelualueen_rajaus) {
      return null
    }
    if (!geoserver_data.suunnittelualueen_rajaus) {
      return null
    }
    return geoserver_data.suunnittelualueen_rajaus[0].geometry.coordinates
  }
  const currentCoordinates = []

  currentMapData &&
    currentMapData.projects &&
    currentMapData.projects.forEach(value => {
      const coordinates = getCoordinates(value.geoserver_data)
      coordinates &&
        currentCoordinates.push({
          project: value,
          color: value.phase_color,
          coordinates: [coordinates]
        })
    })

  const [current] = useState(helsinkiCenter)

  const { t } = useTranslation()

  const getPolygonArea = () => {
    return (
      currentCoordinates &&
      currentCoordinates.map((current, index) => {
        return (
          <div key={index}>
            <CustomMapPolygon
              project={current.project}
              color={current.color}
              key={index}
              positions={formatGeoJSONToPositions(current.coordinates)}
              isPrivileged={isPrivileged}
            />
          </div>
        )
      })
    )
  }
  const renderMap = () => (
    <Map
      className="geometry-input-mobile"
      center={current}
      scrollWheelZoom={true}
      zoom={9}
      minZoom={8}
      clusterPopupVisibility={11}
      unitZoom={12}
      mobileZoom={8}
      detailZoom={14}
      mapBounds={[
        [60.402200415095926, 25.271114398151653],
        [60.402200415095926, 24.49246149510767],
        [60.00855312110063, 24.49246149510767],
        [60.00855312110063, 25.271114398151653]
      ]}
      doubleClickZoom={true}
      crs={crs}
    >
      {getPolygonArea()}
      <TileLayer attribution={t('map.attribution')} url={t('map.url')} />
    </Map>
  )

  const renderMobileView = () => (
    <div className="map-area">
      <div className="geometry-input-container">
        <h3 className="mobile-header">{t('map-area.title')}</h3>
        {isEmpty(mapData) && (
          <span className="loading-info">
            <LoadingSpinner small={true} className="loader-icon header-spinner" />
            {t('map-area.loading-data')}
          </span>
        )}
        {renderMap()}
      </div>
    </div>
  )

  return renderMobileView()
}

const mapStateToProps = state => {
  return {
    mapData: projectOverviewMapDataSelector(state)
  }
}

export default connect(mapStateToProps)(CustomMapMobile)
