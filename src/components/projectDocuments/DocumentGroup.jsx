import React from 'react'
import Document from './Document.jsx'
import { Accordion,IconAlertCircle,IconCheck } from 'hds-react'
import projectUtils from '../../utils/projectUtils'
import { isCurrentPhaseConfirmed } from '../../utils/projectVisibilityUtils'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

const DocumentGroup = ({ title, documents, projectId, phaseEnded, phase, isUserResponsible, schema, attribute_data, selectedPhase, search, project, disableDownloads, downloadingDocumentReady }) => {
  const {t} = useTranslation()

  // Accessibility fixes, re-evaluate when HDS-react is updated
  const handleAccordionKeyDown = (event) => {
    if (event.key !== ' ' && event.key !== 'Spacebar') {
      return
    }
    const target = event.target
    const isAccordionControl = target?.closest?.('.document-accordion button, .document-accordion [role="button"]')
    if (isAccordionControl) {
      event.preventDefault()
      target.click()
    }
  }

  const checkRequired = () => {
    const index = getCorrectPhaseIndex()
    let hasErrors
    const currentSchema = schema?.phases[index]
    const currentDeadlineSchema = schema.deadline_sections[index]
    const errorFields = projectUtils.getErrorFields(true,attribute_data,currentSchema,project?.phase,currentDeadlineSchema,false)
    if(errorFields.length > 0){
      hasErrors = true
    }
    else{
      hasErrors = false
    }
    return hasErrors
  }

  /* 
    Converts phaseIndex to actual array index in schema.phases.
    phaseIndex is 1-based and assumes all XL phases are present,
    schema.phases is 0-based and only includes present phases.
  */
  const getCorrectPhaseIndex = () => {
    // Non-XL projects are always in order. Käynnistys phase (phaseIndex 1) is always first.
    if (schema?.subtype_name !== "XL" || phase.phaseIndex == 1) {
      return phase.phaseIndex - 1;
    }
    if (attribute_data?.luonnos_luotu && attribute_data?.periaatteet_luotu) {
      return phase.phaseIndex - 1;
    }
    if (attribute_data?.periaatteet_luotu && !attribute_data?.luonnos_luotu) {
      return phase.phaseIndex > 3 ? phase.phaseIndex - 2 : phase.phaseIndex - 1;
    }
    if(attribute_data?.luonnos_luotu && !attribute_data?.periaatteet_luotu){
      return phase.phaseIndex > 1 ? phase.phaseIndex - 2 : phase.phaseIndex - 1;
    }
    // Both missing is an illegal case, but handling it anyway for future
    if (phase.phaseIndex == 3) {
      return 0; // OAS
    }
    return phase.phaseIndex - 3;
  }

  const hideButtons = () => {
    const hideButtons = checkRequired()
    return hideButtons
  }
  
  const getStatus = () => {
    const currentSchemaIndex = getCorrectPhaseIndex()
    const currentSchema = schema?.phases[currentSchemaIndex]
    const requirements = checkRequired()
    const phaseConfirmed = isCurrentPhaseConfirmed(attribute_data)
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
    else if(schema && !requirements && currentSchema?.id === project?.phase && phaseConfirmed){
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
      <div className="document-group" onKeyDownCapture={handleAccordionKeyDown}>
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
