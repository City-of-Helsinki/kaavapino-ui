import React from 'react'
import { Modal } from 'semantic-ui-react'
import { Button,Tabs,IconCross } from 'hds-react'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import FormField from '../input/FormField'
import { isArray } from 'lodash'
import { showField } from '../../utils/projectVisibilityUtils'
import PropTypes from 'prop-types'
import './VisTimeline.css'

const TimelineModal = ({ open,group,content,deadlinegroup,deadlines,openDialog,visValues,deadlineSections,formSubmitErrors,projectPhaseIndex,archived,allowedToEdit }) => {
    
  const getAttributeValues = (attributes) => {
    return Object.values(attributes).flatMap((v) => Object.values(v));
  };
  
  const findLabel = (fieldName, attributeValues) => {
    const field = attributeValues.find((value) => value.name === fieldName);
    return field ? field.label : null;
  };
  
  const getErrorLabel = (fieldName) => {
    const attributeValues = deadlineSections.flatMap((deadline_section) =>
      deadline_section.sections.flatMap((section) => getAttributeValues(section.attributes))
    );
  
    const label = findLabel(fieldName, attributeValues);
    return <span>{label}: </span>;
  };

    const renderSubmitErrors = () => {
      const keys = formSubmitErrors ? Object.keys(formSubmitErrors) : []
      return keys.map(key => {
        const errors = formSubmitErrors[key]
        if (Array.isArray(errors)) {
          return (
            <div key={key} className="submit-error">
              {getErrorLabel(key)}
              {errors?.map(error => (
                <span key={error}>{error} </span>
              ))}
            </div>
          )
        }
      })
    }

    let currentSubmitErrors = Object.keys(formSubmitErrors).length > 0

    const getFormField = (fieldProps, key, disabled) => {
      if (!showField(fieldProps.field, visValues)) {
        return null
      }

      const error = formSubmitErrors?.[fieldProps?.field?.name];
      let className = '';
  
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
      //Visvalues state saves only after timelineform submit
      return (
        <>
          <FormField
            {...fieldProps}
            key={key}
            formName={EDIT_PROJECT_TIMETABLE_FORM}
            deadlines={deadlines}
            error={modifiedError}
            formValues={visValues}
            className={className}
            isProjectTimetableEdit={true}
            disabled={disabled?.disabled || !allowedToEdit}
            attributeData={visValues}
          />
          {modifiedError && <div className="field-error">{modifiedError}</div>}
        </>
      )
    }
    const getFormFields = (sections, sectionIndex, disabled) => {
      const formFields = []
      sections.forEach((field, fieldIndex) => {
          formFields.push(getFormField({ field }, `${sectionIndex} - ${fieldIndex}`, {disabled}))
      })
      return formFields
    }
  
    const renderSection = (section,sectionIndex) => {
      const sections = section.sections
      const disabled = archived ? true : sectionIndex < projectPhaseIndex
      const renderedSections = []
      sections.forEach(subsection => {
        const attr = subsection?.attributes
        if(attr[deadlinegroup]){
          renderedSections.push(
            <Tabs key={"tab" + sectionIndex}>
              <Tabs.TabList style={{ marginBottom: 'var(--spacing-m)' }}>
                {Object.keys(attr[deadlinegroup]).map((key) => {
                  return <Tabs.Tab key={key}>{key === "default" ? content : key}</Tabs.Tab>
                })}
              </Tabs.TabList>
              {Object.values(attr[deadlinegroup]).map((subsection, index) => {
                return  <Tabs.TabPanel key={`tabPanel-${index}-${subsection}`}>{getFormFields(subsection, sectionIndex, disabled)}</Tabs.TabPanel>
              })}
            </Tabs>
          )
        }
      })
      return renderedSections
    }

    const title = deadlineSections.find(section => section?.id === group)?.title
    return (
      <Modal open={open} size={'large'} className='timeline-edit-right'>
        <Modal.Header>
          <ul className="breadcrumb">
            <li><a href="#" role="button">{title}</a></li>
            <li><a href="#" role="button">{content}</a></li>
            <Button size='small' variant="supplementary" onClick={openDialog}><IconCross /></Button>
          </ul>
        </Modal.Header>
        <Modal.Content>
          <div className='date-content'>
            {deadlineSections.map((section, i) => {
              if (section.id === group) {
                return renderSection(section, i)
              }
            })}
            {currentSubmitErrors && (
              <div className="error-area">{renderSubmitErrors()}</div>
            )}
          </div>
        </Modal.Content>
      </Modal>
    )
  }

  TimelineModal.propTypes = {
    open: PropTypes.bool,
    group: PropTypes.object,
    content: PropTypes.string,
    deadlinegroup: PropTypes.object,
    deadlines: PropTypes.array,
    openDialog: PropTypes.func,
    visValues: PropTypes.object,
    deadlineSections: PropTypes.array,
    formSubmitErrors: PropTypes.object,
    projectPhaseIndex: PropTypes.number,
    archived: PropTypes.bool,
    allowedToEdit: PropTypes.bool
  };
  
  export default TimelineModal