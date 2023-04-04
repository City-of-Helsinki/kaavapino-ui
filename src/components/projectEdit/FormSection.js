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

const FormSection = ({
  section: { title, fields },
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
  setRef
}) => {
  
  return (
    <Segment>
      <h2 id={`title-${title}`} className="section-title">
        {title}
      </h2>
      {fields.map((field, i) => (
        <FormField
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
        />
      ))}
    </Segment>
  )
}

const mapStateToProps = state => ({
  updates: updatesSelector(state),
  attributeData: attributeDataSelector(state),
  checking: checkingSelector(state),
  formValues: getFormValues(EDIT_PROJECT_FORM)(state)
})

export default connect(mapStateToProps)(FormSection)
