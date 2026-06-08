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
import Photo from './Photo.jsx'
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
import './projectCard.scss'

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
  personnel
}) {
  const [descriptionFields, setDescriptionFields] = useState([])
  const [basicInformationFields, setBasicInformationFields] = useState([])
  const [contactsFields, setContactsFields] = useState([])
  const [photoField, setPhotoField] = useState(null)
  const [strategyConnectionFields, setStrategyConnectionFields] = useState([])
  const [timeTableFields, setTimeTableFields] = useState([])
  const [floorAreaFields, setFloorAreaFields] = useState([])
  const [contractFields, setContractFields] = useState([])
  const [planningRestriction, setPlanningRestriction] = useState(null)
  const [currentProjectId, setCurrentProjectId] = useState(projectId)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720)

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
    if (currentProject?.id?.toString() !== projectId?.toString()) {
      initializeProject(currentProjectId)
    }
  }, [currentProjectId])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleResize = () => {
    setIsMobile(window.innerWidth < 720)
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

    const projectData = { 
      ...currentProject?.attribute_data, 
      ...projectUtils.getMissingGeoData(currentProject?.attribute_data, currentProject?.geoserver_data) 
    }
    projectCardFields?.forEach(field => {
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
        switch (field.section_key) {
          case PROJECT_PICTURE:
            newField = {
              ...field,
              link: value === undefined ? null : value.link,
              description: value === undefined ? null : value.description
            }
            currentPhotoField = newField
            break
          case PROJECT_BASIC:
            currentBasicInformationFields.push(newField)
            break
          case PROJECT_DESCRIPTION:
            currentDescriptionFields.push(newField)
            break
          case PROJECT_STRATEGY:
            currentStrategyConnectionFields.push(newField)
            break
          case PROJECT_CONTRACT:
            currentContractFields.push(newField)
            break
          case PROJECT_FLOOR_AREA:
            currentFloorAreaFields.push(newField)
            break
          case PROJECT_TIMETABLE:
            currentTimeTableFields.push(newField)
            break
          case PROJECT_CONTACT:
            currentContactsFields.push(newField)
            break
          case PROJECT_BORDER:
            currentPlanningRestriction = newField
            break
        }
      })

    setDescriptionFields(currentDescriptionFields)
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
    <div className='project-card-first-row'>
      <div className="card-segment">
        <Description fields={descriptionFields} />
      </div>
      <div className="card-segment">
        <Photo field={photoField} />
      </div>
    </div>
  )
  const renderTimeLineRow = () => {
    return (
      <div className='project-card-timeline-row'>
        <div className="card-segment">
          <h2>{t('project.timeline')}</h2>
          <ProjectTimeline
            deadlines={currentProject?.deadlines}
            projectView={true}
            onhold={currentProject?.onhold}
            attribute_data={currentProject?.attribute_data}
          />
        </div>
      </div>
    )
  }
  const renderLeftSection = () => {
    return (
    <>
    <div className="card-segment">
      <Contacts fields={contactsFields} personnel={personnel} />
    </div>
    <div className="card-segment">
      <StrategyConnection fields={strategyConnectionFields} />
    </div>
    <div className="card-segment">
      <TimeTable fields={timeTableFields} />
    </div>
    <div className="card-segment">
      <Documents documentFields={externalDocuments} mapLink={currentProject?.attribute_data?.linkki_karttapalvelu}/>
    </div>
    </>
    )
  }

  const renderRightSection = () => {
    return (
      <>
        <div className="card-segment">
          <FloorAreaInformation fields={floorAreaFields} />
        </div>
         <div className="card-segment">
          <BasicInformation fields={basicInformationFields} />
        </div>
        <div className="card-segment">
          <Contract fields={contractFields} />
        </div>
        <div className="card-segment">
          <GeometryInformation field={planningRestriction} />
        </div>
      </>
    )
  }

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
        <div className="mobile-accordion">
          <GeometryInformation hideTitle={false} field={planningRestriction} />
        </div>
      </div>
    )
  }

  const renderNormalView = () => {
    const firstRow = renderFirstRow()
    const timelineRow = renderTimeLineRow()

    return (
      <div className="project-card">
        <section aria-label="Projektin yleiskuva">
          {firstRow}
          {timelineRow}
        </section>
        <div className="project-card-second-row">
          <section className="project-card-left" aria-label="Projektin lisätiedot - 1">
            {renderLeftSection()}
          </section>
          <section className="project-card-right" aria-label="Projektin lisätiedot - 2">
            {renderRightSection()}
          </section>
        </div>
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
    personnel: personnelSelector(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectCardPage)
