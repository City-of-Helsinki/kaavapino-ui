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
import PropTypes from 'prop-types'

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
  deadlines
}) => {
  let count = 0;
  if(section?.title && section?.fields){
  return (
    <Segment id="field-segment">
      <h2 tabIndex="0" id={`title-${section.title}`} className="section-title">
        {section.title}
      </h2>
      <div className='section-ingress'>
        {section?.ingress}
      </div>
      {section.fields.map((field, i) => {
        let rollingInfo
        if(field?.categorization.includes("katsottava tieto") || field?.categorization.includes("päivitettävä tieto")){
          rollingInfo = true
        }
        else{
          rollingInfo = false
        }
        let highlightStyle = highlightedTag === field.field_subroles ? 'yellow' : ''
        if(filterFieldsArray.length === 0 || filterFieldsArray.includes(field.field_subroles)){
          count++
          return (<FormField
            key={`${field.name}-${i}-${field.label}`}
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
            deadlines={deadlines}
            rollingInfo={rollingInfo}
          />)
        }
        else{
          return <></>
        }
    })}
    {count === 0 ? <Notification label="Suodatinvalinalla ei löytynyt tämän otsikon alta suodatettavia kenttiä."></Notification> : ""}
    </Segment>
  )
  }
}

FormSection.propTypes = {
  deadlines:PropTypes.object
}

const mapStateToProps = state => ({
  updates: updatesSelector(state),
  attributeData: attributeDataSelector(state),
  checking: checkingSelector(state),
  formValues: getFormValues(EDIT_PROJECT_FORM)(state)
})

export default connect(mapStateToProps)(FormSection)
