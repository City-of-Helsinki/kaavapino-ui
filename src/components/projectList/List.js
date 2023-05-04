import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  increaseAmountOfProjectsToShow,
  sortProjects,
  setAmountOfProjectsToIncrease
} from '../../actions/projectActions'
import { phasesSelector } from '../../selectors/phaseSelector'
import {
  loadingProjectsSelector,
  pollingProjectsSelector,
  amountOfProjectsToIncreaseSelector
} from '../../selectors/projectSelector'
import ListHeader from './ListHeader'
import ListItem from './ListItem'
import projectUtils from '../../utils/projectUtils'
import { LoadingSpinner } from 'hds-react'
import { withTranslation } from 'react-i18next';

class List extends Component {
  constructor(props) {
    super(props)

    this.state = {
      sort: 5,
      dir: 1,
      projectTab: 'own'
    }
  }

  setSort = (type,name) => {
    const { sort, dir } = this.state
    let newSort = sort,
      newDir = dir
    if (type === sort) {
      if (dir === 0) {
        newDir = 1
      } else {
        newDir = 0
      }
    } else {
      newSort = type
      newDir = 0
    }
    this.props.sortField(name,dir)
    this.props.sortProjects({ sort: newSort, dir: newDir })

    this.setState({
      ...this.state,
      sort: newSort,
      dir: newDir
    })
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { newProjectTab } = nextProps
    const { projectTab } = prevState
    if (newProjectTab && newProjectTab !== projectTab) {
      return {
        projectTab: newProjectTab
      }
    } else {
      return null
    }
  }

  render() {
    const { sort, dir } = this.state
    const {
      loadingProjects,
      phases,
      projectSubtypes,
      users,
      searchOpen,
      toggleSearch,
      isExpert,
      modifyProject,
      t,
      sortField
    } = this.props

    if (loadingProjects || !phases) {
      return (
        <div className="project-list">
          <LoadingSpinner className="loader-icon" position="center" />
        </div>
      )
    }

    const items = this.props.items
    const headerItems = [
      t('projects.table.priority'),
      t('projects.table.name'),
      t('projects.table.project'),
      t('projects.table.pino-number'),
      t('projects.table.size'),
      t('projects.table.responsible'),
      t('projects.table.phase'),
      t('projects.table.modified')
    ]

    let projects = []

    items.forEach(
      (
        { attribute_data, name, id, user, subtype, phase, pino_number, deadlines, onhold, priority, modified_at },
        i
      ) => {
        let prio
        if(priority){
          prio = priority.name
        }
        else{
          prio = ""
        }
        const listItem = {
          prio,
          name,
          projectId: attribute_data['hankenumero'] || '-',
          id,
          pino_number,
          subtype: projectUtils.formatSubtype(subtype, projectSubtypes),
          user: projectUtils.formatUsersName(users.find(u => u.id === user)),
          ...projectUtils.formatPhase(phase, phases),
          modified_at: projectUtils.formatDate(modified_at)
        }
        projects.push(
          <ListItem
            key={i}
            modifyProject={modifyProject}
            item={listItem}
            showGraph={this.props.showGraph}
            phases={phases}
            isExpert={isExpert}
            deadlines={deadlines}
            onhold={onhold}
          />
        )
      }
    )
    return (
      <div className="project-list">
        {items.length > 0 && (
          <ListHeader
            toggleSearch={toggleSearch}
            searchOpen={searchOpen}
            items={headerItems}
            selected={sort}
            dir={dir}
            sort={this.setSort}
            sortField={sortField}
          />
        )}
        {projects.length !== 0 && projects}
        {items.length === 0 && <span className="empty-list-info">Ei projekteja!</span>}
      </div>
    )
  }
}

const mapDispatchToProps = {
  increaseAmountOfProjectsToShow,
  sortProjects,
  setAmountOfProjectsToIncrease
}

const mapStateToProps = state => ({
  phases: phasesSelector(state),
  loadingProjects: loadingProjectsSelector(state),
  pollingProjects: pollingProjectsSelector(state),
  amountOfProjectsToIncrease: amountOfProjectsToIncreaseSelector(state)
})

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(List))
