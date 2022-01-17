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
import { Button, IconPlus, TabList, Tabs, Tab, TabPanel } from 'hds-react'
import projectUtils from './../../utils/projectUtils'
import Header from '../common/Header'

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

  render() {
    const {
      users,
      projectSubtypes,
      ownProjects,
      allProjects,
      totalOwnProjects,
      totalProjects,
      currentUserId,
      onholdProjects,
      archivedProjects
    } = this.props

    const { searchOpen, screenWidth } = this.state

    const { t } = this.props

    const showCreate = projectUtils.isUserPrivileged(currentUserId, users)

    const getOwnProjectsPanel = () => (
      <List
        projectSubtypes={projectSubtypes}
        users={users}
        items={ownProjects}
        total={totalOwnProjects}
        isUserPrivileged={showCreate}
        toggleSearch={this.toggleSearch}
        setFilter={this.setFilter}
        searchOpen={searchOpen}
        buttonAction={this.fetchFilteredItems}
        newProjectTab={'own'}
        modifyProject={modifyProject}
      />
    )

    const getTotalProjectsPanel = () => (
      <List
        toggleSearch={this.toggleSearch}
        searchOpen={searchOpen}
        projectSubtypes={projectSubtypes}
        users={users}
        items={allProjects}
        total={totalProjects}
        setFilter={this.setFilter}
        isUserPrivileged={showCreate}
        newProjectTab={'all'}
        modifyProject={modifyProject}
      />
    )

    const getOnholdProjectsPanel = () => (
      <List
        projectSubtypes={projectSubtypes}
        users={users}
        items={onholdProjects}
        total={totalProjects}
        setFilter={this.setFilter}
        isUserPrivileged={showCreate}
        newProjectTab={'onhold'}
        modifyProject={modifyProject}
      />
    )

    const getArchivedProjectsPanel = () => (
      <List
        projectSubtypes={projectSubtypes}
        users={users}
        items={archivedProjects}
        total={totalProjects}
        setFilter={this.setFilter}
        isUserPrivileged={showCreate}
        newProjectTab={'onhold'}
        modifyProject={modifyProject}
      />
    )

    const getOwnProjectsTitle = `${
      screenWidth < 600 ? t('projects.own-short') : t('projects.own-long')
    } ${totalOwnProjects > 0 ? t('projects.amount', { pieces: totalOwnProjects }) : ''}`

    const getTotalProjectsTitle = `${
      screenWidth < 600 ? t('projects.all-short') : t('projects.all-long')
    } ${totalProjects > 0 ? t('projects.amount', { pieces: totalProjects }) : ''}`

    const getOnholdProjectsTitle = `${
      screenWidth < 600 ? t('projects.onhold-short') : t('projects.onhold-long')
    } ${
      onholdProjects && onholdProjects.length > 0
        ? t('projects.amount', { pieces: onholdProjects.length })
        : ''
    }`
    const getArchivedProjectsTitle = `${
      screenWidth < 600 ? t('projects.archived-short') : t('projects.archived-long')
    } ${
      archivedProjects && archivedProjects.length > 0
        ? t('projects.amount', { pieces: archivedProjects.length })
        : ''
    }`

    const modifyProject = id => {
      this.props.history.push(`/${id}/edit`)
    }

    const createTabPanes = () =>
      showCreate ? (
        <Tabs>
          <TabList onTabChange={this.handleTabChange}>
            <Tab key={1}>{getOwnProjectsTitle}</Tab>
            <Tab key={2}>{getTotalProjectsTitle}</Tab>
            <Tab key={3}>{getOnholdProjectsTitle}</Tab>
            <Tab key={4}>{getArchivedProjectsTitle}</Tab>
          </TabList>
          <TabPanel>{getOwnProjectsPanel()}</TabPanel>
          <TabPanel>{getTotalProjectsPanel()}</TabPanel>
          <TabPanel>{getOnholdProjectsPanel()}</TabPanel>
          <TabPanel>{getArchivedProjectsPanel()}</TabPanel>
        </Tabs>
      ) : (
        <Tabs>
          <TabList onTabChange={this.handleTabChange}>
            <Tab>{getTotalProjectsTitle}</Tab>
          </TabList>
          <TabPanel>{getTotalProjectsPanel()}</TabPanel>
        </Tabs>
      )

    const openCreateProject = () => {
      this.toggleForm(true)
    }

    let headerActions = (
      <span className="header-buttons">
        {!searchOpen && (
          <>
            <Button
              variant="secondary"
              iconLeft={<IconPlus />}
              className="header-button"
              onClick={this.createReports}
            >
              {t('projects.createReports')}
            </Button>
          </>
        )}
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
          user={this.props.user}
          userRole={this.props.userRole}
          createProject={true}
          openCreateProject={openCreateProject}
          showCreate={showCreate}
        />

        <div className="project-list-page">
          <NavHeader
            routeItems={[{ value: t('projects.title'), path: '/' }]}
            title={t('projects.title')}
            actions={headerActions}
          />
          <NewProjectFormModal
            modalOpen={this.state.showBaseInformationForm}
            handleSubmit={this.props.createProject}
            handleClose={() => this.toggleForm(false)}
            users={users}
            projectSubtypes={projectSubtypes}
          />
          <div className="project-list-container">{createTabPanes()}</div>
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
