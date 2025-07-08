import React, { useState, useEffect } from 'react'
import {
  BarChart,
  YAxis,
  XAxis,
  CartesianGrid,
  Bar,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import FilterList from './Filters/FilterList'
import { connect } from 'react-redux'
import {
  projectOverviewBySubtypeSelector,
  projectOverviewProjectTypeFiltersSelector
} from '../../selectors/projectSelector'

import {
  getProjectsOverviewBySubtype,
  clearProjectsOverviewProjectTypeData,
  setProjectsOverviewProjectTypeFilter
} from '../../actions/projectActions'
import { LoadingSpinner } from 'hds-react'
import {
  ACCEPTANCE_COLOR,
  CHECKED_PROPOSITION_COLOR,
  DRAFT,
  DRAFT_COLOR,
  getSubtypeChartData,
  INCEPTION_COLOR,
  OAS_COLOR,
  PRINCIPLES_COLOR,
  PROPOSITION_COLOR,
  START_COLOR
} from './bySubtypeChartUtils'

import {
  START,
  INCEPTION,
  OAS,
  PRINCIPLES,
  PROPOSITION,
  CHECKED_PROPOSITION,
  ACCEPTANCE
} from './bySubtypeChartUtils'
import { isEqual } from 'lodash'
import dayjs from 'dayjs'
import { isArray } from 'lodash'

function ProjectsChart({
  filters,
  chartData,
  getProjectsOverviewBySubtype,
  clearProjectsOverviewProjectTypeData,
  setProjectsOverviewProjectTypeFilter,
  storedFilter,
  isMobile
}) {
  const { t } = useTranslation()

  const [filter, setFilter] = useState({})
  const [selectedPhase, setSelectedPhase] = useState({})

  const [currentChartData, setCurrentChartData] = useState(getSubtypeChartData(chartData))
  useEffect(() => {
    getProjectsOverviewBySubtype(filter)
    setCurrentChartData(chartData)
  }, [])

  useEffect(() => {
 
    if (!storedFilter || !isEqual(storedFilter, filter)) {
      clearProjectsOverviewProjectTypeData()
      setCurrentChartData(null)
      getProjectsOverviewBySubtype(filter)
      setProjectsOverviewProjectTypeFilter(filter)
    }
  }, [filter])

  useEffect(() => {
    setCurrentChartData(getSubtypeChartData(chartData))
  }, [chartData])

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

  const CustomizedTooltip = props => {
    if (!selectedPhase.phase || !props.payload) {
      return null
    }
    const currentPhase = props.payload.find(
      phase => phase.dataKey === selectedPhase.phase
    )
    if (!currentPhase) {
      return null
    }
    const currentAmount =
      currentPhase.payload && currentPhase.payload[selectedPhase.phase]

    const localizationText = t('project-types.' + currentPhase.name)

    return (
      <div className="projects-tooltip">
        <div className="title">{localizationText} </div>
        <div className="number">{currentAmount}</div>
      </div>
    )
  }
  if (isMobile) {
    return null
  }

  const currentYear = dayjs(chartData.date).year()
  return (
    <div className="projects-size">
      <div className="header">
        <h3>{t('project-types.title')}</h3>
        <FilterList
          currentFilter={filter}
          onChange={onFilterChange}
          filterList={filters}
          onUserChange={onUserFilterChange}
          defaultYear={currentYear}
        />
      </div>
      {!currentChartData && <LoadingSpinner className="center" />}

      {currentChartData && (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            layout="vertical"
            width={500}
            height={250}
            data={currentChartData.phases}
            minTickGap={0}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip content={<CustomizedTooltip />} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" minTickGap={1} />

            <Bar
              dataKey={START}
              name="kaynnistys"
              stackId="a"
              fill={currentChartData[START_COLOR]}
              onMouseOver={() => setSelectedPhase({ phase: START })}
              onMouseLeave={() => setSelectedPhase({})}
            />
            <Bar
              dataKey={PRINCIPLES}
              name="periaatteet"
              stackId="a"
              fill={currentChartData[PRINCIPLES_COLOR]}
              onMouseOver={() => setSelectedPhase({ phase: PRINCIPLES })}
              onMouseLeave={() => setSelectedPhase({})}
            />
            <Bar
              dataKey={OAS}
              name="OAS"
              stackId="a"
              fill={currentChartData[OAS_COLOR]}
              onMouseOver={() => setSelectedPhase({ phase: OAS })}
              onMouseLeave={() => setSelectedPhase({})}
            />
            <Bar
              dataKey={DRAFT}
              name="luonnos"
              stackId="a"
              fill={currentChartData[DRAFT_COLOR]}
              onMouseOver={() => setSelectedPhase({ phase: DRAFT })}
              onMouseLeave={() => setSelectedPhase({})}
            />
            <Bar
              dataKey={PROPOSITION}
              name="ehdotus"
              stackId="a"
              fill={currentChartData[PROPOSITION_COLOR]}
              onMouseOver={() => setSelectedPhase({ phase: PROPOSITION })}
              onMouseLeave={() => setSelectedPhase({})}
            />
            <Bar
              dataKey={CHECKED_PROPOSITION}
              name="tarkastettuEhdotus"
              stackId="a"
              fill={currentChartData[CHECKED_PROPOSITION_COLOR]}
              onMouseOver={() => setSelectedPhase({ phase: CHECKED_PROPOSITION })}
              onMouseLeave={() => setSelectedPhase({})}
            />
            <Bar
              dataKey={ACCEPTANCE}
              name="hyvaksyminen"
              stackId="a"
              fill={currentChartData[ACCEPTANCE_COLOR]}
              onMouseOver={() => setSelectedPhase({ phase: ACCEPTANCE })}
              onMouseLeave={() => setSelectedPhase({})}
            />
            <Bar
              dataKey={INCEPTION}
              name="voimaantulo"
              stackId="a"
              fill={currentChartData[INCEPTION_COLOR]}
              onMouseOver={() => setSelectedPhase({ phase: INCEPTION })}
              onMouseLeave={() => setSelectedPhase({})}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

ProjectsChart.propTypes = {
  chartData: PropTypes.object,
  filters: PropTypes.array
}

const mapDispatchToProps = {
  getProjectsOverviewBySubtype,
  clearProjectsOverviewProjectTypeData,
  setProjectsOverviewProjectTypeFilter
}

const mapStateToProps = state => {
  return {
    chartData: projectOverviewBySubtypeSelector(state),
    storedFilter: projectOverviewProjectTypeFiltersSelector(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectsChart)
