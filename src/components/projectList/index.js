import React, { Component } from 'react'
import { connect } from 'react-redux'
import { fetchProjects } from '../../actions/projectActions'
import { fetchProjectSubtypes } from '../../actions/projectTypeActions'
import { fetchUsers } from '../../actions/userActions'
import { projectSubtypesSelector } from '../../selectors/projectTypeSelector'
import { usersSelector } from '../../selectors/userSelector'
import { Responsive } from 'semantic-ui-react'
import { createProject } from '../../actions/projectActions'
import {
  ownProjectsSelector,
  projectsSelector,
  amountOfProjectsToShowSelector,
  totalOwnProjectsSelector,
  totalProjectsSelector,
  onHoldProjectSelector,
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
    const { t } = this.props

    document.title = t('title')
    this.props.fetchProjects()
    this.props.fetchUsers()
    this.props.fetchProjectSubtypes()
    window.addEventListener('resize', this.handleWindowSizeChange)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange)
  }

  handleWindowSizeChange = () => {
    this.setState({ screenWidth: window.innerWidth })
  }

  toggleForm = opened => this.setState({ showBaseInformationForm: opened })

  toggleSearch = opened => {
    this.setState({ searchOpen: opened })

    if (!opened) {
      this.props.fetchProjects()
    }
  }

  fetchFilteredItems = value => {
    this.setState({ filter: value }, () => {
      this.props.fetchProjects(this.state.filter)
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
      onHoldProjects,
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
        items={onHoldProjects}
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

    const getOwnProjectsTitle =  `${
      screenWidth < 600 ? t('projects.own-short') : t('projects.own-long')
    } ${totalOwnProjects > 0 ? t('projects.amount', { pieces: totalOwnProjects }) : ''}`

    const getTotalProjectsTitle = `${
      screenWidth < 600 ? t('projects.all-short') : t('projects.all-long')
    } ${totalProjects > 0 ? t('projects.amount', { pieces: totalProjects }) : ''}`

    const getOnholdProjectsTitle = `${
      screenWidth < 600 ? t('projects.onhold-short') : t('projects.onhold-long')
    } ${
      onHoldProjects && onHoldProjects.length > 0
        ? t('projects.amount', { pieces: onHoldProjects.length })
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

    const createTabPanes = () => showCreate
      ? (
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
        )
      :  (
        <Tabs>
          <Tab>
            <TabList onTabChange={this.handleTabChange}>
              <Tab>{getTotalProjectsTitle}</Tab>
            </TabList>
            <TabPanel>{getTotalProjectsPanel()}</TabPanel>
          </Tab>
          </Tabs>
        )

    let headerActions = (
      <span className="header-buttons">
        {!searchOpen && (
          <>
            {showCreate && (
              <Button
                variant="secondary"
                className="header-button"
                iconLeft={<IconPlus />}
                onClick={() => this.toggleForm(true)}
              >
                {t('projects.createNewProject')}
              </Button>
            )}
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
        <Responsive
          as={SearchBar}
          minWidth={601}
          toggleSearch={this.toggleSearch}
          searchOpen={searchOpen}
          buttonAction={this.fetchFilteredItems}
        />
      </span>
    )
    return (
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
    onHoldProjects: onHoldProjectSelector(state),
    archivedProjects: archivedProjectSelector(state)
  }
}

const mapDispatchToProps = {
  createProject,
  fetchProjects,
  fetchUsers,
  fetchProjectSubtypes
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProjectListPage))
)
