import React from 'react'
import { connect } from 'react-redux'
import {
  updatesSelector,
  attributeDataSelector,
  checkingSelector
} from '../../selectors/projectSelector'
import { Segment } from 'semantic-ui-react'
import FormField from '../input/FormField'
import { getFormValues } from 'redux-form'
import { EDIT_PROJECT_FORM } from '../../constants'
import { Notification } from 'hds-react'

const FormSection = ({
  section,
  checking,
  disabled,
  attributeData,
  updates,
  handleSave,
  handleLockField,
  handleUnlockField,
  formName,
  formValues,
  syncronousErrors,
  submitErrors,
  setRef,
  unlockAllFields,
  filterFieldsArray,
  highlightedTag,
  fieldCount
}) => {
  if(section && section.title && section.fields){
  return (
    <Segment id="field-segment">
      <h2 id={`title-${section.title}`} className="section-title">
        {section.title}
      </h2>
      {section.fields.map((field, i) => {
        let highlightStyle = highlightedTag === field.field_subroles ? 'yellow' : ''
        if(filterFieldsArray.length === 0 || filterFieldsArray.includes(field.field_subroles)){
          return (<FormField
            key={`${field.name}-${i}`}
            checking={checking}
            disabled={disabled}
            field={{ ...field, disabled: disabled || field.disabled }}
            attributeData={attributeData}
            updated={updates[field.name] || null}
            handleSave={handleSave}
            onRadioChange={handleSave}
            handleLockField={handleLockField}
            handleUnlockField={handleUnlockField}
            formName={formName}
            formValues={formValues}
            syncronousErrors={syncronousErrors}
            submitErrors={submitErrors}
            className={field.highlight_group ? field.highlight_group : '' }
            setRef={setRef}
            unlockAllFields={unlockAllFields}
            highlightedTag={highlightedTag}
            highlightStyle={highlightStyle}
          />)
        }
        else{
          return <></>
        }
    })}
    {fieldCount === 0 && filterFieldsArray.length > 0 ? <Notification label="New messages">You have received new messages.</Notification> : ""}
    </Segment>
  )
  }
}

const mapStateToProps = state => ({
  updates: updatesSelector(state),
  attributeData: attributeDataSelector(state),
  checking: checkingSelector(state),
  formValues: getFormValues(EDIT_PROJECT_FORM)(state)
})

export default connect(mapStateToProps)(FormSection)
