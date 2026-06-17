import React from 'react'
import { get } from 'lodash'
import {
  Button,
  IconLock,
  IconTrash,
  IconAngleDown,
  IconAngleUp,
  LoadingSpinner,
} from 'hds-react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

import NetworkErrorState from '../NetworkErrorState.jsx'
import FieldsetField from './FieldsetField.jsx'
import { getValueName, getAccordionButtonClassName } from './helpers.js'

const FieldsetRow = ({
  set,
  i,
  sets,
  name,
  fields,
  formName,
  formValues,
  formErrors,
  attributeData,
  lastSaved,
  lockStatus,
  disabled,
  disable_fieldset_delete_add,
  hiddenIndex,
  expanded,
  hiding,
  saving,
  adding,
  lastSavedChildField,
  isThisFieldsetNetworkError,
  isThisFieldsetConnectionRestored,
  nulledFields,
  // Forwarded to FieldsetField
  syncronousErrors,
  highlightedTag,
  highlightedInFieldset,
  phaseIsClosed,
  isTabActive,
  handleSave,
  handleLockField,
  handleUnlockField,
  onRadioChange,
  lockField,
  unlockAllFields,
  validate,
  onChildBlurSave,
  // Row-level handlers
  onCheckLocked,
  onHide,
}) => {
  const { t } = useTranslation()

  const setValues = get(formValues, set)
  const fieldsetDisabled = !!(lockStatus?.lockStyle && !lockStatus?.owner && lockStatus?.fieldIdentifier === set)
  const deleted = get(formValues, set + '._deleted')
  const automatically_added = get(formValues, set + '._automatically_added')

  if (deleted || hiddenIndex === i) {
    return null
  }

  const lockedElement = fieldsetDisabled ? <span className="input-locked"> Käyttäjä {lockStatus.lockStyle.lockData.attribute_lock.user_name} {lockStatus.lockStyle.lockData.attribute_lock.user_email} on muokkaamassa kenttää<IconLock></IconLock></span> : <></>
  const lockName = <><span className='accoardian-header-text'>{getValueName(setValues, fields, t)}</span> {lockedElement}</>

  const shouldDisableAccordion = saving || hiding || adding
  const thisRowHasError = formErrors?.some(ef => ef.startsWith(`${set}.`))
  const thisRowHasNetworkError = isThisFieldsetNetworkError && !expanded.includes(i) && !!lastSavedChildField?.startsWith(set)

  return (
    <div className="fieldset-container">
      <button type="button" tabIndex={0}
        className={getAccordionButtonClassName(shouldDisableAccordion, expanded.includes(i), thisRowHasError || thisRowHasNetworkError)}
        onClick={(e) => { if (!shouldDisableAccordion) { onCheckLocked(e, set, i) } }}
      >
        <div className='accordion-button-content'>
          {lockName}
        </div>
        {expanded.includes(i) ? <IconAngleUp size='s'/> : <IconAngleDown size='s'/>}
      </button>
      <div className={expanded.includes(i) ? 'fieldset-accordian-open' : 'fieldset-accordian'}>
        {fields.map((field, j) => (
          <FieldsetField
            key={name + field.name + j}
            field={field}
            set={set}
            attribute={attributeData[name]?.[i]}
            name={name}
            formName={formName}
            formValues={formValues}
            attributeData={attributeData}
            disabled={disabled || hiding || saving || adding }
            syncError={syncronousErrors?.[field.name]}
            highlightedTag={highlightedTag}
            highlightedInFieldset={highlightedInFieldset}
            phaseIsClosed={phaseIsClosed}
            isTabActive={isTabActive}
            fieldsetDisabled={fieldsetDisabled}
            automatically_added={automatically_added}
            lastSavedChildField={lastSavedChildField}
            isThisFieldsetNetworkError={isThisFieldsetNetworkError}
            isThisFieldsetConnectionRestored={isThisFieldsetConnectionRestored}
            lockStatus={lockStatus}
            handleSave={handleSave}
            handleLockField={handleLockField}
            handleUnlockField={handleUnlockField}
            onRadioChange={onRadioChange}
            lockField={lockField}
            unlockAllFields={unlockAllFields}
            validate={validate}
            onChildBlurSave={onChildBlurSave}
            onCheckLocked={(e) => onCheckLocked(e, set, i)}
          />
        ))}
        {/* Show NetworkErrorState for connection errors in fieldset — fallback if no specific field tracked */}
        {(isThisFieldsetNetworkError || isThisFieldsetConnectionRestored) && expanded.includes(i) && !lastSavedChildField &&
          !formErrors.some(ef => typeof ef === 'string' && ef.startsWith(`${set}.`)) && (
          <NetworkErrorState fieldName={name} />
        )}
        {(!disable_fieldset_delete_add && !automatically_added && !disabled) && (
          <Button
            className={`${fieldsetDisabled || saving || shouldDisableAccordion || (formErrors.length > 0 && !thisRowHasError) ? 'fieldset-button-remove-disabled' : 'fieldset-button-remove'} ${hiding ? ' hidden' : ''}`}
            disabled={sets.length < 1 || disabled || fieldsetDisabled || saving || lastSaved?.status === 'error' || (formErrors.length > 0 && !thisRowHasError)}
            variant="secondary"
            size='small'
            iconLeft={<IconTrash/>}
            onClick={() => {
              onHide(formName, set, ...nulledFields, i)
            }}
          > {t('project.remove')}</Button>
        )}
        {hiding && (
          <div className="fieldset-spinner-remove">
            <LoadingSpinner
              className="loading-spinner"
              theme={{
                '--spinner-color': '#0000BF',
                '--spinner-thickness': '2px'
              }}
            />
            {t('project.deleting')}
          </div>
        )}
        <div className='close-accordion-button'>
          <button className={expanded.includes(i) ? "accordion-button-open" : "accordion-button"} onClick={(e) => { onCheckLocked(e, set, i) }}>
            <span>Sulje</span><IconAngleUp onClick={(e) => { onCheckLocked(e, set, i) }} size='s'/>
          </button>
        </div>
      </div>
    </div>
  )
}

FieldsetRow.propTypes = {
  set: PropTypes.string.isRequired,
  i: PropTypes.number.isRequired,
  sets: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  name: PropTypes.string.isRequired,
  fields: PropTypes.array.isRequired,
  formName: PropTypes.string.isRequired,
  formValues: PropTypes.object.isRequired,
  formErrors: PropTypes.array,
  attributeData: PropTypes.object,
  lastSaved: PropTypes.object,
  lockStatus: PropTypes.object,
  disabled: PropTypes.bool,
  disable_fieldset_delete_add: PropTypes.bool,
  hiddenIndex: PropTypes.number,
  expanded: PropTypes.array.isRequired,
  hiding: PropTypes.bool,
  saving: PropTypes.bool,
  adding: PropTypes.bool,
  lastSavedChildField: PropTypes.string,
  isThisFieldsetNetworkError: PropTypes.bool,
  isThisFieldsetConnectionRestored: PropTypes.bool,
  nulledFields: PropTypes.array,
  syncronousErrors: PropTypes.object,
  highlightedTag: PropTypes.string,
  highlightedInFieldset: PropTypes.string,
  phaseIsClosed: PropTypes.bool,
  isTabActive: PropTypes.bool,
  handleSave: PropTypes.func.isRequired,
  handleLockField: PropTypes.func.isRequired,
  handleUnlockField: PropTypes.func.isRequired,
  onRadioChange: PropTypes.func.isRequired,
  lockField: PropTypes.func,
  unlockAllFields: PropTypes.func,
  validate: PropTypes.func.isRequired,
  onChildBlurSave: PropTypes.func.isRequired,
  onCheckLocked: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
}

export default FieldsetRow
