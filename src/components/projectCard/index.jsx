import React, { useState, useEffect } from 'react'
import BasicInformation from './BasicInformation'
import Contract from './Contract'
import Description from './Description'
import ProjectTimeline from '../ProjectTimeline/ProjectTimeline'
import TimeTable from './Timetable'
import Contacts from './Contacts'
import FloorAreaInformation from './FloorAreaInformation'
import StrategyConnection from './StrategyConnection'
import GeometryInformation from './GeometryInformation'
import Photo from './Photo'
import Documents from './Documents'
import projectUtils from './../../utils/projectUtils'
import {
  getExternalDocuments,
  initializeProject,
  clearExternalDocuments
} from '../../actions/projectActions'
import {
  externalDocumentsSelector,
  currentProjectSelector,
  personnelSelector
} from '../../selectors/projectSelector'
import { connect } from 'react-redux'
import { getProjectCardFields } from '../../actions/schemaActions'
import { projectCardFieldsSelector } from '../../selectors/schemaSelector'
import { Accordion } from 'hds-react'
import { useTranslation } from 'react-i18next'
import { unreadCommentsCountSelector } from '../../selectors/commentSelector'
import CommentsMobile from '../shoutbox/comments/CommentsMobile'
import './ProjectCard.scss'

export const PROJECT_PICTURE = 'projektikortin_kuva'
export const PROJECT_BASIC = 'perustiedot'
export const PROJECT_DESCRIPTION = 'suunnittelualueen_kuvaus'
export const PROJECT_STRATEGY = 'strategiakytkenta'
export const PROJECT_CONTRACT = 'maanomistus'
export const PROJECT_FLOOR_AREA = 'kerrosalatiedot'
export const PROJECT_TIMETABLE = 'aikataulu'
export const PROJECT_CONTACT = 'yhteyshenkilot'
export const PROJECT_DOCUMENTS = 'dokumentit'
export const PROJECT_BORDER = 'suunnittelualueen_rajaus'

function ProjectCardPage({
  projectId,
  getExternalDocuments,
  getProjectCardFields,
  externalDocuments,
  projectCardFields,
  currentProject,
  initializeProject,
  clearExternalDocuments,
  unreadCommentsCount,
  personnel
}) {
  const [descriptionFields, setDescriptionDFields] = useState([])
  const [basicInformationFields, setBasicInformationFields] = useState([])
  const [contactsFields, setContactsFields] = useState([])
  const [photoField, setPhotoField] = useState(null)
  const [strategyConnectionFields, setStrategyConnectionFields] = useState([])
  const [timeTableFields, setTimeTableFields] = useState([])
  const [floorAreaFields, setFloorAreaFields] = useState([])
  const [contractFields, setContractFields] = useState([])
  const [planningRestriction, setPlanningRestriction] = useState(null)
  const [currentProjectId, setCurrentProjectId] = useState(projectId)
  const [isMobile, setIsMobile] = useState(false)

  const { t } = useTranslation()

  useEffect(() => {
    getProjectCardFields(projectId)
    getExternalDocuments(projectId)
  }, [])

  useEffect(() => {
    buildPage()
  }, [projectCardFields, externalDocuments])

  useEffect(() => {
    setCurrentProjectId(projectId)
  }, [projectId])

  useEffect(() => {
    if (currentProject.id.toString() !== projectId.toString()) {
      initializeProject(currentProjectId)
    }
  }, [currentProjectId])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  // create an event listener
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    if (window.innerWidth < 720) {
      setIsMobile(true)
    }
  })

  //choose the screen size
  const handleResize = () => {
    if (window.innerWidth < 720) {
      setIsMobile(true)
    } else {
      setIsMobile(false)
    }
  }
  useEffect(() => {
    return () => {
      clearExternalDocuments()
    }
  }, [])

  const buildPage = () => {
    const currentDescriptionFields = []
    const currentBasicInformationFields = []
    const currentContactsFields = []
    let currentPhotoField = null
    const currentStrategyConnectionFields = []
    const currentTimeTableFields = []
    const currentFloorAreaFields = []
    const currentContractFields = []
    let currentPlanningRestriction = null

    const projectData = Object.assign(
      currentProject && currentProject.attribute_data,
      projectUtils.getMissingGeoData(currentProject?.attribute_data,currentProject?.geoserver_data)
    )
    projectCardFields &&
      projectCardFields.forEach(field => {
        let value;
        const returnValues = [];
        projectUtils.findValuesFromObject(projectData, field.name, returnValues);

        if (returnValues.length > 0) {
          value = returnValues.length === 1 ? returnValues[0] : returnValues;
        }

        let newField = {
          ...field,
          value: value === undefined ? null : value
        }
        if (field.section_key === PROJECT_PICTURE) {
          newField = {
            ...field,
            link: value === undefined ? null : value.link,
            description: value === undefined ? null : value.description
          }
          currentPhotoField = newField
        }
        if (field.section_key === PROJECT_BASIC) {
          currentBasicInformationFields.push(newField)
        }
        if (field.section_key === PROJECT_DESCRIPTION) {
          currentDescriptionFields.push(newField)
        }
        if (field.section_key === PROJECT_STRATEGY) {
          currentStrategyConnectionFields.push(newField)
        }
        if (field.section_key === PROJECT_CONTRACT) {
          currentContractFields.push(newField)
        }
        if (field.section_key === PROJECT_FLOOR_AREA) {
          currentFloorAreaFields.push(newField)
        }
        if (field.section_key === PROJECT_TIMETABLE) {
          currentTimeTableFields.push(newField)
        }
        if (field.section_key === PROJECT_CONTACT) {
          currentContactsFields.push(newField)
        }

        if (field.section_key === PROJECT_BORDER) {
          currentPlanningRestriction = newField
        }
      })

    setDescriptionDFields(currentDescriptionFields)
    setBasicInformationFields(currentBasicInformationFields)
    setContactsFields(currentContactsFields)
    setPhotoField(currentPhotoField)
    setStrategyConnectionFields(currentStrategyConnectionFields)
    setTimeTableFields(currentTimeTableFields)
    setFloorAreaFields(currentFloorAreaFields)
    setContractFields(currentContractFields)
    setPlanningRestriction(currentPlanningRestriction)
  }

  const renderFirstRow = () => (
    <div className="pc-grid">
      <div className="pc-col pc-col-6">
        <div className="pc-segment">
          <Description fields={descriptionFields} />
        </div>
      </div>

      <div className="pc-col">
        <div className="pc-segment">
          <Photo field={photoField} />
        </div>
      </div>
    </div>
  );

  const renderTimeLineRow = () => (
    <div className="pc-grid">
      <div className="pc-col">
        <div className="pc-segment">
          <ProjectTimeline
            deadlines={currentProject && currentProject.deadlines}
            projectView={true}
            onhold={currentProject && currentProject.onhold}
            attribute_data={currentProject && currentProject.attribute_data}
          />
        </div>
      </div>
    </div>
  );

  const renderSecondRow = () => (
    <div className="pc-grid last-grid">
      <div className="pc-col pc-col-5 inner-left-column">
        <div className="pc-segment">
          <Contacts fields={contactsFields} personnel={personnel} />
        </div>

        <div className="pc-segment" key="basic-information">
          <StrategyConnection fields={strategyConnectionFields} />
        </div>

        <div className="pc-segment">
          <TimeTable fields={timeTableFields} />
        </div>
      </div>

      <div className="pc-col inner-right-column">
        <div className="pc-segment">
          <FloorAreaInformation fields={floorAreaFields} />
        </div>

        <div className="pc-grid pc-grid-inner">
          <div className="pc-col inner-left-column">
            <div className="pc-segment" key="basic-information">
              <BasicInformation fields={basicInformationFields} />
            </div>
          </div>

          <div className="pc-col inner-right-column">
            <div className="pc-segment">
              <Contract fields={contractFields} />
            </div>
          </div>
        </div>

        <div className="pc-segment">
          <GeometryInformation field={planningRestriction} />
        </div>

        <div className="pc-segment">
          <Documents
            documentFields={externalDocuments}
            mapLink={currentProject?.attribute_data?.linkki_karttapalvelu}
          />
        </div>
      </div>
    </div>
  );

  const renderMobileView = () => {
    return (
      <div>
        <h3>{currentProject.name}</h3>
        <Accordion className="mobile-accordion" heading={t('project.description-title')}>
          <Description hideTitle={true} fields={descriptionFields} />
        </Accordion>
        <Accordion className="mobile-accordion" heading={t('project.photo-title')}>
          <Photo field={photoField} />
        </Accordion>
        <Accordion className="mobile-accordion" heading={t('project.contact-title')}>
          <Contacts hideTitle={true} fields={contactsFields} personnel={personnel} />
        </Accordion>
        <Accordion className="mobile-accordion" heading={t('project.floor-area-title')}>
          <FloorAreaInformation hideTitle={true} fields={floorAreaFields} />
        </Accordion>
        <Accordion
          className="mobile-accordion"
          heading={t('project.basic-information-title')}
        >
          <BasicInformation hideTitle={true} fields={basicInformationFields} />
        </Accordion>
        <Accordion className="mobile-accordion" heading={t('project.contract-title')}>
          <Contract hideTitle={true} fields={contractFields} />
        </Accordion>
        <Accordion
          className="mobile-accordion"
          heading={t('project.strategy-connection-title')}
        >
          <StrategyConnection hideTitle={true} fields={strategyConnectionFields} />
        </Accordion>
        <Accordion className="mobile-accordion" heading={t('project.timetable-title')}>
          <TimeTable hideTitle={true} fields={timeTableFields} />
        </Accordion>

        <Accordion className="mobile-accordion" heading={t('project.documents-title')}>
          <Documents hideTitle={true} documentFields={externalDocuments} />
        </Accordion>
        <Accordion
          className="mobile-accordion"
          heading={`Viestit ${unreadCommentsCount > 0 ? unreadCommentsCount : ''}`}
        >
          <CommentsMobile projectId={projectId} />
        </Accordion>
        <div className="mobile-accordion">
          <GeometryInformation hideTitle={true} field={planningRestriction} />
        </div>
      </div>
    )
  }

  const renderNormalView = () => {
    const firstRow = renderFirstRow()
    const secondRow = renderSecondRow()
    const timelineRow = renderTimeLineRow()

    return (
      <div className="project-card">
        {firstRow}
        {timelineRow}
        {secondRow}
      </div>
    )
  }

  return isMobile ? renderMobileView() : renderNormalView()
}
const mapDispatchToProps = {
  getExternalDocuments,
  getProjectCardFields,
  initializeProject,
  clearExternalDocuments
}

const mapStateToProps = state => {
  return {
    externalDocuments: externalDocumentsSelector(state),
    projectCardFields: projectCardFieldsSelector(state),
    currentProject: currentProjectSelector(state),
    unreadCommentsCount: unreadCommentsCountSelector(state),
    personnel: personnelSelector(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectCardPage)
