import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  fetchProjects,
  fetchOwnProjects,
  fetchOnholdProjects,
  fetchArchivedProjects,
  createProject,
  clearProjects,
  getProjectsOverviewFilters
} from '../../actions/projectActions'
import { fetchProjectSubtypes } from '../../actions/projectTypeActions'
import { fetchUsers } from '../../actions/userActions'
import { projectSubtypesSelector } from '../../selectors/projectTypeSelector'
import { usersSelector } from '../../selectors/userSelector'
import {
  ownProjectsSelector,
  projectsSelector,
  totalOwnProjectsSelector,
  totalArchivedProjectsSelector,
  totalOnholdProjectsSelector,
  totalProjectsSelector,
  onholdProjectSelector,
  archivedProjectSelector,
  projectOverviewFiltersSelector
} from '../../selectors/projectSelector'
import { NavHeader } from '../common/NavHeader.jsx'
import NewProjectFormModal from '../project/EditProjectModal/NewProjectFormModal.jsx'
import List from './List.jsx'
import { withTranslation } from 'react-i18next'
import { userIdSelector } from '../../selectors/authSelector'
import { withRouter } from 'react-router-dom'
import { Tabs, Pagination, Button, IconPlus, ToggleButton } from 'hds-react'
import Header from '../common/Header/Header.jsx'
import authUtils from '../../utils/authUtils'
import OwnProjectFilters from './OwnProjectFilters.jsx'
import { isEqual } from 'lodash'
import PropTypes from 'prop-types'
import './ProjectList.scss'

const TAB_KEYS = {
  1: 'own',
  2: 'all',
  3: 'onhold',
  4: 'archived'
}

class ProjectListPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showBaseInformationForm: false,
      filter: ["","",[]],
      activeTab: 'own',
      screenWidth: window.innerWidth,
      currentFilterData: Array.isArray(this.props.filterData) ? this.props.filterData : [],
      pageIndex:0,
      showGraph: false,
      pageLimit:20,
      tabName:"modified_at",
      tabDir:0
    }
  }

  getTabConfig = () => ({
    own: {
      items: this.props.ownProjects,
      total: this.props.totalOwnProjects,
      fetch: this.props.fetchOwnProjects
    },
    all: {
      items: this.props.allProjects,
      total: this.props.totalProjects,
      fetch: this.props.fetchProjects
    },
    onhold: {
      items: this.props.onholdProjects,
      total: this.props.totalOnholdProjects,
      fetch: this.props.fetchOnholdProjects
    },
    archived: {
      items: this.props.archivedProjects,
      total: this.props.totalArchivedProjects,
      fetch: this.props.fetchArchivedProjects
    }
  })

  componentDidMount() {
    const {
      t,
      fetchUsers,
      fetchProjectSubtypes,
      getProjectsOverviewFilters,
    } = this.props

    document.title = "Kaavapino - " + t('projects.title')
    if (!this.props.users || this.props.users.length === 0) {
      fetchUsers()
    } else {
      this.handleUsersListUpdate()
    }
    fetchProjectSubtypes()
    getProjectsOverviewFilters()
    window.addEventListener('resize', this.handleWindowSizeChange)
    document.addEventListener('keydown', this.handleKeyDown, true)
  }

  componentWillUnmount() {
    if (document.title === "Kaavapino - " + this.props.t('projects.title')) {
      document.title = "Kaavapino"
    }
    
    window.removeEventListener('resize', this.handleWindowSizeChange)
    document.removeEventListener('keydown', this.handleKeyDown, true)
    this.props.clearProjects()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.filterData !== this.props.filterData) {
      this.setState({currentFilterData: Array.isArray(this.props.filterData) ? this.props.filterData : []})
    }
    if (prevProps.users !== this.props.users) {
      this.handleUsersListUpdate()
    }
  }

  handleUsersListUpdate() {
    const isExpert = authUtils.isExpert(this.props.currentUserId, this.props.users)
    if(isExpert){
      this.fetchProjectsByTabKey('own',0,"modified_at",0)
      this.setState({activeTab: 'own'})
    }
    else{
      this.fetchProjectsByTabKey('all',0,"modified_at",0)
      this.setState({activeTab: 'all'})
    }
  }

  handleWindowSizeChange = () => {
    this.setState({ screenWidth: window.innerWidth })
  }

  handleKeyDown = (event) => {
    const element = document.activeElement;
    if(event.key === " " && (element.role === "tab")){
      event.preventDefault();
    }
    else if(event.key === "ArrowRight" && element.id === "tab-3-button"){
      event.stopImmediatePropagation();
      document.getElementById("tab-0-button").focus();
    }
    else if(event.key === "ArrowLeft" && element.id === "tab-0-button"){
      event.stopImmediatePropagation();
      document.getElementById("tab-3-button").focus();
    }

  }

  handleNewProjectModalClose = () => {
    this.toggleForm(false)
    requestAnimationFrame(() => {
      document.getElementById('add-new-project-button')?.focus();
    });
  }

  toggleForm = opened => this.setState({ showBaseInformationForm: opened })

  toggleSearch = opened => {
    if (!opened && this.state.activeTab) {
      this.fetchProjectsByTabKey(this.state.activeTab,this.state.pageIndex,this.state.tabName,this.state.tabDir)
     }
    }

  fetchFilteredItems = (values) => {
    const pageIndex = isEqual(values, this.state.filter) ? this.state.pageIndex : 0;
    this.setState({ filter: values }, () => {
      this.props.clearProjects()
      this.fetchProjectsByTabKey(this.state.activeTab, pageIndex, this.state.tabName, this.state.tabDir)
    })
  }

  handleTabChange = (activeTab) => {
    this.fetchProjectsByTabKey(activeTab,0,this.state.tabName,this.state.tabDir)
    this.setState({ activeTab, pageIndex:0 })
  }

  sortField = (name,dir) => {
    const sortField = this.props.t('sorting.'+name)
    this.setState({tabName:sortField,tabDir:dir})
    this.fetchProjectsByTabKey(this.state.activeTab,this.state.pageIndex,sortField,dir)
  } 

  getProjectsPanel = (tabKey, isExpert) => {
      const {
      users,
      projectSubtypes
    } = this.props

    const tabConfig = this.getTabConfig()

    return (
      <List
        key={tabKey}
        showGraph={this.state.showGraph}
        projectSubtypes={projectSubtypes}
        users={users}
        items={tabConfig[tabKey].items}
        total={tabConfig[tabKey].total}
        setFilter={this.setFilter}
        isExpert={isExpert}
        newProjectTab={tabKey}
        modifyProject={this.modifyProject}
        sortField={this.sortField}
        toggleSearch={this.toggleSearch}
      />
    )
  }

  modifyProject = id => {
    this.props.history.push(`/projects/${id}/edit`)
  }

  createTabPanes = () => {
    const {
      users,
      currentUserId
    } = this.props

    const isExpert = authUtils.isExpert(currentUserId, users)
    const tabKey = isExpert ? this.state.activeTab : 'all';
    return (
      <Tabs>
        <Tabs.TabPanel>{this.getProjectsPanel(tabKey, isExpert)}</Tabs.TabPanel>
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
          <Tabs.Tab key={1} onClick={() => this.handleTabChange('own')}>{this.getProjectsTitle('own')}</Tabs.Tab>
          <Tabs.Tab key={2} onClick={() => this.handleTabChange('all')}>{this.getProjectsTitle('all')}</Tabs.Tab>
          <Tabs.Tab key={3} onClick={() => this.handleTabChange('onhold')}>{this.getProjectsTitle('onhold')}</Tabs.Tab>
          <Tabs.Tab key={4} onClick={() => this.handleTabChange('archived')}>{this.getProjectsTitle('archived')}</Tabs.Tab>
        </Tabs.TabList>
      </Tabs>
    ) : (
      <Tabs>
        <Tabs.TabList>
          <Tabs.Tab key={1}>{this.getProjectsTitle('all')}</Tabs.Tab>
        </Tabs.TabList>
      </Tabs>
    )
  }

  openCreateProject = () => {
    this.toggleForm(true)
  }

  getProjectsTitle = (tabKey) => {
    const { t } = this.props
    const { screenWidth } = this.state
    const titles = {
      own: screenWidth < 600 ? t('projects.own-short') : t('projects.own-long'),
      all: screenWidth < 600 ? t('projects.all-short') : t('projects.all-long'),
      onhold: screenWidth < 600 ? t('projects.onhold-short') : t('projects.onhold-long'),
      archived: screenWidth < 600 ? t('projects.archived-short') : t('projects.archived-long')
     }
     return titles[tabKey] || ""
  }

  getCurrentTabTotal = () => {
    const totalsByKey = {
      own: this.props.totalOwnProjects,
      all: this.props.totalProjects,
      onhold: this.props.totalOnholdProjects,
      archived: this.props.totalArchivedProjects
    }
    return this.state.activeTab ? totalsByKey[this.state.activeTab] : null
  }

  getResultsCount = () => {
    const { t } = this.props
    const count = this.getCurrentTabTotal()
    return (count || count === 0) ? `${t('project.total')} ${count} ${t('project.found-projects')}` : ""
  }

  getFilters = key => {
    const filters = []

    this.state.currentFilterData?.forEach(filter => {
        if (filter[key]) {
          filters.push(filter)
        }
      })
    return filters
  }

  setPageIndex = (index) => {
    this.setState({pageIndex:index})
    this.fetchProjectsByTabKey(this.state.activeTab, index, this.state.tabName, this.state.tabDir)
  }

  toggleGraph = () => this.setState(prev => ({ showGraph: !prev.showGraph }))

  fetchProjectsByTabKey = (tabKey, pageIndex, name, dir) => {
    const fetchFunction = this.getTabConfig()[tabKey]?.fetch
    if (fetchFunction) {
      fetchFunction(this.state.pageLimit,pageIndex,this.state.filter,name,dir)
    }
  }

  getDocumentsNavActions = hasEditRights => {
    const { t } = this.props
    return (
      <span className="header-buttons">
        {hasEditRights && (
          <Button
            id="add-new-project-button"
            size="small"
            variant="secondary"
            className="header-button"
            onClick={this.openCreateProject}
            iconLeft={<IconPlus />}
          >
            {t('projects.addNewProject')}
          </Button>
        )}
      </span>
    )
  }

  getPageCount = () => {
    const count = this.getCurrentTabTotal()
    return count ? Math.ceil(count / this.state.pageLimit) : 0
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
    const isResponsible = authUtils.isResponsible(currentUserId, users)

    return (
      <>
        <Header/>
        <main id="main" className="project-list-page">
          <NavHeader
            title={t('projects.title')}
            actions={this.getDocumentsNavActions(isResponsible)}
          />
          <NewProjectFormModal
            modalOpen={showBaseInformationForm}
            handleSubmit={createProject}
            handleClose={this.handleNewProjectModalClose}
            users={users}
            projectSubtypes={projectSubtypes}
            isEditable={isResponsible}
          />
          <div className="project-list-container">{this.createTabList()}</div>
          <OwnProjectFilters
            filters={this.getFilters('filters_floor_area')}
            isPrivileged={isExpert}
            buttonAction={this.fetchFilteredItems}
            users={users}
          />
          <section aria-label={t('project.projects-list')}>
            <div className='project-list-result'>
              <span className='project-list-result-number'>{this.getResultsCount()}</span>
              <div className="timeline-header-item  project-timeline-toggle">
                <ToggleButton id="timeline-toggle" label={t('project.show-timelines')} variant="inline" checked={this.state.showGraph} onChange={() => this.toggleGraph()} />
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
              pageCount={this.getPageCount()}
              pageHref={() => '#'}
              pageIndex={this.state.pageIndex}
              paginationAriaLabel="Projektit sivutus"
            />
            </div>
          </section>
        </main>
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

ProjectListPage.propTypes = {
  filterData: PropTypes.array,
  t: PropTypes.func,
  fetchUsers: PropTypes.func,
  fetchProjectSubtypes: PropTypes.func,
  getProjectsOverviewFilters: PropTypes.func,
  clearProjects: PropTypes.func,
  users: PropTypes.array,
  currentUserId: PropTypes.string,
  ownProjects: PropTypes.array,
  totalOwnProjects: PropTypes.number,
  totalProjects: PropTypes.number,
  totalOnholdProjects: PropTypes.number,
  totalArchivedProjects: PropTypes.number,
  projectSubtypes: PropTypes.array,
  allProjects: PropTypes.array,
  onholdProjects: PropTypes.array,
  archivedProjects: PropTypes.array,
  fetchProjects: PropTypes.func,
  fetchOwnProjects: PropTypes.func,
  fetchOnholdProjects: PropTypes.func,
  fetchArchivedProjects: PropTypes.func,
  createProject: PropTypes.func,
  history: PropTypes.object
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProjectListPage))
)
