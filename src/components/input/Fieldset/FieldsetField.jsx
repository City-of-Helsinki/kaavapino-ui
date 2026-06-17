import React from 'react'
import { Form, Label } from 'semantic-ui-react'
import { IconLock } from 'hds-react'
import { has } from 'lodash'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

import CustomField from '../CustomField.jsx'
import NetworkErrorState from '../NetworkErrorState.jsx'
import Info from '../Info.jsx'
import inputUtils from '../../../utils/inputUtils.js'
import projectUtils from '../../../utils/projectUtils.js'
import { showField } from '../../../utils/projectVisibilityUtils.js'

const FieldsetField = ({
  field,
  set,
  i,
  j,
  name,
  formName,
  formValues,
  attributeData,
  disabled,
  checking,
  syncronousErrors,
  updated,
  savingField,
  testingConnection,
  highlightedTag,
  highlightedInFieldset,
  phaseIsClosed,
  isTabActive,
  fieldsetDisabled,
  hiding,
  saving,
  adding,
  automatically_added,
  lastSavedChildField,
  formErrors,
  isThisFieldsetNetworkError,
  isThisFieldsetConnectionRestored,
  lockStatus,
  handleSave,
  handleLockField,
  handleUnlockField,
  onRadioChange,
  lockField,
  unlockAllFields,
  validate,
  onChildBlurSave,
  onCheckLocked,
}) => {
  const { t } = useTranslation()

  const currentName = `${set}.${field.name}`
  if (
    !showField(field, formValues, currentName) ||
    !field.fieldset_index
  ) {
    return null
  }

  let required = false

  const isReadOnly = field?.autofill_readonly
  if (checking && !(!attributeData[name]?.[i])) {
    if (
      projectUtils.isFieldMissing(
        field.name,
        field.required,
        attributeData[name][i]
      )
    ) {
      required = true
    }
  } else if (checking && field.required) {
    required = true
  }

  let title = field.character_limit
    ? t('project.fieldset-title', { label: field.label, max: field.character_limit })
    : field.label
  title += field?.required ? '*' : ''
  const error = syncronousErrors?.[field.name]

  /* Two ways to bring errors to FormField component:
   * 1) the missing attribute data of required fields is checked automatically.
   * 2) error text can be given directly to the component as props.
   * Redux form gives error information to the Field component, but that's further down the line, and we need that information
   * here to modify the input header accordingly. */
  const showError = required ? t('project.required-field') : error
  const fieldUpdated = updated?.new_value && has(updated?.new_value[0], field.name)
  let fieldSpecificUpdated
  if (fieldUpdated) {
    fieldSpecificUpdated = updated
  } else {
    fieldSpecificUpdated = updated?.timestamp ? updated : undefined
  }
  const fieldRollingInfo = field?.categorization.includes("katsottava tieto") || field?.categorization.includes("päivitettävä tieto")
  let rollingInfoText = "Tieto siirtyy vaiheiden välillä ja sitä voi täydentää"
  let nonEditable = false

  if(isReadOnly || field?.display === 'readonly_checkbox'){
    rollingInfoText = "Tieto on automaattisesti muodostettu"
    nonEditable = true
  }

  const assistiveText = field.assistive_text
  const isNetworkErrorField = isThisFieldsetNetworkError &&
    (lastSavedChildField === currentName || (!lastSavedChildField && formErrors.includes(currentName)))

  return (
    <div
      className={`input-container ${showError || isNetworkErrorField ? 'error' : ''} ${fieldsetDisabled ? 'disabled-fieldset' : ''}`}
      key={name + field.name + j}
    >
      <Form.Field required={required} className={field?.field_subroles === highlightedTag && highlightedInFieldset === "yellow" ? "yellow-fieldset" : ""}>
        {field?.field_subroles === highlightedTag && highlightedInFieldset === "yellow" ? <div className={"yellow-fieldset" + " highlight-flag"}>{highlightedTag}</div> : ''}
        <div className="input-header">
          <Label
            className={`input-title${required ? ' highlight' : ''} ${showError ? 'error' : ''
              }`}
          >
            {title}
            {lockStatus?.lockStyle && !lockStatus?.owner && (
                  lockStatus?.fieldIdentifier && lockStatus.fieldIdentifier === set + "." + field.name &&(
                  <span className="input-locked"> Käyttäjä {lockStatus.lockStyle.lockData.attribute_lock.user_name} {lockStatus.lockStyle.lockData.attribute_lock.user_email} on muokkaamassa kenttää <IconLock></IconLock></span>
                  )
                )
            }
          </Label>
          <div className="input-header-icons">
            {!isReadOnly && (
              <>
                {inputUtils.renderUpdatedFieldInfo({ savingField, fieldName: currentName, updated: fieldSpecificUpdated, t, isFieldset: false, testingConnection })}
                {inputUtils.renderTimeContainer({ updated: fieldSpecificUpdated, t })}
              </>
            )}
            {field.help_text && (
              <Info content={field.help_text} link={field.help_link} linked={field.linked_fields} help_img_link={field.help_img_link}/>
            )}
          </div>
        </div>
        <CustomField
          field={{ ...field, name: currentName, disabled: disabled || hiding || saving || adding, automatically_added }}
          attributeData={attributeData}
          fieldset={field.type === 'fieldset'}
          parentName={name}
          formName={formName}
          formValues={formValues}
          handleSave={handleSave}
          handleLockField={handleLockField}
          handleUnlockField={handleUnlockField}
          onRadioChange={onRadioChange}
          handleBlurSave={() => onChildBlurSave(currentName)}
          checkLocked={onCheckLocked}
          lockField={lockField}
          unlockAllFields={unlockAllFields}
          validate={validate}
          fieldSetDisabled={fieldsetDisabled}
          insideFieldset={true}
          rollingInfo={fieldRollingInfo}
          modifyText={t('project.modify')}
          rollingInfoText={rollingInfoText}
          nonEditable={nonEditable}
          phaseIsClosed={phaseIsClosed}
          isTabActive={isTabActive}
          highlightedInFieldset={highlightedInFieldset}
          highlightedTag={highlightedTag}
        />
        {showError && <div className="error-text">{showError}</div>}
        {(isThisFieldsetNetworkError || isThisFieldsetConnectionRestored) &&
          (lastSavedChildField === currentName || (!lastSavedChildField && formErrors.includes(currentName))) && (
          <NetworkErrorState fieldName={name} />
        )}
        {assistiveText && <div className='assistive-text'>{assistiveText}.</div>}
      </Form.Field>
    </div>
  )
}

FieldsetField.propTypes = {
  field: PropTypes.object.isRequired,
  set: PropTypes.string.isRequired,
  i: PropTypes.number.isRequired,
  j: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  formName: PropTypes.string.isRequired,
  formValues: PropTypes.object.isRequired,
  attributeData: PropTypes.object,
  disabled: PropTypes.bool,
  checking: PropTypes.bool,
  syncronousErrors: PropTypes.object,
  updated: PropTypes.object,
  savingField: PropTypes.string,
  testingConnection: PropTypes.object,
  highlightedTag: PropTypes.string,
  highlightedInFieldset: PropTypes.string,
  phaseIsClosed: PropTypes.bool,
  isTabActive: PropTypes.bool,
  fieldsetDisabled: PropTypes.bool,
  hiding: PropTypes.bool,
  saving: PropTypes.bool,
  adding: PropTypes.bool,
  automatically_added: PropTypes.bool,
  lastSavedChildField: PropTypes.string,
  formErrors: PropTypes.array,
  isThisFieldsetNetworkError: PropTypes.bool,
  isThisFieldsetConnectionRestored: PropTypes.bool,
  lockStatus: PropTypes.object,
  handleSave: PropTypes.func.isRequired,
  handleLockField: PropTypes.func.isRequired,
  handleUnlockField: PropTypes.func.isRequired,
  onRadioChange: PropTypes.func.isRequired,
  lockField: PropTypes.func,
  unlockAllFields: PropTypes.func,
  validate: PropTypes.func.isRequired,
  onChildBlurSave: PropTypes.func.isRequired,
  onCheckLocked: PropTypes.func.isRequired,
}

export default FieldsetField
