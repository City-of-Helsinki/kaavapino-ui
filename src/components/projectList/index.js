import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  fetchProjects,
  fetchOwnProjects,
  fetchOnholdProjects,
  fetchArchivedProjects
} from '../../actions/projectActions'
import { fetchProjectSubtypes } from '../../actions/projectTypeActions'
import { fetchUsers } from '../../actions/userActions'
import { projectSubtypesSelector } from '../../selectors/projectTypeSelector'
import { usersSelector } from '../../selectors/userSelector'
import { createProject, clearProjects, getProjectsOverviewFilters } from '../../actions/projectActions'
import {
  ownProjectsSelector,
  projectsSelector,
  amountOfProjectsToShowSelector,
  totalOwnProjectsSelector,
  totalArchivedProjectsSelector,
  totalOnholdProjectsSelector,
  totalProjectsSelector,
  onholdProjectSelector,
  archivedProjectSelector,
  projectOverviewFiltersSelector
} from '../../selectors/projectSelector'
import { NavHeader } from '../common/NavHeader'
import NewProjectFormModal from '../project/EditProjectModal/NewProjectFormModal'
import List from './List'
import { withTranslation } from 'react-i18next'
import { userIdSelector } from '../../selectors/authSelector'
import { withRouter } from 'react-router-dom'
import { Tabs, Pagination } from 'hds-react'
import Header from '../common/Header'
import authUtils from '../../utils/authUtils'
import OwnProjectFilters from './OwnProjectFilters'
import { Radio } from 'semantic-ui-react'
import { isEqual } from 'lodash'

class ProjectListPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showBaseInformationForm: false,
      filter: [],
      activeIndex: 1,
      screenWidth: window.innerWidth,
      currentFilterData:this.props.filterData,
      pageIndex:0,
      showGraph: false,
      pageLimit:10,
      projectsTotal:[0,0,0,0],
      resultsFound:[null,null,null,null],
      tabName:false,
      tabDir:0
    }
  }

  componentDidMount() {
    const {
      t,
      fetchUsers,
      fetchProjectSubtypes,
      getProjectsOverviewFilters,
    } = this.props

    document.title = t('title')
    fetchUsers()
    fetchProjectSubtypes()
    getProjectsOverviewFilters()
    window.addEventListener('resize', this.handleWindowSizeChange)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange)
    this.props.clearProjects()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.filterData !== this.props.filterData) {
      this.setState({currentFilterData:this.props.filterData})
    }
    if(prevProps.users !== this.props.users){
      const isExpert = authUtils.isExpert(this.props.currentUserId, this.props.users)

      if(isExpert){
        this.fetchProjectsByTabIndex(1,0,false,0)
        this.setState({activeIndex:1})
      }
      else{
        this.fetchProjectsByTabIndex(2,0,false,0)
        this.setState({activeIndex:2})
      }
    }
    
    let pageCount = 0;
    let projectsTotalArray = this.state.projectsTotal
    if(prevProps.totalOwnProjects !== this.props.totalOwnProjects){
      pageCount = Math.ceil(this.props.totalOwnProjects/this.state.pageLimit);
      projectsTotalArray[0] = pageCount
      this.setState({projectsTotal:projectsTotalArray})
      this.setState({resultsFound:[this.props.totalOwnProjects,this.props.totalProjects,this.props.totalOnholdProjects,this.props.totalArchivedProjects]})
    }
    if(prevProps.totalProjects !== this.props.totalProjects){
      pageCount = Math.ceil(this.props.totalProjects/this.state.pageLimit);
      projectsTotalArray[1] = pageCount
      this.setState({projectsTotal:projectsTotalArray})
      this.setState({resultsFound:[this.props.totalOwnProjects,this.props.totalProjects,this.props.totalOnholdProjects,this.props.totalArchivedProjects]})
    }
    if(prevProps.totalOnholdProjects !== this.props.totalOnholdProjects){
      pageCount = Math.ceil(this.props.totalOnholdProjects/this.state.pageLimit);
      projectsTotalArray[2] = pageCount
      this.setState({projectsTotal:projectsTotalArray})
      this.setState({resultsFound:[this.props.totalOwnProjects,this.props.totalProjects,this.props.totalOnholdProjects,this.props.totalArchivedProjects]})
    }
    if(prevProps.totalArchivedProjects !== this.props.totalArchivedProjects){
      pageCount = Math.ceil(this.props.totalArchivedProjects/this.state.pageLimit);
      projectsTotalArray[3] = pageCount
      this.setState({projectsTotal:projectsTotalArray})
      this.setState({resultsFound:[this.props.totalOwnProjects,this.props.totalProjects,this.props.totalOnholdProjects,this.props.totalArchivedProjects]})
    }
  }

  handleWindowSizeChange = () => {
    this.setState({ screenWidth: window.innerWidth })
  }

  toggleForm = opened => this.setState({ showBaseInformationForm: opened })

  toggleSearch = opened => {
    if (!opened) {
      if(this.state.activeIndex){
        this.fetchProjectsByTabIndex(this.state.activeIndex,this.state.pageIndex,this.state.tabName,this.state.tabDir)
      }
    }
  }

  fetchFilteredItems = (values) => {
    let pageIndex
    //Set page index to 0 when filtering with new search
    if(!isEqual(values, this.state.filter)){
      pageIndex = 0
    }
    else{
      pageIndex = this.state.pageIndex
    }
    this.setState({ filter: values }, () => {
      this.props.clearProjects()
      this.fetchProjectsByTabIndex(this.state.activeIndex,pageIndex,this.state.tabName,this.state.tabDir)
    })
  }

  handleTabChange = (activeIndex) => {
    this.fetchProjectsByTabIndex(activeIndex,0,this.state.tabName,this.state.tabDir)
    this.setState({ activeIndex, pageIndex:0 })
  }

  createReports = () => {
    const { history } = this.props
    history.push('/reports')
  }

  sortField = (name,dir) => {
    const sortField = this.props.t('sorting.'+name)
    this.setState({tabName:sortField,tabDir:dir})
    this.fetchProjectsByTabIndex(this.state.activeIndex,this.state.pageIndex,sortField,dir)
  } 

  getOwnProjectsPanel = () => {
    const {
      users,
      projectSubtypes,
      totalOwnProjects,
      ownProjects,
      currentUserId
    } = this.props

    const isExpert = authUtils.isExpert(currentUserId, users)

    return (
      <List
        showGraph={this.state.showGraph}
        projectSubtypes={projectSubtypes}
        users={users}
        items={ownProjects}
        total={totalOwnProjects}
        isExpert={isExpert}
        toggleSearch={this.toggleSearch}
        setFilter={this.setFilter}
        buttonAction={this.fetchFilteredItems}
        newProjectTab={'own'}
        modifyProject={this.modifyProject}
        sortField={this.sortField}
      />
    )
  }

  getTotalProjectsPanel = () => {
    const {
      users,
      projectSubtypes,
      totalProjects,
      allProjects,
      currentUserId
    } = this.props

    const isExpert = authUtils.isExpert(currentUserId, users)

    return (
      <List
        showGraph={this.state.showGraph}
        toggleSearch={this.toggleSearch}
        projectSubtypes={projectSubtypes}
        users={users}
        items={allProjects}
        total={totalProjects}
        setFilter={this.setFilter}
        isExpert={isExpert}
        newProjectTab={'all'}
        modifyProject={this.modifyProject}
        sortField={this.sortField}
      />
    )
  }

  getOnholdProjectsPanel = () => {
    const {
      users,
      projectSubtypes,
      totalOnholdProjects,
      onholdProjects,
      currentUserId
    } = this.props

    const isExpert = authUtils.isExpert(currentUserId, users)

    return (
      <List
        showGraph={this.state.showGraph}
        projectSubtypes={projectSubtypes}
        users={users}
        items={onholdProjects}
        total={totalOnholdProjects}
        setFilter={this.setFilter}
        isExpert={isExpert}
        newProjectTab={'onhold'}
        modifyProject={this.modifyProject}
        sortField={this.sortField}
      />
    )
  }

  getArchivedProjectsPanel = () => {
    const {
      users,
      projectSubtypes,
      totalArchivedProjects,
      archivedProjects,
      currentUserId
    } = this.props

    const isExpert = authUtils.isExpert(currentUserId, users)

    return (
      <List
        showGraph={this.state.showGraph}
        projectSubtypes={projectSubtypes}
        users={users}
        items={archivedProjects}
        total={totalArchivedProjects}
        setFilter={this.setFilter}
        isExpert={isExpert}
        newProjectTab={'onhold'}
        modifyProject={this.modifyProject}
        sortField={this.sortField}
      />
    )
  }

  modifyProject = id => {
    this.props.history.push(`/${id}/edit`)
  }

  createTabPanes = () => {
    const {
      users,
      currentUserId
    } = this.props

    const isExpert = authUtils.isExpert(currentUserId, users)
    const index = this.state.activeIndex;
    let tabPanel;
    {
      switch(index) {
        case 1:
          tabPanel = <Tabs.TabPanel>{this.getOwnProjectsPanel()}</Tabs.TabPanel>
          break;
        case 2:
          tabPanel = <Tabs.TabPanel>{this.getTotalProjectsPanel()}</Tabs.TabPanel>
          break;
        case 3:
          tabPanel = <Tabs.TabPanel>{this.getOnholdProjectsPanel()}</Tabs.TabPanel>
          break;
        case 4:
          tabPanel = <Tabs.TabPanel>{this.getArchivedProjectsPanel()}</Tabs.TabPanel>
          break;
        default:
          tabPanel = <Tabs.TabPanel>{this.getTotalProjectsPanel()}</Tabs.TabPanel>
      }
    }
    return isExpert ? (
      <Tabs>
        {tabPanel}
      </Tabs>
    ) : (
      <Tabs>
        <Tabs.TabPanel>{this.getTotalProjectsPanel()}</Tabs.TabPanel>
      </Tabs>
    )
  }

  createTabList = () => {
    const {
      users,
      currentUserId
    } = this.props

    const isExpert = authUtils.isExpert(currentUserId, users)

    return isExpert ? (
      <Tabs>
        <Tabs.TabList>
          <Tabs.Tab key={1} onClick={() => this.handleTabChange(1)}>{this.getOwnProjectsTitle()}</Tabs.Tab>
          <Tabs.Tab key={2} onClick={() => this.handleTabChange(2)}>{this.getTotalProjectsTitle()}</Tabs.Tab>
          <Tabs.Tab key={3} onClick={() => this.handleTabChange(3)}>{this.getOnholdProjectsTitle()}</Tabs.Tab>
          <Tabs.Tab key={4} onClick={() => this.handleTabChange(4)}>{this.getArchivedProjectsTitle()}</Tabs.Tab>
        </Tabs.TabList>
      </Tabs>
    ) : (
      <Tabs>
        <Tabs.TabList>
          <Tabs.Tab>{this.getTotalProjectsTitle()}</Tabs.Tab>
        </Tabs.TabList>
      </Tabs>
    )
  }

  openCreateProject = () => {
    this.toggleForm(true)
  }

  getOwnProjectsTitle = () => {
    const { t } = this.props
    const { screenWidth } = this.state
    return `${screenWidth < 600 ? t('projects.own-short') : t('projects.own-long')}`
  }

  getTotalProjectsTitle = () => {
    const { screenWidth } = this.state

    const { t } = this.props

    return `${screenWidth < 600 ? t('projects.all-short') : t('projects.all-long')}`
  }

  getOnholdProjectsTitle = () => {
    const { screenWidth } = this.state

    const { t } = this.props

    return `${screenWidth < 600 ? t('projects.onhold-short') : t('projects.onhold-long')}`
  }
  getArchivedProjectsTitle = () => {
    const { screenWidth } = this.state

    const { t } = this.props

    return `${screenWidth < 600 ? t('projects.archived-short') : t('projects.archived-long')}`
  }

  getFilters = key => {
    const filters = []

    this.state.currentFilterData &&
      this.state.currentFilterData.forEach(filter => {
        if (filter[key]) {
          filters.push(filter)
        }
      })
    return filters
  }

  setPageIndex = (index) => {
    this.setState({pageIndex:index})
    if(this.state.activeIndex){
      this.fetchProjectsByTabIndex(this.state.activeIndex,index,this.state.tabName,this.state.tabDir)
    }
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

  fetchProjectsByTabIndex = (index,pageIndex,name,dir) => {
    switch(index) {
      case 1:
        this.props.fetchOwnProjects(this.state.pageLimit,pageIndex,this.state.filter,name,dir)
        break;
      case 2:
        this.props.fetchProjects(this.state.pageLimit,pageIndex,this.state.filter,name,dir)
        break;
      case 3:
        this.props.fetchOnholdProjects(this.state.pageLimit,pageIndex,this.state.filter,name,dir)
        break;
      case 4:
        this.props.fetchArchivedProjects(this.state.pageLimit,pageIndex,this.state.filter,name,dir)
        break;
      default:
        this.props.fetchProjects(this.state.pageLimit,pageIndex,this.state.filter,name,dir)
    }
  }

  render() {
    const {
      users,
      currentUserId,
      projectSubtypes,
      createProject
    } = this.props

    const { showBaseInformationForm } = this.state

    const { t } = this.props

    const isExpert = authUtils.isExpert( currentUserId, users)
    return (
      <>
        <Header
          createProject={true}
          openCreateProject={this.openCreateProject}
        />

        <div className="project-list-page">
          <NavHeader
            routeItems={[{ value: t('projects.title'), path: '/' }]}
            title={t('projects.title')}
          />
          <NewProjectFormModal
            modalOpen={showBaseInformationForm}
            handleSubmit={createProject}
            handleClose={() => this.toggleForm(false)}
            users={users}
            projectSubtypes={projectSubtypes}
          />
          <div className="project-list-container">{this.createTabList()}</div>
          <OwnProjectFilters
            filters={this.getFilters('filters_floor_area')}
            isPrivileged={isExpert}
            buttonAction={this.fetchFilteredItems}
          />
          <div className='project-list-result'>
            <span className='project-list-result-number'>{t('project.searchterms-found')} {this.state.resultsFound[this.state.activeIndex -1]} {t('project.found-projects')}</span>
            <div className="timeline-header-item  project-timeline-toggle">
              <span className='toggle-text'>{t('project.show-timelines')}</span>
              <Radio onChange={() => this.toggleGraph()} aria-label={t('project.show-timelines')} toggle checked={this.state.showGraph} />
            </div>
          </div>
          <div className="project-list-container">{this.createTabPanes()}</div>
          <div className='project-list-pagination'>
          <Pagination
            language="fi"
            onChange={(event, index) => {
              event.preventDefault();
              this.setPageIndex(index);
            }}
            pageCount={this.state.projectsTotal[this.state.activeIndex -1]}
            pageHref={() => '#'}
            pageIndex={this.state.pageIndex}
            paginationAriaLabel="Projektit sivutus"
          />
          </div>
        </div>
      </>
    )
  }
}

const mapStateToProps = state => {
  return {
    ownProjects: ownProjectsSelector(state),
    allProjects: projectsSelector(state),
    filterData: projectOverviewFiltersSelector(state),
    users: usersSelector(state),
    projectSubtypes: projectSubtypesSelector(state),
    amountOfProjectsToShow: amountOfProjectsToShowSelector(state),
    totalOwnProjects: totalOwnProjectsSelector(state),
    totalOnholdProjects: totalOnholdProjectsSelector(state),
    totalArchivedProjects :totalArchivedProjectsSelector(state),
    totalProjects: totalProjectsSelector(state),
    currentUserId: userIdSelector(state),
    onholdProjects: onholdProjectSelector(state),
    archivedProjects: archivedProjectSelector(state),
  }
}

const mapDispatchToProps = {
  createProject,
  fetchProjects,
  fetchOwnProjects,
  getProjectsOverviewFilters,
  fetchUsers,
  fetchProjectSubtypes,
  clearProjects,
  fetchArchivedProjects,
  fetchOnholdProjects
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProjectListPage))
)
