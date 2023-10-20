import React from 'react'
import Document from './Document'
import { Accordion,IconAlertCircle,IconCheck } from 'hds-react'
import projectUtils from '../../utils/projectUtils'
import { useTranslation } from 'react-i18next'

const DocumentGroup = ({ title, documents, projectId, phaseEnded, phase, isUserResponsible, schema, attribute_data, selectedPhase, search }) => {
  const {t} = useTranslation()

  const checkRequired = (index) => {
    let hasErrors
    const currentSchema = schema?.phases[index]
    const errorFields = projectUtils.getErrorFields(attribute_data, currentSchema)
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
    const currentSchemaIndex = schema?.subtype_name === "XL" ? phase.phaseIndex - 2 : phase.phaseIndex - 1
    return currentSchemaIndex
  }

  const hideButtons = () => {
    const index = getCorrectPhaseIndex()
    const hideButtons = checkRequired(index)
    return hideButtons
  }
  
  const getStatus = () => {
    const currentSchemaIndex = getCorrectPhaseIndex()
    const currentSchema = schema?.phases[currentSchemaIndex]
    const requirements = checkRequired(currentSchemaIndex)
    const scheduleAccepted = isSceduleAccepted(currentSchemaIndex)
    let status
    if(phaseEnded){
      status = 
      <div className='document-group-requirements'>
        <div className="phase-end-tag required-error-text">
          <p><IconAlertCircle size="s" />{t('project.phase-passed')}</p>
        </div>
        <div className='italic-text'><p>{t('project.phase-preview-ended')}</p></div>
      </div>
    }
    else if(schema && !requirements && scheduleAccepted && currentSchema?.status === "Vaihe käynnissä"){
      status = 
      <div className='document-group-requirements'>
        <div className='required-success-text'><p><IconCheck size="s" />{t('project.phase-ok')}</p></div>
        <div className='italic-text'><p>{t('project.phase-load-ok')}</p></div>
      </div>
    }
    else{
      status = 
      <div className='document-group-requirements'>
        <div className='required-error-text'><p><IconAlertCircle size="s" />{t('project.phase-load-prevented')}</p></div>
        <div className='italic-text'><p>{t('project.phase-preview-only')}</p></div>
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
        <Accordion heading={title} headingLevel={2} className="document-accordion">
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
              scheduleAccepted={schema ? isSceduleAccepted(getCorrectPhaseIndex()) : false}
            />
          ))}
        </Accordion>
      </div>
    )
  }
}

export default DocumentGroup
