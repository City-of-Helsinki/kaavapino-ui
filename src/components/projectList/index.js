import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  fetchProjects,
  fetchOnholdProjects,
  fetchArchivedProjects
} from '../../actions/projectActions'
import { fetchProjectSubtypes } from '../../actions/projectTypeActions'
import { fetchUsers } from '../../actions/userActions'
import { projectSubtypesSelector } from '../../selectors/projectTypeSelector'
import { usersSelector } from '../../selectors/userSelector'
import { createProject, clearProjects } from '../../actions/projectActions'
import {
  ownProjectsSelector,
  projectsSelector,
  amountOfProjectsToShowSelector,
  totalOwnProjectsSelector,
  totalProjectsSelector,
  onholdProjectSelector,
  archivedProjectSelector
} from '../../selectors/projectSelector'
import { NavHeader } from '../common/NavHeader'
import NewProjectFormModal from '../project/EditProjectModal/NewProjectFormModal'
import List from './List'
import SearchBar from '../SearchBar'
import { withTranslation } from 'react-i18next'
import { userIdSelector } from '../../selectors/authSelector'
import { withRouter } from 'react-router-dom'
import { TabList, Tabs, Tab, TabPanel } from 'hds-react'
import Header from '../common/Header'
import authUtils from '../../utils/authUtils'

class ProjectListPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showBaseInformationForm: false,
      filter: '',
      searchOpen: false,
      activeIndex: 0,
      screenWidth: window.innerWidth
    }
  }

  componentDidMount() {
    const {
      t,
      fetchProjects,
      fetchUsers,
      fetchProjectSubtypes,
      fetchOnholdProjects,
      fetchArchivedProjects
    } = this.props

    document.title = t('title')
    fetchProjects()
    fetchUsers()
    fetchProjectSubtypes()
    fetchOnholdProjects()
    fetchArchivedProjects()
    window.addEventListener('resize', this.handleWindowSizeChange)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange)
    this.props.clearProjects()
  }

  handleWindowSizeChange = () => {
    this.setState({ screenWidth: window.innerWidth })
  }

  toggleForm = opened => this.setState({ showBaseInformationForm: opened })

  toggleSearch = opened => {
    this.setState({ searchOpen: opened })

    if (!opened) {
      this.props.fetchProjects()
      this.props.fetchOnholdProjects()
      this.props.fetchArchivedProjects()
    }
  }

  fetchFilteredItems = value => {
    this.setState({ filter: value }, () => {
      this.props.clearProjects()
      this.props.fetchProjects(this.state.filter)
      this.props.fetchOnholdProjects(this.state.filter)
      this.props.fetchArchivedProjects(this.state.filter)
    })
  }

  handleTabChange = (e, { activeIndex }) => {
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

    const { searchOpen } = this.state
    return (
      <List
        projectSubtypes={projectSubtypes}
        users={users}
        items={ownProjects}
        total={totalOwnProjects}
        isExpert={isExpert}
        toggleSearch={this.toggleSearch}
        setFilter={this.setFilter}
        searchOpen={searchOpen}
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

    const { searchOpen } = this.state

    return (
      <List
        toggleSearch={this.toggleSearch}
        searchOpen={searchOpen}
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

    return isExpert ? (
      <Tabs>
        <TabList onTabChange={this.handleTabChange}>
          <Tab key={1}>{this.getOwnProjectsTitle()}</Tab>
          <Tab key={2}>{this.getTotalProjectsTitle()}</Tab>
          <Tab key={3}>{this.getOnholdProjectsTitle()}</Tab>
          <Tab key={4}>{this.getArchivedProjectsTitle()}</Tab>
        </TabList>
        <TabPanel>{this.getOwnProjectsPanel()}</TabPanel>
        <TabPanel>{this.getTotalProjectsPanel()}</TabPanel>
        <TabPanel>{this.getOnholdProjectsPanel()}</TabPanel>
        <TabPanel>{this.getArchivedProjectsPanel()}</TabPanel>
      </Tabs>
    ) : (
      <Tabs>
        <TabList onTabChange={this.handleTabChange}>
          <Tab>{this.getTotalProjectsTitle()}</Tab>
        </TabList>
        <TabPanel>{this.getTotalProjectsPanel()}</TabPanel>
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

  render() {
    const {
      users,
      projectSubtypes,
      createProject
    } = this.props

    const { searchOpen, showBaseInformationForm } = this.state

    const { t } = this.props

    
    let headerActions = (
      <span className="header-buttons">
        <SearchBar
          minWidth={601}
          toggleSearch={this.toggleSearch}
          searchOpen={searchOpen}
          buttonAction={this.fetchFilteredItems}
        />
      </span>
    )
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
            actions={headerActions}
          />
          <NewProjectFormModal
            modalOpen={showBaseInformationForm}
            handleSubmit={createProject}
            handleClose={() => this.toggleForm(false)}
            users={users}
            projectSubtypes={projectSubtypes}
          />
          <div className="project-list-container">{this.createTabPanes()}</div>
        </div>
      </>
    )
  }
}

const mapStateToProps = state => {
  return {
    ownProjects: ownProjectsSelector(state),
    allProjects: projectsSelector(state),
    users: usersSelector(state),
    projectSubtypes: projectSubtypesSelector(state),
    amountOfProjectsToShow: amountOfProjectsToShowSelector(state),
    totalOwnProjects: totalOwnProjectsSelector(state),
    totalProjects: totalProjectsSelector(state),
    currentUserId: userIdSelector(state),
    onholdProjects: onholdProjectSelector(state),
    archivedProjects: archivedProjectSelector(state)
  }
}

const mapDispatchToProps = {
  createProject,
  fetchProjects,
  fetchUsers,
  fetchProjectSubtypes,
  clearProjects,
  fetchArchivedProjects,
  fetchOnholdProjects
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProjectListPage))
)
