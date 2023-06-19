import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getFormSyncErrors, getFormSubmitErrors, getFormValues } from 'redux-form'
import { LoadingSpinner } from 'hds-react'
import { isDirty } from 'redux-form/immutable'
import {
  unlockProjectField,
  lockProjectField,
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
  saveProjectBasePayload,
  unlockAllFields
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
import authUtils from '../../utils/authUtils'
import { isEqual } from 'lodash'
import FormFilter from './FormFilter'

class ProjectEditPage extends Component {
  state = {
    showEditFloorAreaForm: false,
    showEditProjectTimetableForm: false,
    highlightGroup: '',
    refs: [],
    selectedRefName: null,
    currentRef: null,
    formInitialized: false,
    currentEmail: "",
    sectionIndex:0,
    phaseTitle:0,
    filterFieldsArray: [],
    highlightedTag: "",
    fieldCount:0
  }

  currentSectionIndex = 0

  headings = []

  constructor(props) {
    super(props)
    const { project } = this.props
    this.props.fetchSchemas(project.id, project.subtype)
  }

  shouldComponentUpdate(prevProps, prevState) {
    if (isEqual(prevProps, this.props) && isEqual(prevState, this.state)) {
      return false
    }
    return true
  }

  componentDidUpdate() {
    this.scroll()
    this.headings = this.createHeadings()
  }
  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
    window.addEventListener("click", this.checkClickedElement);

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

    if(this.props.users && this.props.currentUserId){
      const userData = this.props.users.find(x => x.id === this.props.currentUserId)
      
      if(userData && 'email' in userData){
        const currentEmail = userData.email
        this.setState({currentEmail});
      }
    }

    this.unlockAllFields()
  }

  componentWillUnmount() {
    this.props.clearSchemas()
    window.removeEventListener("click", this.checkClickedElement);
    window.removeEventListener('resize', this.handleResize)
  }

   checkClickedElement = (e) => {
    if(e.target.className && (typeof e.target.className === 'string' || e.target.className instanceof String)){
      //Lose focus and unclock if select button is clicked
      if(e.target.className.includes("Select-module") || e.target.parentNode.className.includes("Select-module")){
        this.unlockAllFields()
      }
    }
  };

  scroll() {
    const search = this.props.location.search
    const params = new URLSearchParams(search)

    const param = params.get('attribute')

    const element = document.getElementById(param)

    if (param && element) {
      this.props.history.replace({ ...this.props.location, search: '' })
    }

    element?.scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
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
    const projectName = this.props.currentProject.name;
    this.props.saveProject()
    this.props.unlockAllFields(projectName)
  }

  handleAutoSave = () => {
    if (this.state.showEditFloorAreaForm || this.state.showEditProjectTimetableForm) {
      return
    }

    if (this.props.syncErrors && !_.isEmpty(this.props.syncErrors)) {
      return
    }
    this.props.saveProject()
  }

  handleLockField = (inputname) => {
    const projectName = this.props.currentProject.name;
    this.props.lockProjectField(projectName,inputname)
  }

  handleUnlockField = (inputname) => {
    const projectName = this.props.currentProject.name;
    this.props.unlockProjectField(projectName,inputname)
  }

  unlockAllFields = () => {
    const projectName = this.props.currentProject.name;
    this.props.unlockAllFields(projectName)
  }

  handleTimetableClose = () => {
    const { project, saveProjectTimetable } = this.props
    saveProjectTimetable()
    initializeProject(project.id)
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
          sections.push({ title: section.title, fields: section.fields })
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
    const {
      project: { attribute_data },
      currentProject,
      schema
    } = this.props
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
    const isExpert = authUtils.isExpert(this.props.currentUserId, this.props.users)

    if (isExpert) {
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

  filterFields = (fields) => {
    this.setState({ filterFieldsArray: fields })
  }

  isHighlightedTag = (tag) => {
    this.setState({highlightedTag:tag})
  }

  visibleFields = (count) => {
    this.setState({fieldCount:count})
  }

  changeSection = (index,title) => {
    //Show fields only from selected navigation link, not the whole phase
    this.setState({ sectionIndex: index, phaseTitle:title })
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
      currentPhases,
      users,
      currentUserId
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

    const isResponsible = authUtils.isResponsible(currentUserId, users)
    const isAdmin = authUtils.isAdmin(currentUserId, users)
    const isExpert = authUtils.isExpert(currentUserId, users)

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
        <FormFilter 
          schema={schema} 
          filterFields={this.filterFields} 
          isHighlightedTag={this.isHighlightedTag} 
          selectedPhase={selectedPhase}
          visibleFields={this.visibleFields}
          sectionIndex={this.state.sectionIndex}
        />
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
              isResponsible={isResponsible}
              isAdmin={isAdmin}
              phase={phase}
              unlockAllFields={this.unlockAllFields}
              changeSection={this.changeSection}
              filterFieldsArray={this.state.filterFieldsArray}
              highlightedTag={this.state.highlightedTag}
              setFilterAmount={this.setFilterAmount}
              visibleFields={this.visibleFields}
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
            handleLockField={this.handleLockField}
            handleUnlockField={this.handleUnlockField}
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
            isExpert={isExpert}
            setRef={this.setRef}
            setFormInitialized={this.setFormInitialized}
            unlockAllFields={this.unlockAllFields}
            phaseTitle={this.state.phaseTitle}
            filterFieldsArray={this.state.filterFieldsArray}
            highlightedTag={this.state.highlightedTag}
            fieldCount={this.state.fieldCount}
            sectionIndex={this.state.sectionIndex}
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
  lockProjectField,
  unlockProjectField,
  unlockAllFields,
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
