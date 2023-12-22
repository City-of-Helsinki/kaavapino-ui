import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  YAxis,
  XAxis,
  Legend,
  CartesianGrid,
  Line,
  Bar,
  ResponsiveContainer,
  ComposedChart,
  Label,
  ReferenceLine
} from 'recharts'
import { useTranslation } from 'react-i18next'
import FilterList from './Filters/FilterList'
import { Grid, Popup } from 'semantic-ui-react'
import { isNaN, isEqual, isArray } from 'lodash'
import {
  getFloorAreaChartData,
  BUSINESS_PREMISES,
  LIVING,
  PREDICTION,
  LIVING_OVERALL,
  TOTAL
} from './floorAreaChartUtils'
import {
  projectOverviewFloorAreaSelector,
  projectOverviewFloorAreaFiltersSelector,
  projectOverviewFloorAreaTargetsSelector
} from '../../selectors/projectSelector'

import {
  getProjectsOverviewFloorArea,
  clearProjectsOverviewFloorArea,
  setProjectsOverviewFloorAreaFilter,
  getProjectsOverviewFloorAreaTargets
} from '../../actions/projectActions'
import { connect } from 'react-redux'
import { LoadingSpinner, Button } from 'hds-react'
import { withRouter } from 'react-router-dom'
import dayjs from 'dayjs'
import Legends from './Legends'
function FloorAreaChart({
  filters,
  chartData,
  getProjectsOverviewFloorArea,
  history,
  isPrivileged,
  clearProjectsOverviewFloorArea,
  setProjectsOverviewFloorAreaFilter,
  storedFilter,
  getProjectsOverviewFloorAreaTargets,
  floorAreaTargets
}) {
  const { t } = useTranslation()

  const [filter, setFilter] = useState({})

  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)

  const [currentChartData, setCurrentChartData] = useState(null)

  useEffect(() => {
    getProjectsOverviewFloorArea(filter)
    setCurrentChartData(getFloorAreaChartData(chartData))
    getProjectsOverviewFloorAreaTargets()
  }, [])

  useEffect(() => {
    if (!storedFilter || !isEqual(storedFilter, filter)) {
      clearProjectsOverviewFloorArea()
      setCurrentChartData(null)
      getProjectsOverviewFloorArea(filter)
      setProjectsOverviewFloorAreaFilter(filter)
    }
  }, [filter])

  useEffect(() => {
    setCurrentChartData(getFloorAreaChartData(chartData))
    const currentValue = filter && filter['vuosi'] ? filter['vuosi'] : currentYear

    setTotal(floorAreaTargets[currentValue] ? floorAreaTargets[currentValue] : 0)
  }, [chartData])

  useEffect(() => {
    const graphData = getFloorAreaChartData(chartData)
    const livingOverall = graphData && graphData[LIVING_OVERALL]
    setCurrent(livingOverall ? livingOverall : 0)
  }, [chartData])

  useEffect(() => {
    const currentValue = filter && filter['year'] ? filter['year'] : currentYear

    setTotal(floorAreaTargets[currentValue])
  }, [floorAreaTargets])

  const onFilterChange = (values, currentParameter) => {
    if (!values || values.length === 0) {
      const newFilter = Object.assign({}, filter)
      delete newFilter[currentParameter]
      setFilter({
        ...newFilter
      })
      return
    }
    if (isArray(values)) {
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
    } else {
      setFilter({
        ...filter,
        [values.parameter]: values.value
      })
    }
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

  const goToProjectCard = id => {
    if (history) {
      history.push(`/projects/${id}`)
    }
  }
  const goToProjectEdit = id => {
    if (history) {
      history.push(`/projects/${id}/edit`)
    }
  }

  const CustomizedLabel = props => {
    const { x, y, width, height, value } = props

    if (isNaN(height)) {
      return null
    }

    let currentHeight = height / value

    if (currentHeight < 0) {
      currentHeight = -currentHeight
    }

    const renderList = () => {
      const rects = []
      for (let index = 1; index <= value; index++) {
        let currentY = y + index * currentHeight - currentHeight
        rects.push(
          <Popup
            on="click"
            key={index + props.payload.date}
            trigger={
              <g key={index}>
                <rect
                  x={x}
                  y={currentY}
                  width={width}
                  height={currentHeight - 3}
                  stroke="none"
                  fill={getProjectColour(index)}
                  className="bar"
                  style={{ stroke: 'black', strokeWidth: 1 }}
                  data-for="test"
                ></rect>
              </g>
            }
          >
            {renderPopupValue(index)}
          </Popup>
        )
      }

      return rects
    }
    const getProjectInformation = index => {
      const dailyStats = chartData && chartData.daily_stats

      const current = getFormattedDataToOriginal(props.payload.date)
      const currentDate = dailyStats && dailyStats.find && dailyStats.find(stats => {
        if (stats.date === current) return stats
      })

      return currentDate && currentDate.projects && currentDate.projects[index - 1]
    }

    const getProjectColour = index => {
      if (!chartData) {
        return
      }
      const dailyStats = chartData && chartData.daily_stats

      const current = getFormattedDataToOriginal(props.payload.date)
      const currentDate =
        dailyStats && dailyStats.find &&
        dailyStats.find(stats => {
          if (stats.date === current) return stats
        })

      const project =
        currentDate && currentDate.projects && currentDate.projects[index - 1]

      return project && project.phase.color_code
    }

    const renderPopupValue = index => {
      const project = getProjectInformation(index)

      if (!project) {
        return null
      }

      return (
        <Grid columns="equal" className="tooltip">
          <Grid.Row>
            <Grid.Column>{project.pino_number}</Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column className="header">{project.name}</Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>{t('floor-area.tooltip.phase')}</Grid.Column>
            <Grid.Column textAlign="right">
              <span
                style={{ backgroundColor: project.phase.color_code }}
                className="dot"
              ></span>
              <span className="value">{project.phase.name}</span>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>{t('floor-area.tooltip.process-size')}</Grid.Column>
            <Grid.Column className="value" textAlign="right">
              {project.subtype.name}
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>{t('floor-area.tooltip.responsible-person')}</Grid.Column>
            <Grid.Column className="value" textAlign="right">
              {project.user_name}
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column className="button-area">
              <Button
                onClick={() => goToProjectCard(project.id)}
                className="tooltip-button"
                variant="supplementary"
              >
                {t('floor-area.tooltip.show-project-card')}
              </Button>
            </Grid.Column>
            <Grid.Column className="button-area" textAlign="right">
              {isPrivileged && (
                <Button
                  onClick={() => goToProjectEdit(project.id)}
                  className="tooltip-button"
                  variant="supplementary"
                >
                  {t('floor-area.tooltip.modify')}
                </Button>
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      )
    }

    const rects = renderList()

    return <svg>{rects}</svg>
  }

  const getFormattedDate = date => {
    return dayjs(date).format('DD.MM')
  }

  const getFormattedHeaderDate = date => {
    return dayjs(date).format('DD.MM.YYYY')
  }
  const getFormattedDataToOriginal = date => {
    return dayjs(date).format('YYYY-MM-DD')
  }

  const onClear = () => {
    setProjectsOverviewFloorAreaFilter({})
  }

  const currentYear = dayjs(chartData.date).year()

  return (
    <div className="floor-area">
      <h3>{t('floor-area.title', { date: getFormattedHeaderDate(chartData.date) })}</h3>
      <FilterList
        currentFilter={filter}
        onChange={onFilterChange}
        filterList={filters}
        onClear={onClear}
        defaultYear={currentYear}
        onUserChange={onUserFilterChange}
      />

      <div>
        {!currentChartData && <LoadingSpinner className="center" />}
        {currentChartData && (
          <div>
            <div className="total-floor-area">
              <span className="current-number">
                {t('floor-area.current-number', { current })}
              </span>
              <span>{t('floor-area.total-number', { total: total ? total : '' })}</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={currentChartData.floorAreas}>
                <ReferenceLine
                  label={t('floor-area.now')}
                  yAxisId="left"
                  type="number"
                  x={new Date().getTime()}
                  stroke="red"
                />

                <XAxis
                  interval={0}
                  scale="time"
                  height={65}
                  tickCount={100}
                  domain={['auto', 'auto']}
                  type="number"
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  tickFormatter={getFormattedDate}
                />
                <YAxis yAxisId="left">
                  <Label
                    dx={-30}
                    angle={-90}
                    position="centerTop"
                    style={{ fontSize: '12px' }}
                    value={t('floor-area.y-axis-title')}
                  ></Label>
                </YAxis>
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 20]}
                  scale="linear"
                  hide={false}
                >
                  <Label
                    angle={-90}
                    position="centerTop"
                    style={{ fontSize: '12px' }}
                    value={t('floor-area.y-axis-title-projects-in-meeting')}
                  ></Label>
                </YAxis>
                <Bar
                  shape={<CustomizedLabel />}
                  isAnimationActive={false}
                  yAxisId="right"
                  dataKey="meetings"
                  fill="lightBlue"
                  legendType="none"
                />
                <Legend />
                <CartesianGrid yAxisId="left" vertical={false} opacity={0.4} />

                <Line
                  isAnimationActive={false}
                  legendType="plainline"
                  name={t('floor-area.living-area')}
                  type="monotone"s
                  dataKey={LIVING}
                  stroke="#0000BF"
                  strokeWidth="2px"
                  dot={false}
                  yAxisId="left"
                />

                <Line
                  isAnimationActive={false}
                  legendType="none"
                  type="monotone"
                  dataKey={LIVING + PREDICTION}
                  stroke="#0000BF"
                  strokeDasharray="3 3"
                  strokeWidth="2px"
                  dot={false}
                  yAxisId="left"
                />

                <Line
                  isAnimationActive={false}
                  legendType="plainline"
                  name={t('floor-area.business-area')}
                  type="monotone"
                  dataKey={BUSINESS_PREMISES}
                  stroke="green"
                  strokeWidth="2px"
                  dot={false}
                  yAxisId="left"
                />
                <Line
                  isAnimationActive={false}
                  legendType="none"
                  type="monotone"
                  dataKey={BUSINESS_PREMISES + PREDICTION}
                  stroke="green"
                  strokeDasharray="3 3"
                  strokeWidth="2px"
                  dot={false}
                  yAxisId="left"
                />
                <Line
                  isAnimationActive={false}
                  legendType="plainline"
                  name={t('floor-area.total-area')}
                  type="monotone"
                  dataKey={TOTAL}
                  stroke="black"
                  strokeWidth="2px"
                  dot={false}
                  yAxisId="left"
                />
                <Line
                  isAnimationActive={false}
                  legendType="none"
                  type="monotone"
                  dataKey={TOTAL + PREDICTION}
                  stroke="black"
                  strokeDasharray="3 3"
                  strokeWidth="2px"
                  dot={false}
                  yAxisId="left"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        
      </div>
      <Legends centered={true} />
    </div>
  )
}

FloorAreaChart.propTypes = {
  chartData: PropTypes.object.isRequired,
  filters: PropTypes.array.isRequired
}

const mapDispatchToProps = {
  getProjectsOverviewFloorArea,
  clearProjectsOverviewFloorArea,
  setProjectsOverviewFloorAreaFilter,
  getProjectsOverviewFloorAreaTargets
}

const mapStateToProps = state => {
  return {
    chartData: projectOverviewFloorAreaSelector(state),
    storedFilter: projectOverviewFloorAreaFiltersSelector(state),
    floorAreaTargets: projectOverviewFloorAreaTargetsSelector(state)
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(FloorAreaChart))
