import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { getFloorAreaChartData, LIVING_OVERALL } from './floorAreaChartUtils'
import {
  projectOverviewFloorAreaSelector,
  projectOverviewFloorAreaTargetsSelector
} from '../../selectors/projectSelector'

import { getProjectsOverviewFloorAreaTargets } from '../../actions/projectActions'
import { connect } from 'react-redux'
import { LoadingSpinner } from 'hds-react'
import { withRouter } from 'react-router-dom'
import dayjs from 'dayjs'

function FloorAreaMobile({
  chartData,
  getProjectsOverviewFloorAreaTargets,
  floorAreaTargets
}) {
  const { t } = useTranslation()

  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)
  const currentYear = dayjs(chartData.date).year()

  useEffect(() => {
    getProjectsOverviewFloorAreaTargets()
  }, [])

  useEffect(() => {
    setTotal(floorAreaTargets[currentYear] ? floorAreaTargets[currentYear] : 0)
  }, [chartData])

  useEffect(() => {
    const graphData = getFloorAreaChartData(chartData)
    const livingOverall = graphData && graphData[LIVING_OVERALL]
    setCurrent(livingOverall ? livingOverall : 0)
  }, [chartData])

  useEffect(() => {
    setTotal(floorAreaTargets[currentYear])
  }, [floorAreaTargets])

  const isChartDataLoaded = () => {
    if (!chartData || Object.entries(chartData).length === 0) {
      return false
    }
    return true
  }
  return (
    <div className="floor-area">
      <div className="chart-area-header-mobile">
        <h3>{t('floor-area.mobile-title')}</h3>
        {!isChartDataLoaded() && <LoadingSpinner className="center" />}
        {isChartDataLoaded() && (
          <div className="current-number">
            {t('floor-area.current-number', { current })}
            {t('floor-area.total-number', { total: total ? total : '' })}
          </div>
        )}
      </div>
    </div>
  )
}

FloorAreaMobile.propTypes = {
  chartData: PropTypes.object.isRequired
}

const mapDispatchToProps = {
  getProjectsOverviewFloorAreaTargets
}

const mapStateToProps = state => {
  return {
    chartData: projectOverviewFloorAreaSelector(state),
    floorAreaTargets: projectOverviewFloorAreaTargetsSelector(state)
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(FloorAreaMobile))
