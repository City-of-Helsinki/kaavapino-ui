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
import { Table, LoadingSpinner } from 'hds-react'
import { withTranslation } from 'react-i18next';
import { truncate } from 'lodash'
import { Link } from 'react-router-dom'
import { Popup } from 'semantic-ui-react'
import ProjectTimeline from '../ProjectTimeline/ProjectTimeline'

const Status = ({ color }) => {
  return (
    <span
      className="project-status-color"
      style={{
        backgroundColor: color,
        ...(color === '#ffffff' && { border: '1px solid' })
      }}
    />
  )
}

class List extends Component {
  constructor(props) {
    super(props)

    this.state = {
      sort: 5,
      dir: 1,
      projectTab: 'own',
      name:'',
      dirname:'asc'
    }
  }

  setSort = (type,name) => {
    console.log(type,name)
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
      if (dir === 0) {
        newDir = 1
      } else {
        newDir = 0
      }
    }
    console.log(dir,type,sort)
    this.setState({
      ...this.state,
      sort: newSort,
      dir: newDir,
      name,
      dirname:type
    })
    this.props.sortField(name,dir)
    this.props.sortProjects({ sort: newSort, dir: newDir })
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

  headerItems = [
    {key:this.props.t('projects.table.priority'),headerName:this.props.t('projects.table.priority'),isSortable: true},
    {key:this.props.t('projects.table.name'),headerName:this.props.t('projects.table.name'),isSortable: true},
    {key:this.props.t('projects.table.project'),headerName:this.props.t('projects.table.project'),isSortable: true},
    {key:this.props.t('projects.table.pino-number'),headerName:this.props.t('projects.table.pino-number'),isSortable: true,sortIconType: 'other'},
    {key:this.props.t('projects.table.size'),headerName:this.props.t('projects.table.size'),isSortable: true},
    {key:this.props.t('projects.table.responsible'),headerName:this.props.t('projects.table.responsible'),isSortable: true},
    {key:this.props.t('projects.table.phase'),headerName:this.props.t('projects.table.phase'),isSortable: true},
    {key:this.props.t('projects.table.modified'),headerName:this.props.t('projects.table.modified'),isSortable: true,sortIconType: 'other'}
  ]

  headerItemsMobile = [
    this.props.t('projects.table.priority'),
    this.props.t('projects.table.name'),
    this.props.t('projects.table.project'),
    this.props.t('projects.table.pino-number'),
    this.props.t('projects.table.size'),
    this.props.t('projects.table.responsible'),
    this.props.t('projects.table.phase'),
    this.props.t('projects.table.modified')
  ]

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

    let projects = []
    let rows = []

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
        //Mobile
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
        
        //Desktop
        const prioField = this.props.t('projects.table.priority');
        const nameField = this.props.t('projects.table.name');
        const projecField = this.props.t('projects.table.project');
        const pinoField = this.props.t('projects.table.pino-number');
        const sizeField = this.props.t('projects.table.size');
        const responsibleField = this.props.t('projects.table.responsible');
        const phaseField = this.props.t('projects.table.phase');
        const modifiedField = this.props.t('projects.table.modified');

        let rowObject = {}
        rowObject[prioField] = listItem.prio
        rowObject[nameField] = <Popup trigger={<Link to={`/${listItem.id}`}>{truncate(listItem.name, { length: 30 })}</Link>} on="hover" content={listItem.name}/>
        rowObject[projecField] = listItem.projectId
        rowObject[pinoField] = listItem.pino_number
        rowObject[sizeField] = listItem.subtype
        rowObject[responsibleField] = <Popup trigger={<span>{listItem.user}</span>} on="hover" content={listItem.user}/>
        rowObject[phaseField] = <span className='project-status-container'><Status color={listItem.phaseColor} /> <span className='project-status-text'>{listItem.phaseName}</span></span>
        rowObject[modifiedField] = listItem.modified_at
        
        rows.push(rowObject)
        let rowObject2 = {}
        
        rowObject2[prioField] = this.props.showGraph && ( <span className="project-list-item-graph"> <ProjectTimeline deadlines={deadlines} projectView={true} onhold={onhold} /></span>)
        rows.push(rowObject2)
      }
    )

    let showGraphStyle = this.props.showGraph ? "project-list showGraph" : "project-list"
    return (
      <>
        <div className={showGraphStyle}>
          <Table
            ariaLabelSortButtonUnset="Not sorted"
            ariaLabelSortButtonAscending="Sorted in ascending order"
            ariaLabelSortButtonDescending="Sorted in descending order"
            indexKey="id"
            renderIndexCol={false}
            cols={this.headerItems}
            rows={rows}
            initialSortingColumnKey={this.state.name}
            initialSortingOrder={this.state.dirname}
          // selected={sort}
          // dir={dir}
          //  sort={this.setSort}
            onSort={(order, colKey, handleSort) => {
                this.setSort(order,colKey)
                handleSort(order,colKey)
            }}
          />
          {items.length === 0 && <span className="empty-list-info">Ei projekteja!</span>}
        </div>
        <div className="project-list-mobile">
        {items.length > 0 && (
          <ListHeader
            toggleSearch={toggleSearch}
            searchOpen={searchOpen}
            items={this.headerItemsMobile}
            selected={sort}
            dir={dir}
            sort={this.setSort}
            sortField={sortField}
          />
        )} 
        {projects.length !== 0 && projects} 
        {items.length === 0 && <span className="empty-list-info">Ei projekteja!</span>}
      </div>
    </>
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
