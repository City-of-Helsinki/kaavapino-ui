import React, { useState, useEffect } from 'react'
import FloorAreaMobile from './FloorAreaMobile'
import { Segment } from 'semantic-ui-react'
import { useTranslation } from 'react-i18next'
import FloorAreaMeetings from './FloorAreaMeetingsMobile'
import { Button } from 'hds-react'
import FilterModal from './Filters/FilterModal'
import CustomMapMobile from './CustomMapMobile'
import { connect } from 'react-redux'
import {
  getProjectsOverviewMapData,
  getProjectsOverviewFloorArea,
  clearProjectsOverview
} from '../../actions/projectActions'
import Header from '../common/Header'


function MobileView({
  isPrivileged,
  filterList,
  getProjectsOverviewMapData,
  getProjectsOverviewFloorArea,
  clearProjectsOverview,
  user,
  userRole
}) {
  const { t } = useTranslation()

  const [filter, setFilter] = useState({})

  const [showFilterModal, setShowFilterModal] = useState(false)

  const onFilterSet = value => {
    setFilter(value)
  }

  useEffect(() => {

    clearProjectsOverview()

    getProjectsOverviewMapData(filter)
    getProjectsOverviewFloorArea(filter)
  }, [filter])

  useEffect(() => {
    return () => {
      setFilter({})
    }
  }, [])
  const getFilterAmount = () => {
    let amount = 0
    const keys = Object.keys( filter )

    keys.forEach( key => {
      if ( filter[key] ) {  
        amount = amount + filter[key].length
      }
    })

    return amount
  }

  const filterAmount = getFilterAmount()

  return (
    <div>
     <Header user={user} userRole={userRole}/>
      <FilterModal
        open={showFilterModal}
        filterList={filterList}
        setFilter={onFilterSet}
        currentFilter={filter}
        handleClose={() => {
          setShowFilterModal(false)
        }}
      />
      <div className="overview">
        <h3 className="mobile-header">{t('overview.title')}</h3>
        <Button
          className="overview-filter-button"
          variant="secondary"
          onClick={() => {
            showFilterModal ? setShowFilterModal(false) : setShowFilterModal(true)
          }}
        >
          {t('overview.filter-button')}
          {filterAmount > 0 && <span>({filterAmount})</span>}
        </Button>
        <Button
          className="overview-filter-button"
          variant="secondary"
          onClick={() => {
            setFilter({})
          }}
        >
          {t('overview.clear')}
        </Button>
        <Segment key="map">
          <CustomMapMobile isPrivileged={isPrivileged} />
        </Segment>
        <Segment key="floor-area">
          <FloorAreaMobile isPrivileged={isPrivileged} />
        </Segment>
        <Segment key="floor-area-meetings">
          <FloorAreaMeetings isPrivileged={isPrivileged} />
        </Segment>
      </div>
    </div>
  )
}

const mapDispatchToProps = {
  getProjectsOverviewMapData,
  getProjectsOverviewFloorArea,
  clearProjectsOverview
}

export default connect(null, mapDispatchToProps)(MobileView)
