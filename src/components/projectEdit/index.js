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
  resetTimetableSave
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
  timetableSavedSelector
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
import { isEqual } from 'lodash'
import FormFilter from './FormFilter'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

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
    showSection:false,
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

  componentDidUpdate(_, prevState) {
    this.scroll()
    this.headings = this.createHeadings()
    if(prevState.errorFields != this.state.errorFields){
      if(this.state.errorFields.length > 0){
        this.errorField.current?.focus();
      }
    }
  }
  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
    //window.addEventListener("click", this.checkClickedElement);

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

    this.props.fetchDocuments(this.props.project.id)
    this.unlockAllFields()
  }

  componentWillUnmount() {
    this.props.clearSchemas()
    //window.removeEventListener("click", this.checkClickedElement);
    window.removeEventListener('resize', this.handleResize)
  }

/*    checkClickedElement = (e) => {
    if(e.target.className && (typeof e.target.className === 'string' || e.target.className instanceof String)){
      //Lose focus and unclock if select button is clicked
      if(e.target.className.includes("Select-module") || e.target.parentNode.className.includes("Select-module")){
        this.unlockAllFields()
      }
    }
  }; */

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
    this.setState({ showEditProjectTimetableForm: false })
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
          status:phase.status,
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
  }

  handleFloorAreaClose = () => {
    this.setState({ showEditFloorAreaForm: false })
    this.props.resetFloorAreaSave()
  }

  checkRequiredFields = (documentsDownloaded) => {
    console.log(documentsDownloaded)
    this.props.projectSetChecking(this.props.checking)
    const {
      project: { attribute_data },
      schema,
      t
    } = this.props

    const currentSchemaIndex = schema.phases.findIndex(s => s.id === this.getSelectedPhase())
    const currentSchema = schema.phases[currentSchemaIndex]
    const errorFields = projectUtils.getErrorFields(attribute_data, currentSchema)

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
    else if(errorFields?.length === 0 && documentsDownloaded){
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

  showErrorField = (section,anchor) => {
    let activeSection = document.getElementsByClassName("active")[0];
    let target
    let openSection
    if(activeSection?.textContent === "section"){
      target = document.getElementById(anchor)
      target?.focus();
    }
    else{
      openSection = document.getElementById(section)
      openSection?.click();
      this.waitForElm(anchor).then(() => {
        target = document.getElementById(anchor)
        target?.focus();
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
          allfields={this.state.fields}
        />
        {this.state.errorFields?.length > 0 ?
        <div tabIndex="0" ref={this.errorField} className='required-fields-container'>
          <Notification id="required-fields-notification" label="Lomakkeelta puuttuu pakollisia tietoja" type="error" style={{marginTop: 'var(--spacing-s)'}}>
            <ul>
            {this.state.errorFields.map((error,index) =>{
              return (
                <li key={error.errorSection + error.errorField}>
                  Virhe {index}: <a href='#0' role="button" onClick={() => this.showErrorField(error.errorSection,error.fieldAnchorKey)} className='required-fields-notification-link'>{error.errorSection} - {error.errorField}</a>
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
              phaseStatus={currentSchema.status}
              phaseColor={currentSchema.color_code}
              showSections={this.showSections}
              documents={documents}
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
            sectionIndex={this.state.sectionIndex}
            showSection={this.state.showSection}
          />
          {this.state.showEditFloorAreaForm && (
            <EditFloorAreaFormModal
              attributeData={attribute_data}
              open
              saveProjectFloorArea={saveProjectFloorArea}
              handleClose={() => this.handleFloorAreaClose()}
              isFloorAreaSaved={this.props.floorAreaSavedSelector}
            />
          )}
          {this.state.showEditProjectTimetableForm && (
            <EditProjectTimetableModal
              attributeData={attribute_data}
              open
              handleSubmit={() => this.handleTimetableSave()}
              handleClose={() => this.handleTimetableClose()}
              isTimetableSaved={this.props.timetableSavedSelector}
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
    currentProject: currentProjectSelector(state),
    floorAreaSavedSelector: floorAreaSavedSelector(state),
    timetableSavedSelector: timetableSavedSelector(state),
    documents: documentsSelector(state)
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
  fetchDocuments
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProjectEditPage))
)
