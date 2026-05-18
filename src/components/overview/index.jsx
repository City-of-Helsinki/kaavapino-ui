import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Grid, Segment } from 'semantic-ui-react'
import CustomMap from './CustomMap'
import FloorAreaChart from './FloorAreaChart'
import ProjectsChart from './ProjectsChart'
import './styles.scss'
import { NavHeader } from '../common/NavHeader'
import { connect } from 'react-redux'
import {
  getProjectsOverviewFilters,
  clearProjectsOverview
} from '../../actions/projectActions'
import { projectOverviewFiltersSelector } from '../../selectors/projectSelector'
import { fetchUsers } from '../../actions/userActions'
import { usersSelector } from '../../selectors/userSelector'
import { userIdSelector } from '../../selectors/authSelector'
import authUtils from '../../utils/authUtils'
import MobileView from './MobileView'
import Header from '../common/Header'
import PropTypes from 'prop-types'

const Overview = ({
  getProjectsOverviewFilters,
  filterData,
  fetchUsers,
  currentUserId,
  users,
  clearProjectsOverview,
}) => {
  const { t } = useTranslation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 720)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 720);
    };
    window.addEventListener('resize', handleResize);
    getProjectsOverviewFilters();
    fetchUsers();
    document.title = "Kaavapino - " + t('overview.title');
    return () => {
      if (document.title === "Kaavapino - " + t('overview.title')) {
        document.title = "Kaavapino";
      }
      clearProjectsOverview();
      window.removeEventListener('resize', handleResize);
    };
  }, [])

  useEffect(() => {
    clearProjectsOverview()
  }, [isMobile])

  const getFilters = key => {
    const filters = []

    filterData?.forEach(filter => {
        if (filter[key]) {
          filters.push(filter)
        }
      })
    return filters
  }

  const isResponsible = authUtils.isResponsible( currentUserId, users)
  const isExpert = authUtils.isExpert( currentUserId, users)
  
  if (isMobile) {
    return (
      <MobileView
        filterList={filterData}
        isExpert={isExpert}
        isResponsible={isResponsible}
      />
    )
  }

  return (
    <>
      <Header/>
      <main id="main" className="overview">
        <NavHeader
          title={t('overview.title')}
        />
        <Grid stackable columns="equal">
          <Grid.Column>
            <Segment>
              <CustomMap
                isPrivileged={isExpert}
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
                isPrivileged={isExpert}
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
      </main>
    </>
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

Overview.propTypes = {
  getProjectsOverviewFilters: PropTypes.func.isRequired,
  filterData: PropTypes.array.isRequired,
  fetchUsers: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired,
  clearProjectsOverview: PropTypes.func.isRequired,
}

export default connect(mapStateToProps, mapDispatchToProps)(Overview)