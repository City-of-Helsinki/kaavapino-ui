import React, { useState, useEffect } from 'react'
import { Grid, Segment } from 'semantic-ui-react'
import BasicInformation from './BasicInformation'
import Contract from './Contract'
import Description from './Description'
import ProjectTimeline from '../ProjectTimeline/ProjectTimeline'
import VisTimeline from '../ProjectTimeline/VisTimeline'
import VisTimelineGroup from '../ProjectTimeline/VisTimelineGroup'
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
    getProjectCardFields()
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
         let value = projectUtils.findValueFromObject(projectData, field.name)

        const returnValues = []
        projectUtils.findValuesFromObject(projectData, field.name, returnValues)

        if (returnValues.length > 1) {
          let currentValues = []
          returnValues.forEach(current => {
            currentValues.push(current)
          })
          value = currentValues
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
    <Grid stackable columns="equal">
      <Grid.Column width={8}>
        <Segment>
          <Description fields={descriptionFields} />
        </Segment>
      </Grid.Column>
      <Grid.Column>
        <Segment>
          <Photo field={photoField} />
        </Segment>
      </Grid.Column>
    </Grid>
  )
  const renderTimeLineRow = () => {
    return (
      <Grid stackable columns="equal">
        <Grid.Column>
          <Segment>
            <ProjectTimeline
              deadlines={currentProject && currentProject.deadlines}
              projectView={true}
              onhold={currentProject && currentProject.onhold}
            />
          </Segment>
        </Grid.Column>
      </Grid>
    )
  }
  const renderSecondRow = () => {
    return (
      <Grid stackable columns="equal">
        <Grid.Column width={5}>
          <Segment>
            <Contacts fields={contactsFields} personnel={personnel} />
          </Segment>
          <Segment key="basic-information">
            <StrategyConnection fields={strategyConnectionFields} />
          </Segment>
          <Segment>
            <TimeTable fields={timeTableFields} />
          </Segment>
        </Grid.Column>
        <Grid.Column>
          <Segment>
            <FloorAreaInformation fields={floorAreaFields} />
          </Segment>
          <Grid columns="equal">
            <Grid.Column className="inner-left-column">
              <Segment key="basic-information">
                <BasicInformation fields={basicInformationFields} />
              </Segment>
            </Grid.Column>
            <Grid.Column className="inner-right-column">
              <Segment>
                <Contract fields={contractFields} />
              </Segment>
            </Grid.Column>
          </Grid>
          <Segment>
            <GeometryInformation field={planningRestriction} />
          </Segment>
          <Segment>
            <Documents documentFields={externalDocuments} mapLink={currentProject?.attribute_data?.linkki_karttapalvelu}/>
          </Segment>
        </Grid.Column>
      </Grid>
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
      <>
        <VisTimeline deadlines={currentProject && currentProject.deadlines}/>
        <VisTimelineGroup/>
        <div className="project-card">
          {firstRow}
          {timelineRow}
          {secondRow}
        </div>
      </>
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
