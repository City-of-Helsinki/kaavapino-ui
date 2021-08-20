import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Grid, Segment } from 'semantic-ui-react'
import CustomMap from './CustomMap'
import FloorAreaChart from './FloorAreaChart'
import ProjectsChart from './ProjectsChart'

import './styles.scss'
import { NavHeader } from '../common/NavHeader'
import { connect } from 'react-redux'
import { getProjectsOverviewFilters, clearProjectsOverview } from '../../actions/projectActions'
import { projectOverviewFiltersSelector } from '../../selectors/projectSelector'
import { fetchUsers } from '../../actions/userActions'
import { usersSelector } from '../../selectors/userSelector'
import { userIdSelector } from '../../selectors/authSelector'
import projectUtils from '../../utils/projectUtils'
import MobileView from './MobileView'

const Overview = ({
  getProjectsOverviewFilters,
  filterData,
  fetchUsers,
  currentUserId,
  users,
  clearProjectsOverview
}) => {
  const { t } = useTranslation()
  const [currentFilterData, setCurrentFilterData] = useState(filterData)

  useEffect(() => {
    getProjectsOverviewFilters()
    fetchUsers()
  }, [])

  useEffect(() => {
    setCurrentFilterData(filterData)
  }, [filterData])

  const [isMobile, setIsMobile] = useState(false)

  //choose the screen size
  const handleResize = () => {
    if (window.innerWidth < 720) {
      setIsMobile(true)
    } else {
      setIsMobile(false)
    }
  }
  // create an event listener
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    if (window.innerWidth < 720) {
      setIsMobile(true)
    }
  })
  useEffect(() => {
    return () => {
      clearProjectsOverview()
    };
  }, []);

  const getFilters = key => {
    const filters = []

    currentFilterData &&
      currentFilterData.forEach(filter => {
        if (filter[key]) {
          filters.push(filter)
        }
      })
    return filters
  }

  const isPrivileged = projectUtils.isUserPrivileged(currentUserId, users)

  if (isMobile) {
    return <MobileView filters={getFilters('filters_on_map')} isPrivileged={isPrivileged} />
  }
  return (
    <div className="overview">
      <NavHeader
        routeItems={[{ value: 'Yleisnäkymä', path: '/' }]}
        title={t('overview.title')}
      />
      <Grid stackable columns="equal">
        <Grid.Column>
          <Segment>
            <CustomMap
              isPrivileged={isPrivileged}
              filters={getFilters('filters_on_map')}
              isMobile={isMobile}
            />
          </Segment>
        </Grid.Column>
      </Grid>
      <Grid stackable columns="equal">
        <Grid.Column>
          <Segment>
            <FloorAreaChart
              filters={getFilters('filters_floor_area')}
              isPrivileged={isPrivileged}
            />
          </Segment>
        </Grid.Column>
      </Grid>
      <Grid stackable columns="equal">
        <Grid.Column width={8}>
          <Segment>
            <ProjectsChart filters={getFilters('filters_by_subtype')} />
          </Segment>
        </Grid.Column>
      </Grid>
    </div>
  )
}
const mapDispatchToProps = {
  getProjectsOverviewFilters,
  fetchUsers,
  clearProjectsOverview
}

const mapStateToProps = state => {
  return {
    filterData: projectOverviewFiltersSelector(state),
    users: usersSelector(state),
    currentUserId: userIdSelector(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
