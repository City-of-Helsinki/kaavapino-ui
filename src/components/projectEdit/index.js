import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getFormSyncErrors, getFormSubmitErrors, getFormValues } from 'redux-form'
import { LoadingSpinner, Notification, IconCross } from 'hds-react'
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
  unlockAllFields,
  resetFloorAreaSave,
  resetTimetableSave,
  showTimetable,
  showFloorArea,
  setLastSaved,
  resetFormErrors
} from '../../actions/projectActions'
import { fetchSchemas, setAllEditFields, clearSchemas } from '../../actions/schemaActions'
import { fetchDocuments } from '../../actions/documentActions'
import {
  savingSelector,
  changingPhaseSelector,
  validatingSelector,
  hasErrorsSelector,
  checkingSelector,
  currentProjectSelector,
  floorAreaSavedSelector,
  timetableSavedSelector,
  showFloorAreaSelector,
  showTimetableSelector
} from '../../selectors/projectSelector'
import {
  documentsSelector
} from '../../selectors/documentSelector'
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
import schemaUtils from '../../utils/schemaUtils'
import { isEqual } from 'lodash'
import FormFilter from './FormFilter'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import PropTypes from 'prop-types'


class ProjectEditPage extends Component {
  state = {
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
    showSection:true,
    fields:[],
    errorFields:[]
  }

  currentSectionIndex = 0

  headings = []

  constructor(props) {
    super(props)
    const { project } = this.props
    this.props.fetchSchemas(project.id, project.subtype)
    this.errorField = React.createRef();
  }

  shouldComponentUpdate(prevProps, prevState) {
    if (isEqual(prevProps, this.props) && isEqual(prevState, this.state)) {
      return false
    }
    return true
  }

  componentDidUpdate(prevProps, prevState) {
    this.scroll()
    this.headings = this.createHeadings()
    if(prevState.errorFields != this.state.errorFields){
      if(this.state.errorFields.length > 0){
        this.errorField.current?.focus();
      }
    }
    if(prevProps.changingPhase === true && this.props.changingPhase === false){
      //get updated project data when moving to next phase
      window.location.reload();
    }
    if(prevProps.schema != this.props.schema){
      if(this.props.schema?.phases){
        const currentSchemaIndex = this.props.schema?.phases.findIndex(s => s.id === schemaUtils.getSelectedPhase(this.props.location.search,this.props.selectedPhase))
        const currentSchema = this.props.schema?.phases[currentSchemaIndex]
        //Get number of fields for filter component
        if(currentSchema?.sections){
          this.setState({fields:currentSchema.sections})
        }
      }
    }
  }
  componentDidMount() {
    localStorage.removeItem("changedValues")
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
      this.props.showTimetable(true)
      this.setState({ ...this.state })
      this.props.history.replace({ ...this.props.location, search: '' })
    }
    if (viewParameter === 'floorarea') {
      this.props.showFloorArea(true)
      this.setState({ ...this.state })
      this.props.history.replace({ ...this.props.location, search: '' })
    }

    if(this.props.users && this.props.currentUserId){
      const userData = this.props.users.find(x => x.id === this.props.currentUserId)
      
      if(userData && 'email' in userData){
        const currentEmail = userData.email
        this.setState({currentEmail});
      }
    }

    this.props.fetchDocuments(this.props.project.id)
    this.unlockAllFields()
  }

  componentWillUnmount() {
    this.props.clearSchemas()
    window.removeEventListener('resize', this.handleResize)
  }

  scroll() {
    const search = this.props.location.search
    const params = new URLSearchParams(search)

    const param = params.get('attribute')

    const element = document.getElementById(param)

    if (param && element) {
      this.props.history.replace({ ...this.props.location, search: '' })
    }
    if(element){
      element?.scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
    }
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
    if (this.props.showEditFloorAreaForm || this.props.showEditProjectTimetableForm) {
      return
    }
    if(this.props.syncErrors && !_.isEmpty(this.props.syncErrors)) {
      const dateVariable = new Date()
      const time = dateVariable.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      this.props.setLastSaved("field_error",time,[],[],false)
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
    //const projectName = this.props.currentProject.name;
    //this.props.unlockAllFields(projectName)
  }

  handleTimetableClose = () => {
    this.props.showTimetable(false)
    this.props.resetTimetableSave()
  }

  handleTimetableSave = () => {
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
    const allPhases = schema?.phases

    const newPhases = []

    allPhases?.forEach(phase => {
      const sections = []
      phase.sections.forEach(section => {
        sections.push({ title: section.title, fields: section.fields })
      })

      let phaseText
      if(this.props.currentProject?.phase === phase?.id){
        phaseText = "Vaihe käynnissä"
      }
      else if(this.props.currentProject?.phase < phase?.id){
        phaseText = "Vaihe aloittamatta"
      }
      else if(this.props.currentProject?.phase > phase?.id){
        phaseText = "Vaihe suoritettu"
      }
      else{
        phaseText = ""
      }

      const newPhase = {
        id: phase.id,
        title: phase.title,
        color: phase.color,
        color_code: phase.color_code,
        list_prefix: phase.list_prefix,
        status:phaseText,
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
      this.props.showTimetable(show)
    }
  }

  showSections = (show) => {
    this.setState({showSection: show})
    if(!show){
      this.setState({errorFields:[]})
    }
  }

  filterFields = (fields) => {
    this.setState({ filterFieldsArray: fields })
  }

  isHighlightedTag = (tag) => {
    this.setState({highlightedTag:tag})
  }

  changeSection = (index,title,fields) => {
    //Show fields only from selected navigation link, not the whole phase
    this.setState({ sectionIndex: index, phaseTitle:title, fields:fields })
    this.props.resetFormErrors()
    //Index to Header component for section title
    if(typeof this.props.getCurrentSection !== "undefined"){
      this.props.getCurrentSection(index)
    }
  }

  handleFloorAreaClose = () => {
    this.props.showFloorArea(false)
    this.props.resetFloorAreaSave()
  }

  checkRequiredFields = (documentsDownloaded,origin) => {

    this.props.projectSetChecking(this.props.checking)
    const {
      project: { attribute_data,phase },
      schema,
      t
    } = this.props

    const currentSchemaIndex = schema.phases.findIndex(s => s.id === schemaUtils.getSelectedPhase(this.props.location.search,this.props.selectedPhase))
    const currentSchema = schema.phases[currentSchemaIndex]
    const errorFields = projectUtils.getErrorFields(false,attribute_data,currentSchema,phase)
    this.setState({errorFields:errorFields})
    if(errorFields?.length === 0 && !documentsDownloaded){
      const elements = <div>
      <div>
        <h3>{t('messages.required-documents-header')}
          <span className='icon-container'><IconCross size="s" /></span>
        </h3>
      </div>
      <div>
        <p>{t('messages.required-documents-text')}
        </p>
      </div>
    </div>
    //show toastr message
    toast.error(elements, {
      toastId:"errorsToastr",
      position: "top-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      progress: undefined,
      theme: "light"
      });
    }
    else if(errorFields?.length === 0 && documentsDownloaded && origin === "checkphase"){
      const elements = <div>
        <div>
          <h3>{t('messages.required-fields-filled-header')}
            <span className='icon-container'><IconCross size="s" /></span>
          </h3>
        </div>
        <div>
          <p>{t('messages.required-fields-filled-text')}
          </p>
        </div>
      </div>
      //show toastr message
      toast.success(elements, {
        toastId:"noErrorsToastr",
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: "light",
        });
    }
  }

  checkTarget = (target) => {
    let focusedTarget
    if (target.querySelector('.rich-text-editor-wrapper')) {
      focusedTarget = target.querySelector("p")
      focusedTarget.tabIndex = 0
    }
    else if (target.querySelector('input')) {
      focusedTarget = target.querySelector("input")
      if(focusedTarget.type === "file"){
        focusedTarget = target.querySelector(".upload-button")
      }
    }
    else if (target.querySelector('.selection')) {
      focusedTarget = target.querySelector(".selection button")
    }
    else if (target.querySelector('button')) {
      focusedTarget = target.querySelector("button")
    }
    return focusedTarget
  }

  showErrorField = (section,anchor) => {
    let activeSection = document.getElementsByClassName("active")[0];
    let container
    let target
    let focusedTarget
    let openSection
    if(activeSection?.textContent === "section"){
      container = document.getElementById(anchor)
      target = container.closest(".input-container")
      focusedTarget = this.checkTarget(target)
      focusedTarget?.focus();
    }
    else{
      openSection = document.getElementById(section)
      openSection?.click();
      this.waitForElm(anchor).then(() => {
        container = document.getElementById(anchor)
        target = container.closest(".input-container")
        focusedTarget = this.checkTarget(target)
        focusedTarget?.focus();
      });
    }
  }

  waitForElm = (selector) => {
    return new Promise(resolve => {
        if (document.getElementById(selector)) {
            return resolve(document.getElementById(selector));
        }
  
        const observer = new MutationObserver(() => {
            if (document.getElementById(selector)) {
                resolve(document.getElementById(selector));
                observer.disconnect();
            }
        });
  
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
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
      currentUserId,
      documents
    } = this.props
    const { highlightGroup } = this.state

    if (!schema) {
      return <LoadingSpinner className="loader-icon" />
    }

    const currentSchemaIndex = schema.phases.findIndex(
      s => s.id === schemaUtils.getSelectedPhase(this.props.location.search,this.props.selectedPhase)
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

    let color
    let phaseText
    if(phase === currentSchema?.id){
      color = "#FFC61E"
      phaseText = "Vaihe käynnissä"
    }
    else if(phase < currentSchema?.id){
      color = "#0072C6"
      phaseText = "Vaihe aloittamatta"
    }
    else if(phase > currentSchema?.id){
      color = "#008741"
      phaseText = "Vaihe suoritettu"
    }
    else{
      color = ""
      phaseText = ""
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
          allfields={this.state.fields}
          currentlyHighlighted={this.state.highlightedTag}
        />
        {this.state.errorFields?.length > 0 ?
        <div tabIndex="0" ref={this.errorField} className='required-fields-container'>
          <Notification id="required-fields-notification" label="Lomakkeelta puuttuu pakollisia tietoja" type="error" style={{marginTop: 'var(--spacing-s)'}}>
            <ul>
            {this.state.errorFields.map((error,index) =>{
              return (
                <li key={error.errorSection + error.errorField}>
                  Virhe {index + 1}: <a href='#0' role="button" onClick={() => this.showErrorField(error.errorSection,error.fieldAnchorKey)} className='required-fields-notification-link'>{error.errorSection} - {error.errorField}</a>
                </li>
              )
            })}
            </ul>
          </Notification>
        </div>
        :
        ""
        }
        <div className={`project-input-container ${highlightGroup}`}>
          <div className="project-input-left">
            <QuickNav
              changingPhase={changingPhase}
              currentPhases={currentPhases}
              handleSave={this.handleSave}
              handleCheck={this.checkRequiredFields}
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
              phasePrefix={currentSchema.list_prefix}
              phaseTitle={currentSchema.title}
              phaseStatus={phaseText}
              phaseColor={color}
              showSections={this.showSections}
              documents={documents}
              currentSchema={currentSchema}
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
            initialValues={Object.assign(attribute_data, geoserver_data)}
            phase={phase}
            selectedPhase={selectedPhase}
            isCurrentPhase={selectedPhase === phase}
            disabled={formDisabled}
            projectId={id}
            syncronousErrors={syncErrors}
            submitErrors={submitErrors}
            title={`${currentSchema.list_prefix}. ${currentSchema.title}`}
            isExpert={isExpert}
            setRef={this.setRef}
            setFormInitialized={this.setFormInitialized}
            unlockAllFields={this.unlockAllFields}
            phaseTitle={this.state.phaseTitle}
            filterFieldsArray={this.state.filterFieldsArray}
            highlightedTag={this.state.highlightedTag}
            sectionIndex={this.state.sectionIndex}
            showSection={this.state.showSection}
            deadlines={currentProject.deadlines}
            phaseIsClosed={formDisabled}
          />
          {this.props.showFloorAreaForm && (
            <EditFloorAreaFormModal
              attributeData={attribute_data}
              open
              saveProjectFloorArea={saveProjectFloorArea}
              handleClose={() => this.handleFloorAreaClose()}
              allowedToEdit={isAdmin || isResponsible}
            />
          )}
          {this.props.showTimetableForm && (
            <EditProjectTimetableModal
              attributeData={attribute_data}
              open
              handleSubmit={() => this.handleTimetableSave()}
              handleClose={() => this.handleTimetableClose()}
              projectPhaseIndex={projectPhaseIndex}
              archived={currentProject.archived}
              allowedToEdit={isAdmin || isResponsible}
            />
          )}
        </div>
      </div>
    )
  }
}

ProjectEditPage.propTypes = {
  currentProject:PropTypes.object,
  project: PropTypes.object,
  schema: PropTypes.object,
  resetFormErrors: PropTypes.func
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
    currentProject: currentProjectSelector(state),
    floorAreaSavedSelector: floorAreaSavedSelector(state),
    timetableSavedSelector: timetableSavedSelector(state),
    documents: documentsSelector(state),
    showTimetableForm:showTimetableSelector(state),
    showFloorAreaForm:showFloorAreaSelector(state) 
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
  saveProjectBasePayload,
  resetFloorAreaSave,
  resetTimetableSave,
  fetchDocuments,
  showTimetable,
  showFloorArea,
  setLastSaved,
  resetFormErrors
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProjectEditPage))
)
