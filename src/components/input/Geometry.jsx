import React from 'react'
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet'
import { EPSG3879, formatGeoJSONToPositions, helsinkiCenter } from '../../utils/mapUtils'
import { useTranslation } from 'react-i18next'

const MULTIPOLYGON = 'MultiPolygon'

function Geometry(props) {
  const crs = EPSG3879()

  const { t } = useTranslation()

  const disabled = false

  const getCoordinates = () => {
    const value = props.input.value
    if (!value) {
      if (props.value) {
        return props.value.coordinates
      }

      return []
    }
    const coordinates = value[0] && value[0].geometry && value[0].geometry.coordinates

    return coordinates || []
  }

  const getCenterCoordinates = () => {
    const coordinates = getCoordinates()

    if (!coordinates || !props.input.value) {
      return helsinkiCenter
    }

    if (props.input.value[0].geometry.type === MULTIPOLYGON) {
      return coordinates[0][0] ? coordinates[0][0][0] : helsinkiCenter
    } else {
      return coordinates[0] ? coordinates[0][0] : helsinkiCenter
    }
  }

  const ChangeView = ({ center, zoom }) => {
    const map = useMap()
    map.setView(center, zoom)
    return null
  }

  return (
    <div className="geometry-input-container">
      <MapContainer
        className={`geometry-input${disabled ? ' disabled' : ''}`}
        center={getCenterCoordinates()}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        maxZoom={16}
        zoomControl={!disabled}
        dragging={!disabled}
        crs={crs}
        style={!disabled ? { cursor: 'pointer' } : {}}
        zoom={9}
        minZoom={9}
        clusterPopupVisibility={11}
        unitZoom={12}
        mobileZoom={9}
        detailZoom={14}
        mapBounds={[
          [60.402200415095926, 25.271114398151653],
          [60.402200415095926, 24.49246149510767],
          [60.00855312110063, 24.49246149510767],
          [60.00855312110063, 25.271114398151653]
        ]}
      >
        <ChangeView center={getCenterCoordinates()} />
        <TileLayer attribution={t('map.attribution')} url={t('map.url')} />
        <Polygon positions={formatGeoJSONToPositions(getCoordinates())} />
      </MapContainer>
    </div>
  )
}

export default Geometry
