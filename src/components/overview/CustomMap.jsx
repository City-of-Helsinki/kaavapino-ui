import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import FilterList from './Filters/FilterList'
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
import Legends from './Legends'
import OverviewMapCanvas from './OverviewMapCanvas'

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
  const [filter, setFilter] = useState({})

  useEffect(() => {
    if (!isEqual(storedFilter, filter)) {
      clearProjectsOverviewMapData()
      setProjectsOverviewMapFilter(filter)
    }
    getProjectsOverviewMapData(filter)
  }, [filter])

  const onFilterChange = (values, currentParameter) => {
    if (!values || values.length === 0) {
      const newFilter = { ...filter }
      delete newFilter[currentParameter]
      setFilter(newFilter)
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
      const newFilter = { ...filter }
      delete newFilter[currentParameter]
      setFilter(newFilter)
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

  const renderMap = () => (
    <OverviewMapCanvas
      mapData={mapData}
      isPrivileged={isPrivileged}
      className={isMobile ? 'geometry-input-mobile' : 'geometry-input'}
    />
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
                  theme={{ '--spinner-color': '#0000BF' }}
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
            <LoadingSpinner small={true} className="loader-icon header-spinner" theme={{ '--spinner-color': '#0000BF' }} />
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
