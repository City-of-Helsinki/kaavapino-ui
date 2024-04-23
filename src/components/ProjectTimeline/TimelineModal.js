import React from 'react'
import { Modal } from 'semantic-ui-react'
import { Button, Accordion } from 'hds-react'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { useTranslation } from 'react-i18next'
import FormField from '../input/FormField'
import { isArray } from 'lodash'
import { showField } from '../../utils/projectVisibilityUtils'
import './VisTimeline.css'

const TimelineModal = ({ open,group,deadlines,openDialog,attributeData,formValues,deadlineSections,formSubmitErrors,projectPhaseIndex,archived,allowedToEdit }) => {
    console.log(attributeData,formValues)
    console.log(deadlineSections,deadlines)
    const { t } = useTranslation()

    const getFormField = (fieldProps, key, disabled) => {
      if (!showField(fieldProps.field, formValues)) {
        return null
      }
      const error =
        formSubmitErrors &&
        fieldProps &&
        formSubmitErrors &&
        formSubmitErrors[fieldProps.field.name]
      let className = ''
  
      if (error !== undefined) {
        className = 'modal-field error-border'
      } else {
        className = 'modal-field'
      }
      // Special case since label is used.
      if (fieldProps.field.display === 'checkbox') {
        className = error ? 'error-border' : ''
      }
  
      let modifiedError = ''
      if (isArray(error)) {
        error.forEach(current => {
          modifiedError = modifiedError + ' ' + current
        })
      } else {
        modifiedError = error
      }

      return (
        <>
          <FormField
            {...fieldProps}
            key={key}
            formName={EDIT_PROJECT_TIMETABLE_FORM}
            deadlines={deadlines}
            error={modifiedError}
            formValues={formValues}
            className={className}
            isProjectTimetableEdit={true}
            disabled={disabled?.disabled || !allowedToEdit}
            attributeData={attributeData}
          />
          {modifiedError && <div className="field-error">{modifiedError}</div>}
        </>
      )
    }
    const getFormFields = (sections, sectionIndex, disabled) => {
      const formFields = []
      sections.forEach(subsection => {
        const attr = subsection?.attributes
        attr && attr.forEach((field, fieldIndex) => {
          formFields.push(getFormField({ field }, `${sectionIndex} - ${fieldIndex}`, {disabled}))
        })
      })
      return formFields
    }
  
    const renderSection = (section,sectionIndex) => {
      const sections = section.sections
      const disabled = archived ? true : sectionIndex < projectPhaseIndex 
      return (
          getFormFields(sections, sectionIndex, disabled)
      )
    }

    const getErrorLabel = (fieldName) => {
      let label
  
      deadlineSections.forEach(deadline_section => {
        const sections = deadline_section.sections
  
        sections.forEach(section => {
          const attributes = section.attributes
  
          attributes.forEach(attribute => {
            if (attribute.name === fieldName) {
              label = attribute.label
            }
          })
        })
      })
      return <span>{label}: </span>
    }

    const renderSubmitErrors = () => {
      const keys = formSubmitErrors ? Object.keys(formSubmitErrors) : []
      return keys.map(key => {
        const errors = formSubmitErrors[key]
  
        return (
          <div key={key} className="submit-error">
            {getErrorLabel(key)}
            {errors.map(error => (
              <span key={error}>{error} </span>
            ))}
          </div>
        )
      })
    }

    let currentSubmitErrors = Object.keys(formSubmitErrors).length > 0

    return (
      <Modal open={open} size={'large'} className='timeline-edit-right'>
        <Modal.Header>{group}</Modal.Header>
        <Modal.Content>
          <div className='date-content'>
            {deadlineSections.map((section, i) => {
              if (section.title === group) {
                return(
                  <Accordion className='timeline-accordion' heading={"Esilläolo"} key={i + section.title + "esillaolo"} initiallyOpen={true}>
                    {renderSection(section, i)}
                  </Accordion>
                )
              }
            })}
            {currentSubmitErrors && (
              <div className="error-area">{renderSubmitErrors()}</div>
            )}
          </div>
        </Modal.Content>
        <Modal.Actions>
          <div className="form-buttons">
            <Button size='default' variant="secondary" onClick={openDialog}>
              {t('common.cancel')}
            </Button>
            <Button size='default' variant="primary">
              {t('common.save')}
            </Button>
          </div>
        </Modal.Actions>
      </Modal>
    )
  }
  
  export default TimelineModal