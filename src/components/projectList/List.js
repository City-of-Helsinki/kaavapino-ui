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
      showGraph: false,
      sort: 5,
      dir: 1,
      projectTab: 'own'
    }
  }

  setSort = type => {
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

    this.props.sortProjects({ sort: newSort, dir: newDir })

    this.setState({
      ...this.state,
      sort: newSort,
      dir: newDir,
      showGraph: false
    })
  }

  toggleGraph = () => {
    if (this.state.showGraph) {
      this.setState({
        ...this.state,
        showGraph: false
      })
    } else {
      this.setState({
        ...this.state,
        showGraph: true
      })
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { newProjectTab } = nextProps
    const { projectTab } = prevState
    if (newProjectTab && newProjectTab !== projectTab) {
      return {
        showGraph: false,
        projectTab: newProjectTab
      }
    } else {
      return null
    }
  }

  render() {
    const { sort, dir, showGraph } = this.state
    const {
      loadingProjects,
      phases,
      projectSubtypes,
      users,
      searchOpen,
      toggleSearch,
      isExpert,
      modifyProject,
      t
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
      t('projects.table.pino-number'),
      t('projects.table.project'),
      t('projects.table.name'),
      t('projects.table.phase'),
      t('projects.table.size'),
      t('projects.table.modified'),
      t('projects.table.responsible')
    ]

    let projects = []

    items.forEach(
      (
        { attribute_data, name, id, modified_at, user, subtype, phase, pino_number, deadlines, onhold },
        i
      ) => {
        const listItem = {
          ...projectUtils.formatPhase(phase, phases),
          name,
          id,
          pino_number,
          modified_at: projectUtils.formatDate(modified_at),
          user: projectUtils.formatUsersName(users.find(u => u.id === user)),
          subtype: projectUtils.formatSubtype(subtype, projectSubtypes),
          projectId: attribute_data['hankenumero'] || '-'
        }
        projects.push(
          <ListItem
            key={i}
            modifyProject={modifyProject}
            item={listItem}
            showGraph={showGraph}
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
            toggleGraph={this.toggleGraph}
            graphToggled={showGraph}
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
