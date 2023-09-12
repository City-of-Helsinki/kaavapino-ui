import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  initializeProject,
  saveProjectBase,
  changeProjectPhase,
  getProjectSnapshot,
  setSelectedPhaseId,
  getExternalDocuments,
  resetProjectDeadlines,
  pollConnection,
  showTimetable,
  showFloorArea
} from '../../actions/projectActions'
import { fetchUsers } from '../../actions/userActions'
import { getProjectCardFields, getAttributes } from '../../actions/schemaActions'

import {
  currentProjectSelector,
  currentProjectLoadedSelector,
  changingPhaseSelector,
  selectedPhaseSelector,
  externalDocumentsSelector,
  creatorSelector,
  resettingDeadlinesSelector,
  savingSelector,
  pollSelector
} from '../../selectors/projectSelector'
import { phasesSelector } from '../../selectors/phaseSelector'
import {
  allEditFieldsSelector,
  projectCardFieldsSelector
} from '../../selectors/schemaSelector'
import { usersSelector } from '../../selectors/userSelector'
import { NavHeader } from '../common/NavHeader'
import ProjectEditPage from '../projectEdit'
import ProjectCardPage from '../projectCard'
import ProjectDocumentsPage from '../projectDocuments'
import projectUtils from '../../utils/projectUtils'
import NewProjectFormModal from './EditProjectModal/NewProjectFormModal'
import { projectSubtypesSelector } from '../../selectors/projectTypeSelector'
import { withTranslation } from 'react-i18next'

import DownloadProjectDataModal from './DownloadProjectDataModal'
import { DOWNLOAD_PROJECT_DATA_FORM } from '../../constants'
import { getFormValues } from 'redux-form'
import { userIdSelector } from '../../selectors/authSelector'
import { IconPen, LoadingSpinner, Button, Select } from 'hds-react'
import { withRouter } from 'react-router-dom'
import dayjs from 'dayjs'
import Header from '../common/Header'
import { downloadDocument } from '../../actions/documentActions'
import authUtils from '../../utils/authUtils'

class ProjectPage extends Component {
  constructor(props) {
    super(props)
    if (props.currentProject) {
      this.props.setSelectedPhaseId(props.currentProject.phase)
    } else {
      this.props.setSelectedPhaseId(0)
    }

    this.state = {
      showBaseInformationForm: false,
      showPrintProjectDataModal: false
    }
  }

  componentDidMount() {
    const { currentProjectLoaded, users, getAttributes, currentProject } = this.props

    getAttributes()
    if (
      !currentProjectLoaded ||
      !currentProject ||
      currentProject.id !== +this.props.id
    ) {
      this.props.initializeProject(this.props.id)
    }
    if (!users || users.length === 0) {
      this.props.fetchUsers()
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  componentDidUpdate(prevProps) {
    const { currentProject, changingPhase } = this.props
    if(prevProps.saving && !this.props.saving){
      this.setState({ ...this.state, showBaseInformationForm: false })
    }
    if (
      (!prevProps.currentProject && currentProject) ||
      (prevProps.changingPhase && !changingPhase)
    ) {
      const search = this.props.location.search
      const params = new URLSearchParams(search)

      const viewParameter = params.get('property')

      if (viewParameter) {
        this.setState({ ...this.state, showBaseInformationForm: true })
        this.props.history.replace({ ...this.props.location, search: '' })
      }

      if (params.get('phase')) {
        this.props.setSelectedPhaseId(+params.get('phase'))
      } else {
        this.props.setSelectedPhaseId(currentProject.phase)
      }
      document.title = currentProject.name
    }
    //s if (prevProps.edit && !edit) this.props.setSelectedPhaseId(currentProject.phase)

    getExternalDocuments(this.props.id)
  }

  pollConnection = () => {
    //Polls connection when getting error from editform
    //calls from Header.js useInterval
    this.props.pollConnection()
  }

  switchDisplayedPhase = phase => {
    if (this.props.edit) {
      this.props.setSelectedPhaseId(phase)
    }
  }

  getRouteItems = () => {
    const { currentProject, edit, documents, t } = this.props
    const path = [
      { value: t('project.projects'), path: '/projects' },
      { value: `${currentProject.name}`, path: `/${currentProject.id}` }
    ]
    if (edit) {
      path.push({ value: t('project.modify'), path: `/${currentProject.id}/edit` })
    } else if (documents) {
      path.push({
        value: t('project.documents'),
        path: `/${currentProject.id}/documents`
      })
    }
    return path
  }

  getCurrentPhases() {
    let { currentProject, phases } = this.props
    const { type, subtype } = currentProject

    if (!currentProject['create_draft']) {
      phases = phases.filter(e => e.name !== 'Luonnos')
    }
    if (!currentProject['create_principles']) {
      phases = phases.filter(e => e.name !== 'Periaatteet')
    }

    return phases.filter(({ project_type, project_subtype }) => {
      return project_type === type && project_subtype === subtype
    })
  }

  getProjectEditContent = isExpert => {
    const { currentProject, users, projectSubtypes, selectedPhase } = this.props

    const currentPhases = this.getCurrentPhases()
    return (
      <div key="edit">
        <NavHeader
          routeItems={this.getRouteItems()}
          title={currentProject.name}
          actions={this.getEditNavActions(isExpert)}
          infoOptions={this.getAllChanges()}
        />
        <NewProjectFormModal
          currentProject={currentProject}
          modalOpen={this.state.showBaseInformationForm}
          initialValues={{
            name: currentProject.name,
            public: currentProject.public,
            subtype: currentProject.subtype,
            user: currentProject.user,
            create_principles: currentProject.create_principles,
            create_draft: currentProject.create_draft
          }}
          handleSubmit={this.props.saveProjectBase}
          handleClose={() => this.toggleBaseInformationForm(false)}
          users={users}
          projectSubtypes={projectSubtypes}
        />
        <DownloadProjectDataModal
          currentProject={currentProject}
          open={this.state.showPrintProjectDataModal}
          initialValues={{}}
          handleClose={() => this.togglePrintProjectDataModal(false)}
        />
        <ProjectEditPage
          currentPhases={currentPhases}
          selectedPhase={selectedPhase}
          switchDisplayedPhase={this.switchDisplayedPhase}
          project={currentProject}
        />
      </div>
    )
  }
  getProjectDocumentsContent = () => {
    const { currentProject, users, projectSubtypes, currentUserId, selectedPhase } = this.props

    return (
      <div key="documents">
        <NavHeader
          routeItems={this.getRouteItems()}
          title={currentProject.name}
          actions={this.getDocumentsNavActions()}
          infoOptions={this.getAllChanges()}
        />
        <NewProjectFormModal
          currentProject={currentProject}
          modalOpen={this.state.showBaseInformationForm}
          initialValues={{
            name: currentProject.name,
            public: currentProject.public,
            subtype: currentProject.subtype,
            user: currentProject.user,
            create_principles: currentProject.create_principles,
            create_draft: currentProject.create_draft
          }}
          handleSubmit={this.props.saveProjectBase}
          handleClose={() => this.toggleBaseInformationForm(false)}
          users={users}
          projectSubtypes={projectSubtypes}
        />
        <DownloadProjectDataModal
          currentProject={currentProject}
          open={this.state.showPrintProjectDataModal}
          initialValues={{}}
          handleClose={() => this.togglePrintProjectDataModal(false)}
        />
        <ProjectDocumentsPage 
        users={users} 
        currentUserId={currentUserId} 
        project={currentProject} 
        selectedPhase={selectedPhase}
        search={this.props.location.search}
        />
      </div>
    )
  }

  getProjectCardContent = isUserExpert => {
    const { currentProject, externalDocuments, users, projectSubtypes } = this.props

    return (
      <div key="project-card">
        <NavHeader
          routeItems={this.getRouteItems()}
          title={currentProject.name}
          actions={this.getProjectCardNavActions(isUserExpert)}
          infoOptions={this.getAllChanges()}
        />
        <NewProjectFormModal
          currentProject={currentProject}
          modalOpen={this.state.showBaseInformationForm}
          initialValues={{
            name: currentProject.name,
            public: currentProject.public,
            subtype: currentProject.subtype,
            user: currentProject.user,
            create_principles: currentProject.create_principles,
            create_draft: currentProject.create_draft
          }}
          handleSubmit={this.props.saveProjectBase}
          handleClose={() => this.toggleBaseInformationForm(false)}
          users={users}
          projectSubtypes={projectSubtypes}
        />
        <DownloadProjectDataModal
          currentProject={currentProject}
          open={this.state.showPrintProjectDataModal}
          initialValues={{}}
          handleClose={() => this.togglePrintProjectDataModal(false)}
        />
        <ProjectCardPage projectId={this.props.id} documents={externalDocuments} />
      </div>
    )
  }

  getProjectPageContent = isExpert => {
    const { edit, documents } = this.props
    if (edit) {
      return this.getProjectEditContent(isExpert)
    }
    if (documents) {
      return this.getProjectDocumentsContent(isExpert)
    }
    return this.getProjectCardContent(isExpert)
  }

  changeOptions = (option) => {
    const { currentProject, downloadDocument } = this.props
    switch (option.value) {
      case 1:
        this.createDocuments()
        break;
      case 2:
        this.props.showTimetable(true)
        break;
      case 3:
        this.props.showFloorArea(true)
        break;
      case 4:
        this.showProjectData()
        break;
      case 5:
        this.showModifyProject()
        break;
      case 6:
        this.onResetProjectDeadlines()
        break;
      case 7:
        downloadDocument({
          ...currentProject.project_card_document,
          projectCard: true
        })
        break;
      default:
        console.log("invalid option.");
    }
  }

  getProjectCardNavActions = userIsExpert => {
    const { t } = this.props
    const options = [
    {value:1,label:<><i className="icons document-icon"></i>{t('project.create-documents')}</> },
    {value:7,label:<><i className="icons download-icon"></i>{t('project.print-project-card')}</>}]

    return (
      <span className="header-buttons">
        {userIsExpert && (
        <>
          <Button
            variant="secondary"
            className="header-button"
            size='small'
            onClick={this.modifyContent}
            iconLeft={<IconPen />}
          >
            {t('project.modify')}
          </Button>
          <Select
            className='edit-view-select'
            id="editNavSelect"
            placeholder='Projektin työkalut'
            options={options}
            onChange={this.changeOptions}
          />
        </>
        )}
      </span>
    )
  }
  showModifyProject = () => {
    this.toggleBaseInformationForm(true)
  }
  showProjectData = () => {
    this.togglePrintProjectDataModal(true)
  }

  getEditNavActions = isUserExpert => {
   const { t } = this.props
    const options = [{value:1,label:<><i className="icons document-icon"></i>{t('project.create-documents')}</> },{value:2,label:<><i className="icons calendar-icon"></i>{t('deadlines.title')}</>},{value:3,label:<><i className="icons company-icon"></i>{t('floor-areas.title')}</>},
    {value:4,label:<><i className="icons download-icon"></i>{t('project.download-old-data')}</>},{value:5,label:<><i className="icons pen-icon"></i>{t('project.modify-project-base')}</>},{value:6,label:<><i className="icons trash-icon"></i>{t('deadlines.reset-project-deadlines')}</>},
    ]
    return (
      <span className="header-buttons">
        {isUserExpert && (
        <Select
          className='edit-view-select'
          id="editNavSelect"
          placeholder='Projektin työkalut'
          options={options}
          onChange={this.changeOptions}
        />
        )}
      </span>
    )
  }

  getDocumentsNavActions = isUserExpert => {
    const { t } = this.props
    return (
      <span className="header-buttons">
        {isUserExpert && (
          <Button
            variant="secondary"
            className="header-button"
            onClick={this.modifyContent}
            iconLeft={<IconPen />}
          >
            {t('project.modify')}
          </Button>
        )}
        <Button variant="primary" iconLeft={<IconPen />} onClick={this.checkProjectCard}>
          {t('project.check-project-card')}
        </Button>
      </span>
    )
  }

  getNavActions = () => {
    const { edit } = this.props
    return !edit ? this.getProjectCardButtons() : this.getEditButtons()
  }

  modifyContent = () => {
    const {
      currentProject: { id },
      history
    } = this.props
    history.push(`/${id}/edit`)
  }
  createDocuments = () => {
    const {
      currentProject: { id },
      history
    } = this.props
    history.push(`/${id}/documents`)
  }
  checkProjectCard = () => {
    const {
      currentProject: { id },
      history
    } = this.props
    history.push(`/${id}`)
  }
  openProjectDataModal = () => this.togglePrintProjectDataModal(true)

  toggleBaseInformationForm = opened =>
    this.setState({ ...this.state, showBaseInformationForm: opened })

  getAllChanges = () => {
    const { allEditFields, edit, creator, t } = this.props

    if (!edit || !allEditFields) return []

    const returnValues = []

    const keys = Object.keys(allEditFields)

    keys.forEach((key, i) => {
      const current = allEditFields[key]

      if (!current.schema[key].autofill_readonly || current.schema[key].editable) {
        const value = `${projectUtils.formatDateTime(current.timestamp)} ${
          current.schema[key].label
        } ${current.user_name}`
        returnValues.push({
          name: key,
          text: value,
          value: value,
          key: `${value}-${i}`,
          oldValue: current.old_value,
          newValue: current.new_value,
          schema: current.schema,
          timestamp: current.timestamp,
          type: current.schema[key].type
        })
      }
    })

    const ordered = returnValues.sort(
      (u1, u2) => new Date(u2.timestamp).getTime() - new Date(u1.timestamp).getTime()
    )

    if (allEditFields) {
      ordered.push({
        name: 'Project created',
        label: creator.user_name,
        text: t('project.project-created-log', {
          timestamp: projectUtils.formatDateTime(creator.timestamp),
          name: creator.user_name
        }),
        timestamp: projectUtils.formatDateTime(creator.timestamp),
        type: 'boolean',
        oldValue: null,
        newValue: true
      })
    }
    return ordered
  }

  togglePrintProjectDataModal = opened =>
    this.setState({ showPrintProjectDataModal: opened })

  renderLoading = () => {
    const { t } = this.props
    return (
      <div className="project-container">
        <NavHeader
          routeItems={[
            { value: 'Kaavaprojektit', path: '/projects' },
            { value: '', path: '/' }
          ]}
        />
        <div className="project-page-content">
          <LoadingSpinner className="loader-icon">{t('loading')}</LoadingSpinner>
        </div>
      </div>
    )
  }

  downloadProjectData = async () => {
    const { currentProject, getProjectSnapshot, formValues } = this.props

    const phase = formValues['phase']
    const date = formValues['date']

    getProjectSnapshot(currentProject.id, dayjs(date).format(), phase)
  }

  onResetProjectDeadlines = () => {
    const { currentProject, resetProjectDeadlines } = this.props
    resetProjectDeadlines(currentProject.id)
    initializeProject(currentProject.id)
  }

  render() {
    const {
      phases,
      currentProjectLoaded,
      users,
      resettingDeadlines,
      currentUserId,
      currentProject
    } = this.props

    const loading = !currentProjectLoaded || !phases

    const userIsExpert = authUtils.isExpert(currentUserId, users)

    return (
      <>
        <Header
          title={currentProject?.name}
          modifyProject={true}
          showPrintProjectData={true}
          resetDeadlines={true}
          openModifyProject={this.showModifyProject}
          openPrintProjectData={this.showProjectData}
          resetProjectDeadlines={this.onResetProjectDeadlines}
          pollConnection={this.pollConnection}
        />
        {(loading || resettingDeadlines) && this.renderLoading()}
        {!loading && !resettingDeadlines && (
          <div className="project-container">
            <div className="project-page-content">
              {this.getProjectPageContent(userIsExpert)}
            </div>
          </div>
        )}
      </>
    )
  }
}

const mapDispatchToProps = {
  initializeProject,
  saveProjectBase,
  fetchUsers,
  changeProjectPhase,
  getProjectSnapshot,
  setSelectedPhaseId,
  getProjectCardFields,
  getExternalDocuments,
  getAttributes,
  resetProjectDeadlines,
  downloadDocument,
  pollConnection,
  showTimetable,
  showFloorArea
}

const mapStateToProps = state => {
  return {
    currentProject: currentProjectSelector(state),
    phases: phasesSelector(state),
    users: usersSelector(state),
    projectSubtypes: projectSubtypesSelector(state),
    currentProjectLoaded: currentProjectLoadedSelector(state),
    changingPhase: changingPhaseSelector(state),
    allEditFields: allEditFieldsSelector(state),
    formValues: getFormValues(DOWNLOAD_PROJECT_DATA_FORM)(state),
    currentUserId: userIdSelector(state),
    selectedPhase: selectedPhaseSelector(state),
    projectCardFields: projectCardFieldsSelector(state),
    externalDocuments: externalDocumentsSelector(state),
    creator: creatorSelector(state),
    resettingDeadlines: resettingDeadlinesSelector(state),
    saving: savingSelector(state),
    connection: pollSelector(state)
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProjectPage))
)
