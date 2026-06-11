import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import MapZoomControl from '../common/MapZoomControl'
import CustomMapPolygon from './CustomMapPolygon'
import {
  EPSG3879,
  formatGeoJSONToPositions,
  helsinkiCenter
} from '../../utils/mapUtils'

const getCoordinates = geoserver_data => {
  const rajaus = geoserver_data?.suunnittelualueen_rajaus
  if (!rajaus) {
    return null
  }
  return rajaus[0].geometry.coordinates
}

const buildPolygonItems = mapData => {
  const items = []
  mapData?.projects?.forEach(value => {
    const coordinates = getCoordinates(value.geoserver_data)
    if (coordinates) {
      items.push({
        project: value,
        color: value.phase_color,
        coordinates: [coordinates]
      })
    }
  })
  return items
}

function OverviewMapCanvas({ mapData, isPrivileged, className }) {
  const { t } = useTranslation()
  const [crs] = useState(() => EPSG3879())
  const [center] = useState(helsinkiCenter)

  const polygonItems = buildPolygonItems(mapData)
  return (
    <MapContainer
      className={className}
      center={center}
      scrollWheelZoom={true}
      zoom={9}
      minZoom={8}
      maxZoom={16}
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
      zoomControl={false}
    >
      {polygonItems.map(item => (
        <div key={item.project.pk}>
          <CustomMapPolygon
            project={item.project}
            color={item.color}
            positions={formatGeoJSONToPositions(item.coordinates)}
            isPrivileged={isPrivileged}
          />
        </div>
      ))}
      <TileLayer attribution={t('map.attribution')} url={t('map.url')} />
      <MapZoomControl />
    </MapContainer>
  )
}

OverviewMapCanvas.propTypes = {
  mapData: PropTypes.object,
  isPrivileged: PropTypes.bool,
  className: PropTypes.string
}

export default OverviewMapCanvas
