import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getFormSyncErrors, getFormSubmitErrors, getFormValues } from 'redux-form'
import { LoadingSpinner } from 'hds-react'
import { isDirty } from 'redux-form/immutable'
import {
  saveProject,
  saveProjectFloorArea,
  saveProjectTimetable,
  changeProjectPhase,
  validateProjectFields,
  projectSetChecking,
  saveProjectBase,
  fetchProjectDeadlines,
  initializeProject,
  getProjectSnapshot,
  saveProjectBasePayload
} from '../../actions/projectActions'
import { fetchSchemas, setAllEditFields, clearSchemas } from '../../actions/schemaActions'
import {
  savingSelector,
  changingPhaseSelector,
  validatingSelector,
  hasErrorsSelector,
  checkingSelector,
  currentProjectSelector
} from '../../selectors/projectSelector'
import { schemaSelector, allEditFieldsSelector } from '../../selectors/schemaSelector'
import NavigationPrompt from 'react-router-navigation-prompt'
import Prompt from '../common/Prompt'
import EditForm from './EditForm'
import QuickNav from './quickNav/QuickNav'
import EditFloorAreaFormModal from '../project/EditFloorAreaFormModal'
import { EDIT_PROJECT_FORM } from '../../constants'
import _ from 'lodash'
import EditProjectTimetableModal from '../project/EditProjectTimetableModal'
import ProjectTimeline from '../ProjectTimeline/ProjectTimeline'
import { usersSelector } from '../../selectors/userSelector'
import { userIdSelector } from '../../selectors/authSelector'
import { withRouter } from 'react-router-dom'
import projectUtils from '../../utils/projectUtils'
import InfoComponent from '../common/InfoComponent'
import { withTranslation } from 'react-i18next'

class ProjectEditPage extends Component {
  state = {
    showEditFloorAreaForm: false,
    showEditProjectTimetableForm: false,
    highlightGroup: '',
    refs: [],
    selectedRefName: null,
    currentRef: null,
    formInitialized: false
  }

  currentSectionIndex = 0

  headings = []

  constructor(props) {
    super(props)
    const { project } = this.props
    this.props.fetchSchemas(project.id, project.subtype)
  }
  
  componentDidUpdate() {

    this.scroll()
    this.headings = this.createHeadings()
  }
  componentDidMount() {

    window.addEventListener('resize', this.handleResize)

    if (window.innerWidth < 720) {
      this.setState({
        ...this.state,
        isMobile: true
      })
    }

    this.scroll()

    const search = this.props.location.search
    const params = new URLSearchParams(search)

    const viewParameter = params.get('view')

    if (viewParameter === 'deadlines') {
      this.setState({ ...this.state, showEditProjectTimetableForm: true })
      this.props.history.replace({ ...this.props.location, search: '' })
    }
    if (viewParameter === 'floorarea') {
      this.setState({ ...this.state, showEditFloorAreaForm: true })
      this.props.history.replace({ ...this.props.location, search: '' })
    }
  }

  componentWillUnmount() {
    this.props.clearSchemas()
  }

  scroll() {
    const search = this.props.location.search
    const params = new URLSearchParams(search)

    const param = params.get('attribute')

    const element = document.getElementById(param)

    if (param && element) {
      this.props.history.replace({ ...this.props.location, search: '' })
    }

    element && element.scrollIntoView()
  }
  changePhase = () => {
    const { schema, selectedPhase } = this.props
    const currentSchemaIndex = schema.phases.findIndex(s => s.id === selectedPhase)
    if (currentSchemaIndex + 1 < schema.phases.length) {
      this.props.changeProjectPhase(schema.phases[currentSchemaIndex + 1].id)
    } else {
      // do something with last phase
    }
  }

  handleSave = () => {
    this.props.saveProject()
  }
  handleAutoSave = () => {
    if ( this.state.showEditFloorAreaForm || this.state.showEditProjectTimetableForm ) {
      return
    }

    if (this.props.syncErrors && !_.isEmpty(this.props.syncErrors)) {
      return
    }
    this.props.saveProject()
  }
  handleTimetableClose = () => {
    this.props.saveProjectTimetable()
  }

  setSelectedRole = role => {
    switch (role) {
      case 0:
        this.setState({ highlightGroup: 'hightlight-pääkäyttäjä' })
        break
      case 1:
        this.setState({ highlightGroup: 'hightlight-asiantuntija' })
        break
      default:
        this.setState({ highlightGroup: '' })
    }
  }
  setRef = ref => {
    this.setState(prevState => ({
      ...this.state,
      refs: [...prevState.refs, ref]
    }))
  }

  setFormInitialized = value => {
    this.setState({
      ...this.state,
      formInitialized: value
    })
  }
  createHeadings = () => {
    const { schema } = this.props
    const allPhases = schema && schema.phases

    const newPhases = []

    allPhases &&
      allPhases.forEach(phase => {
        const sections = []
        phase.sections.forEach(section => {
          sections.push({ title: section.title })
        })

        const newPhase = {
          id: phase.id,
          title: phase.title,
          color: phase.color,
          color_code: phase.color_code,
          list_prefix: phase.list_prefix,
          sections: sections
        }

        newPhases.push(newPhase)
      })
    return newPhases
  }

  hasMissingFields = () => {
    const { project: { attribute_data }, currentProject, schema } = this.props
    return projectUtils.hasMissingFields(attribute_data, currentProject, schema)
    
  }
  //choose the screen size
  handleResize = () => {
    if (window.innerWidth < 720) {
      this.setState({
        ...this.state,
        isMobile: true
      })
    } else {
      this.setState({
        ...this.state,
        isMobile: false
      })
    }
  }

  showTimelineModal = show => {
    const showCreate = projectUtils.isUserPrivileged(
      this.props.currentUserId,
      this.props.users
    )

    if (showCreate) {
      this.setState({ showEditProjectTimetableForm: show })
    }
  }

  getSelectedPhase = () => {
    let checkedSelectedPhase = this.props.selectedPhase
    const search = this.props.location.search
    const params = new URLSearchParams(search)

    if (params.get('phase')) {
      checkedSelectedPhase = +params.get('phase')
    }
    return checkedSelectedPhase
  }

  render() {
    const {
      schema,
      selectedPhase,
      saveProjectFloorArea,
      project: { attribute_data, phase, id, geoserver_data },
      saving,
      changingPhase,
      switchDisplayedPhase,
      validating,
      hasErrors,
      syncErrors,
      saveProjectBase,
      currentProject,
      submitErrors,
      t,
      saveProjectBasePayload,
      currentPhases
    } = this.props
    const { highlightGroup } = this.state
    if (!schema) {
      return <LoadingSpinner className="loader-icon" />
    }

    const currentSchemaIndex = schema.phases.findIndex(
      s => s.id === this.getSelectedPhase()
    )

    const currentSchema = schema.phases[currentSchemaIndex]
    const projectPhaseIndex = schema.phases.findIndex(s => s.id === phase)
    const formDisabled =
      (currentSchemaIndex !== 0 && currentSchemaIndex < projectPhaseIndex) ||
      currentProject.archived
    const notLastPhase = currentSchemaIndex + 1 < schema.phases.length

    if (currentSchemaIndex === -1) {
      return <LoadingSpinner className="loader-icon" />
    }

    const showCreate = projectUtils.isUserPrivileged(
      this.props.currentUserId,
      this.props.users
    )

    return (
      <div>
        {!this.state.isMobile && (
          <div className="timeline" onClick={() => this.showTimelineModal(true)}>
            <ProjectTimeline
              deadlines={currentProject.deadlines}
              projectView={true}
              onhold={currentProject.onhold}
            />
          </div>
        )}
        {currentProject.phase_documents_creation_started === true &&
          currentProject.phase_documents_created === false && (
            <InfoComponent>
              {t('project.documents-created', {
                email:
                  currentProject && currentProject.attribute_data
                    ? currentProject.attribute_data.vastuuhenkilo_sahkoposti
                    : t('project.default-email')
              })}
            </InfoComponent>
          )}
        <div className={`project-input-container ${highlightGroup}`}>
          <div className="project-input-left">
            <QuickNav
              changingPhase={changingPhase}
              currentPhases={currentPhases}
              handleSave={this.handleSave}
              handleCheck={() => this.props.projectSetChecking(!this.props.checking)}
              setChecking={this.props.projectSetChecking}
              saving={saving}
              switchDisplayedPhase={switchDisplayedPhase}
              validating={validating}
              hasMissingFields={this.hasMissingFields}
              syncronousErrors={syncErrors}
              saveProjectBase={saveProjectBase}
              currentProject={currentProject}
              setHighlightRole={this.setSelectedRole}
              hasErrors={hasErrors}
              changePhase={this.changePhase}
              isCurrentPhase={selectedPhase === phase}
              isLastPhase={phase === schema.phases[schema.phases.length - 1].id}
              formValues={this.props.formValues}
              notLastPhase={notLastPhase}
              phases={this.headings}
              saveProjectBasePayload={saveProjectBasePayload}
            />
            <NavigationPrompt
              when={
                this.props.isDirty &&
                this.props.allFields &&
                this.props.allFields.length > 0
              }
            >
              {({ onConfirm, onCancel }) => (
                <Prompt
                  onCancel={onCancel}
                  onConfirm={onConfirm}
                  message={t('project.save-warning')}
                />
              )}
            </NavigationPrompt>
          </div>
          <EditForm
            handleSave={this.handleAutoSave}
            sections={currentSchema.sections}
            attributeData={attribute_data}
            geoServerData={geoserver_data}
            saving={saving}
            // changingPhase={changingPhase}
            initialValues={Object.assign(attribute_data, geoserver_data)}
            phase={phase}
            selectedPhase={selectedPhase}
            disabled={formDisabled}
            projectId={id}
            syncronousErrors={syncErrors}
            submitErrors={submitErrors}
            title={`${currentSchema.list_prefix}. ${currentSchema.title}`}
            showEditFloorAreaForm={() => this.setState({ showEditFloorAreaForm: true })}
            showEditProjectTimetableForm={() =>
              this.setState({ showEditProjectTimetableForm: true })
            }
            showCreate={showCreate}
            setRef={this.setRef}
            setFormInitialized={this.setFormInitialized}
          />
          {this.state.showEditFloorAreaForm && (
            <EditFloorAreaFormModal
              attributeData={attribute_data}
              open
              handleSubmit={saveProjectFloorArea}
              handleClose={() => this.setState({ showEditFloorAreaForm: false })}
            />
          )}
          {this.state.showEditProjectTimetableForm && (
            <EditProjectTimetableModal
              attributeData={attribute_data}
              open
              handleSubmit={this.handleTimetableClose}
              handleClose={() => this.setState({ showEditProjectTimetableForm: false })}
            />
          )}
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {
    schema: schemaSelector(state),
    saving: savingSelector(state),
    changingPhase: changingPhaseSelector(state),
    validating: validatingSelector(state),
    hasErrors: hasErrorsSelector(state),
    checking: checkingSelector(state),
    isDirty: isDirty(EDIT_PROJECT_FORM)(state),
    syncErrors: getFormSyncErrors(EDIT_PROJECT_FORM)(state),
    submitErrors: getFormSubmitErrors(EDIT_PROJECT_FORM)(state),
    formValues: getFormValues(EDIT_PROJECT_FORM)(state),
    allEditFields: allEditFieldsSelector(state),
    users: usersSelector(state),
    currentUserId: userIdSelector(state),
    currentProject: currentProjectSelector(state)
  }
}

const mapDispatchToProps = {
  fetchSchemas,
  saveProject,
  saveProjectFloorArea,
  saveProjectTimetable,
  changeProjectPhase,
  validateProjectFields,
  projectSetChecking,
  saveProjectBase,
  fetchProjectDeadlines,
  setAllEditFields,
  initializeProject,
  getProjectSnapshot,
  clearSchemas,
  saveProjectBasePayload
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProjectEditPage))
)
