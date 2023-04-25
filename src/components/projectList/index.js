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

class ProjectListPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showBaseInformationForm: false,
      filter: '',
      activeIndex: 1,
      screenWidth: window.innerWidth,
      currentFilterData:this.props.filterData,
      pageIndex:0,
      showGraph: false,
      pageLimit:10,
      projectsTotal:0
    }
  }

  componentDidMount() {
         /*  fetchOnholdProjects,
      fetchArchivedProjects, */
    const {
      t,
      fetchUsers,
      fetchProjectSubtypes,
      getProjectsOverviewFilters,
    } = this.props

    document.title = t('title')
    fetchUsers()
    fetchProjectSubtypes()
   // fetchOnholdProjects()
   //fetchArchivedProjects()
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
        this.fetchProjectsByTabIndex(1,0)
        this.setState({activeIndex:1})
      }
      else{
        this.fetchProjectsByTabIndex(2,0)
        this.setState({activeIndex:2})
      }
    }
    
    let pageCount = 0;
    if(prevProps.totalProjects !== this.props.totalProjects){
      pageCount = Math.ceil(this.props.totalProjects/this.state.pageLimit);
      this.setState({projectsTotal:pageCount})
    }
    if(prevProps.totalOwnProjects !== this.props.totalOwnProjects){
      pageCount = Math.ceil(this.props.totalOwnProjects/this.state.pageLimit);
      this.setState({projectsTotal:pageCount})
    }
    if(prevProps.totalOnholdProjects !== this.props.totalOnholdProjects){
      pageCount = Math.ceil(this.props.totalOnholdProjects/this.state.pageLimit);
      this.setState({projectsTotal:pageCount})
    }
    if(prevProps.totalArchivedProjects !== this.props.totalArchivedProjects){
      pageCount = Math.ceil(this.props.totalArchivedProjects/this.state.pageLimit);
      this.setState({projectsTotal:pageCount})
    }
  }

  handleWindowSizeChange = () => {
    this.setState({ screenWidth: window.innerWidth })
  }

  toggleForm = opened => this.setState({ showBaseInformationForm: opened })

  toggleSearch = opened => {
    if (!opened) {
      if(this.state.activeIndex){
        this.fetchProjectsByTabIndex(this.state.activeIndex,this.state.pageIndex)
      }
    }
  }

  fetchFilteredItems = value => {
    this.setState({ filter: value }, () => {
      this.props.clearProjects()
      this.fetchProjectsByTabIndex(this.state.activeIndex,this.state.pageIndex)
    })
  }

  handleTabChange = (activeIndex) => {
    this.fetchProjectsByTabIndex(activeIndex,0)
    this.setState({ activeIndex })
  }

  createReports = () => {
    const { history } = this.props
    history.push('/reports')
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
      />
    )
  }

  getOnholdProjectsPanel = () => {
    const {
      users,
      projectSubtypes,
      totalProjects,
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
        total={totalProjects}
        setFilter={this.setFilter}
        isExpert={isExpert}
        newProjectTab={'onhold'}
        modifyProject={this.modifyProject}
      />
    )
  }

  getArchivedProjectsPanel = () => {
    const {
      users,
      projectSubtypes,
      totalProjects,
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
        total={totalProjects}
        setFilter={this.setFilter}
        isExpert={isExpert}
        newProjectTab={'onhold'}
        modifyProject={this.modifyProject}
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
    const { totalOwnProjects, t } = this.props
    const { screenWidth } = this.state
    return `${screenWidth < 600 ? t('projects.own-short') : t('projects.own-long')} ${
      totalOwnProjects > 0 ? t('projects.amount', { pieces: totalOwnProjects }) : ''
    }`
  }

  getTotalProjectsTitle = () => {
    const { screenWidth } = this.state

    const { totalProjects, t } = this.props

    return `${screenWidth < 600 ? t('projects.all-short') : t('projects.all-long')} ${
      totalProjects > 0 ? t('projects.amount', { pieces: totalProjects }) : ''
    }`
  }

  getOnholdProjectsTitle = () => {
    const { screenWidth } = this.state

    const { onholdProjects, t } = this.props

    return `${
      screenWidth < 600 ? t('projects.onhold-short') : t('projects.onhold-long')
    } ${
      onholdProjects && onholdProjects.length > 0
        ? t('projects.amount', { pieces: onholdProjects.length })
        : ''
    }`
  }
  getArchivedProjectsTitle = () => {
    const { screenWidth } = this.state

    const { archivedProjects, t } = this.props

    return `${
      screenWidth < 600 ? t('projects.archived-short') : t('projects.archived-long')
    } ${
      archivedProjects && archivedProjects.length > 0
        ? t('projects.amount', { pieces: archivedProjects.length })
        : ''
    }`
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
    console.log(index)
    this.setState({pageIndex:index})
    if(this.state.activeIndex){
      this.fetchProjectsByTabIndex(this.state.activeIndex,index)
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

  fetchProjectsByTabIndex = (index,pageIndex) => {
    switch(index) {
      case 1:
        this.props.fetchOwnProjects(this.state.pageLimit,pageIndex,this.state.filter)
        break;
      case 2:
        this.props.fetchProjects(this.state.pageLimit,pageIndex,this.state.filter)
        break;
      case 3:
        this.props.fetchOnholdProjects(this.state.filter)
        break;
      case 4:
        this.props.fetchArchivedProjects(this.state.filter)
        break;
      default:
        this.props.fetchProjects(this.state.pageLimit,pageIndex,this.state.filter)
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
          <span className="timeline-header-item  project-timeline-toggle">
            {t('project.timeline')}
            <Radio onChange={() => this.toggleGraph()} aria-label={t('project.show-timelines')} toggle checked={this.state.showGraph} />
          </span>
          <div className="project-list-container">{this.createTabPanes()}</div>
          <div className='project-list-pagination'>
          <Pagination
            language="fi"
            onChange={(event, index) => {
              event.preventDefault();
              this.setPageIndex(index);
            }}
            pageCount={this.state.projectsTotal}
            pageHref={() => '#'}
            pageIndex={this.state.pageIndex}
            paginationAriaLabel="Projektit sivutus"
            siblingCount={9}
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
