import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

const Overview = ({
  getProjectsOverviewFilters,
  filterData,
  fetchUsers,
  currentUserId,
  users,
  clearProjectsOverview,
  user,
  userRole
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
    } else {
      setIsMobile(false)
    }
  })
  useEffect(() => {
    return () => {
      clearProjectsOverview()
    }
  }, [])

  useEffect(() => {
    clearProjectsOverview()
  }, [isMobile])

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

  const isResponsible = authUtils.isResponsible( currentUserId, users)
  const isExpert = authUtils.isExpert( currentUserId, users)
  
  if (isMobile) {
    return (
      <MobileView
        filterList={filterData}
        isExpert={isExpert}
        isResponsible={isResponsible}
        user={user}
        userRole={userRole}
      />
    )
  }

  return (
  <>
    <Header />

    <div className="overview">
      <NavHeader
        routeItems={[{ value: t('overview.title'), path: '/' }]}
        title={t('overview.title')}
      />

      {/* Map Section */}
      <div className="hds-grid hds-grid--gap-xl margin-bottom-xl">
        <div className="hds-grid__col">
          <div className="section-box first">
            <CustomMap
              isPrivileged={isExpert}
              filters={getFilters('filters_on_map')}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* Floor Area Chart Section */}
      <div className="hds-grid hds-grid--gap-xl margin-bottom-xl">
        <div className="hds-grid__col">
          <div className="section-box">
            <FloorAreaChart
              filters={getFilters('filters_floor_area')}
              isPrivileged={isExpert}
            />
          </div>
        </div>
      </div>

      {/* Projects Chart Section */}
      <div className="hds-grid hds-grid--gap-xl margin-bottom-xl">
        <div className="hds-grid__col hds-grid__col--8">
          <div className="section-box">
            <ProjectsChart filters={getFilters('filters_by_subtype')} />
          </div>
        </div>
      </div>
    </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
