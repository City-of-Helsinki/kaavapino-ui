import React from 'react'
import PropTypes from 'prop-types'
import { projectOverviewFloorAreaSelector } from '../../selectors/projectSelector'

import { connect } from 'react-redux'
import { Accordion, LoadingSpinner, Card } from 'hds-react'
import { withRouter } from 'react-router-dom'
import dayjs from 'dayjs'
import { Grid } from 'semantic-ui-react'
import { useTranslation } from 'react-i18next'

function FloorAreaMeetings({ chartData }) {
  const { t } = useTranslation()

  const getFormattedHeaderDate = date => {
    return dayjs(date).format(t('dateformat'))
  }
  const renderMeetings = () => {
    const items =
      chartData &&
      chartData.daily_stats &&
      chartData.daily_stats.map(item => renderItem(item))

    const realMeetings = []

    items.forEach(item => {
      if (item) {
        realMeetings.push(item)
      }
    })

    return realMeetings.length > 2 ? realMeetings.slice(0, 3) : realMeetings
  }

  const renderItem = item => {
    if (!item.meetings || item.meetings.length === 0) {
      return null
    }

    return (
      <Accordion
        heading={t('overview.mobile-accordion-title', {
          date: getFormattedHeaderDate(item.date),
          meetings: item.meetings
        })}
        className="mobile-accordion"
        headingLevel={4}
        key={item.date}
      >
        {renderProjects(item.projects)}
      </Accordion>
    )
  }
  const renderProjects = projects => {
    if (!projects || projects.length === 0) {
      return <div>{t('project.no-projects')}</div>
    }
    return projects.map(project => renderProject(project))
  }

  const renderProject = project => {
    return (
      <div key={project.id}>
        <Card className="mobile-project-meetings">
          <Grid columns="equal" textAlign="left">
            <Grid.Column width={10}>
              <div>{project.pino_number}</div>
              <div>{project.name}</div>
              <div>{project.subtype.name}</div>
            </Grid.Column>
            <Grid.Column textAlign="left">
              <span
                style={{ backgroundColor: project.phase.color_code }}
                className="dot"
              ></span>
              <span className="value">{project.phase.name}</span>
            </Grid.Column>
          </Grid>
        </Card>
        <br />
      </div>
    )
  }

  const isChartDataLoaded = () => {
    if (!chartData || Object.entries(chartData).length === 0) {
      return false
    }
    return true
  }
  return (
    <div className="floor-area">
      <div className="chart-area-header-mobile">
        <h3>{t('floor-area.meetings-title')}</h3>
        {!isChartDataLoaded() && <LoadingSpinner className="center" />}
        {isChartDataLoaded() && <div>{renderMeetings()}</div>}
      </div>
    </div>
  )
}

FloorAreaMeetings.propTypes = {
  chartData: PropTypes.object.isRequired
}
const mapStateToProps = state => {
  return {
    chartData: projectOverviewFloorAreaSelector(state)
  }
}

export default withRouter(connect(mapStateToProps)(FloorAreaMeetings))
