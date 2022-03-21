import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import FilterList from './Filters/FilterList'
import { formatGeoJSONToPositions, helsinkiCenter } from '../../utils/mapUtils'
import {
  projectOverviewMapDataSelector,
  projectOverviewMapFiltersSelector
} from '../../selectors/projectSelector'
import { connect } from 'react-redux'
import { Grid } from 'semantic-ui-react'

import {
  getProjectsOverviewMapData,
  clearProjectsOverviewMapData,
  setProjectsOverviewMapFilter
} from '../../actions/projectActions'

import { LoadingSpinner } from 'hds-react'
import { isEqual, isEmpty } from 'lodash'
import { EPSG3879 } from '../../utils/mapUtils'
import CustomMapPolygon from './CustomMapPolygon'
import Legends from './Legends'

function CustomMap({
  filters,
  getProjectsOverviewMapData,
  mapData,
  clearProjectsOverviewMapData,
  setProjectsOverviewMapFilter,
  storedFilter,
  isPrivileged,
  isMobile
}) {
  const crs = EPSG3879()

  const [currentMapData, setCurrentMapData] = useState(null)
  const [filter, setFilter] = useState({})

  useEffect(() => {
    getProjectsOverviewMapData(filter)
    setCurrentMapData(mapData)
  }, [])

  useEffect(() => {
    getProjectsOverviewMapData(filter)
    setCurrentMapData(mapData)
  }, [filter])

  useEffect(() => {
    if (!storedFilter || !isEqual(storedFilter, filter)) {
      clearProjectsOverviewMapData()
      setCurrentMapData(null)
      getProjectsOverviewMapData(filter)
      setProjectsOverviewMapFilter(filter)
      setCurrentMapData(mapData)
    }
  }, [filter])

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

  const onFilterChange = (values, currentParameter) => {
    if (!values || values.length === 0) {
      const newFilter = Object.assign({}, filter)
      delete newFilter[currentParameter]
      setFilter({
        ...newFilter
      })
      return
    }
    const valueArray = []
    let parameter

    values.forEach(value => {
      valueArray.push(value.value)
      parameter = value.parameter
    })

    setFilter({
      ...filter,
      [parameter]: valueArray
    })
  }
  const onUserFilterChange = (values, currentParameter) => {
    if (!values || values.length === 0) {
      const newFilter = Object.assign({}, filter)
      delete newFilter[currentParameter]
      setFilter({
        ...newFilter
      })
      return
    }
    setFilter({
      ...filter,
      [currentParameter]: values
    })
  }
  const onClear = () => {
    setProjectsOverviewMapFilter({})
    setFilter({})
  }

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
    <MapContainer
      className={isMobile ? 'geometry-input-mobile' : 'geometry-input'}
      center={current}
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
    >
      {getPolygonArea()}
      <TileLayer attribution={t('map.attribution')} url={t('map.url')} />
    </MapContainer>
  )

  const renderNormalView = () => (
    <div className="map-area">
      <div className="geometry-input-container">
        <Grid columns="equal" className="full-width">
          <Grid.Column width={4}>
            <h3>{t('map-area.title')}</h3>
          </Grid.Column>
          <Grid.Column width={6}>
            {isEmpty(mapData) && (
              <span className="loading-info">
                <LoadingSpinner
                  small={true}
                  className="loader-icon-right-margin header-spinner"
                />
                {t('map-area.loading-data')}
              </span>
            )}
          </Grid.Column>
        </Grid>
        <Legends />

        <FilterList
          currentFilter={filter}
          onChange={onFilterChange}
          filterList={filters}
          showClearButton={true}
          onClear={onClear}
          onUserChange={onUserFilterChange}
        />
        {renderMap()}
      </div>
    </div>
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

  return isMobile ? renderMobileView() : renderNormalView()
}
const mapDispatchToProps = {
  getProjectsOverviewMapData,
  clearProjectsOverviewMapData,
  setProjectsOverviewMapFilter
}

const mapStateToProps = state => {
  return {
    mapData: projectOverviewMapDataSelector(state),
    storedFilter: projectOverviewMapFiltersSelector(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CustomMap)
