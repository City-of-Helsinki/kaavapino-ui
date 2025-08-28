import React from 'react'
import { connect } from 'react-redux'
import {
  updatesSelector,
  attributeDataSelector,
  checkingSelector
} from '../../selectors/projectSelector'
import { Segment } from 'semantic-ui-react'
import FormField from '../input/FormField.jsx'
import { getFormValues } from 'redux-form'
import { EDIT_PROJECT_FORM } from '../../constants'
import { Notification } from 'hds-react'
import PropTypes from 'prop-types'
import { useTranslation } from "react-i18next";
import { useIsTabActive } from '../../hooks/IsTabActive'

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
  deadlines,
  isCurrentPhase,
  selectedPhase,
  phaseIsClosed
}) => {
  const { t } = useTranslation()

  const isTabActive = useIsTabActive()

  let count = 0;
  if(section?.title && section?.fields){
  return (
    <Segment id="field-segment">
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
            isCurrentPhase={isCurrentPhase}
            selectedPhase={selectedPhase}
            phaseIsClosed={phaseIsClosed}
            isTabActive={isTabActive}
          />)
        }
        else{
          return <React.Fragment key={`empty-${field.name}`}></React.Fragment>
        }
    })}
    {count === 0 ? <Notification label={t('project.no-fields')}></Notification> : ""}
    </Segment>
  )
  }
}

FormSection.propTypes = {
  deadlines:PropTypes.array,
  isCurrentPhase:PropTypes.bool,
  selectedPhase: PropTypes.number,
  phaseIsClosed: PropTypes.bool
}

const mapStateToProps = state => ({
  updates: updatesSelector(state),
  attributeData: attributeDataSelector(state),
  checking: checkingSelector(state),
  formValues: getFormValues(EDIT_PROJECT_FORM)(state)
})

export default connect(mapStateToProps)(FormSection)
