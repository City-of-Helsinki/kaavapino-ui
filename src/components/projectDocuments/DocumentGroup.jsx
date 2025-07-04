import React from 'react'
import Document from './Document.jsx'
import { Accordion,IconAlertCircle,IconCheck } from 'hds-react'
import projectUtils from '../../utils/projectUtils'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

const DocumentGroup = ({ title, documents, projectId, phaseEnded, phase, isUserResponsible, schema, attribute_data, selectedPhase, search, project, disableDownloads, downloadingDocumentReady }) => {
  const {t} = useTranslation()

  const checkRequired = () => {
    const index = getCorrectPhaseIndex()
    let hasErrors
    const currentSchema = schema?.phases[index]
    const errorFields = projectUtils.getErrorFields(true,attribute_data,currentSchema,project?.phase)
    if(errorFields.length > 0){
      hasErrors = true
    }
    else{
      hasErrors = false
    }
    return hasErrors
  }

  const isSceduleAccepted = () => {
    const currentSchemaIndex = getCorrectPhaseIndex()
    const currentSchema = schema?.deadline_sections[currentSchemaIndex]
    const nonAcceptedFields = projectUtils.isSceduleAccepted(attribute_data, currentSchema)
    let accepted
    if(nonAcceptedFields.length > 0){
      accepted = false
    }
    else{
      accepted = true
    }
    return accepted
  }

  const getCorrectPhaseIndex = () => {
    //XL Luonnos -2 to starting index so document accordians are check correctly
    //Other situations - periaatteet, luonnos + periaate, non xl projects -1
    //compared to groupedDocuments[key] that has different indexes
    let currentSchemaIndex = schema?.subtype_name === "XL" && attribute_data?.luonnos_luotu && !attribute_data?.periaatteet_luotu ? phase.phaseIndex - 2 : phase.phaseIndex - 1
    if(schema?.subtype_name === "XL" && !attribute_data?.luonnos_luotu && attribute_data?.periaatteet_luotu && phase.phaseIndex === 5){
      currentSchemaIndex = 3
    }
    else if(schema?.subtype_name === "XL" && !attribute_data?.luonnos_luotu && attribute_data?.periaatteet_luotu && phase.phaseIndex === 6){
      currentSchemaIndex = 4
    } 
    return currentSchemaIndex
  }

  const hideButtons = () => {
    const hideButtons = checkRequired()
    return hideButtons
  }
  
  const getStatus = () => {
    const currentSchemaIndex = getCorrectPhaseIndex()
    const currentSchema = schema?.phases[currentSchemaIndex]
    const requirements = checkRequired()
    const scheduleAccepted = isSceduleAccepted()
    let status
    if(phaseEnded){
      status = 
      <div className='document-group-requirements'>
        <div className="phase-end-tag document-status required-error-text">
          <span><IconAlertCircle size="s" />{t('project.phase-passed')}</span>
        </div>
        <div className='document-status-info'><span>{t('project.phase-preview-ended')}</span></div>
      </div>
    }
    else if(schema && !requirements && scheduleAccepted && currentSchema?.id === project?.phase){
      status = 
      <div className='document-group-requirements'>
        <div className='document-status required-success-text'>
          <span><IconCheck size="s" />{t('project.phase-ok')}</span></div>
        <div className='document-status-info'><span>{t('project.phase-load-ok')}</span></div>
      </div>
    }
    else{
      status = 
      <div className='document-group-requirements'>
        <div className='document-status required-error-text'>
          <span><IconAlertCircle size="s" />{t('project.phase-load-prevented')}</span></div>
        <div className='document-status-info'><span>{t('project.phase-preview-only')}</span></div>
      </div> 
    }
    return status
  }

  const name = title?.props?.children?.props?.children
  if(name === "XL. Luonnos" && !attribute_data?.luonnos_luotu || name === "XL. Periaatteet" && !attribute_data?.periaatteet_luotu || !schema){
    return (
      <></>
    )
  }
  else{
    return (
      <div className="document-group">
        <Accordion heading={title} headingLevel={2} className="document-accordion" size="m">
          {schema ? getStatus() : ""}
          {documents.map(({ name, file, last_downloaded, image_template, id }, i) => (
            <Document
              title={title}
              phaseEnded={phaseEnded}
              lastDownloaded={last_downloaded}
              id={id}
              image_template={image_template}
              projectId={projectId}
              name={name}
              file={file}
              key={i}
              phaseIndex={phase.phaseIndex}
              isUserResponsible={isUserResponsible}
              schema={schema}
              attribute_data={attribute_data}
              selectedPhase={selectedPhase}
              search={search}
              hideButtons={schema ? hideButtons() : true}
              scheduleAccepted={schema ? isSceduleAccepted() : false}
              project={project}
              disableDownloads={disableDownloads}
              downloadingDocumentReady={downloadingDocumentReady}
            />
          ))}
        </Accordion>
      </div>
    )
  }
}

DocumentGroup.propTypes = {
  schema: PropTypes.object,
  attribute_data: PropTypes.object,
  phase: PropTypes.object,
  title: PropTypes.object,
  project: PropTypes.object,
  disableDownloads: PropTypes.func,
  downloadingDocumentReady: PropTypes.bool
}

export default DocumentGroup
