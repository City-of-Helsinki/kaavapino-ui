import React, { useState } from 'react'
import { get } from 'lodash'
import {
  Button,
  IconTrash,
  IconAngleDown,
  IconAngleUp,
  LoadingSpinner,
} from 'hds-react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

import NetworkErrorState from '../NetworkErrorState.jsx'
import FieldsetField from './FieldsetField.jsx'
import FieldsetReorderControl from './FieldsetReorderControl.jsx'
import InputLockedMessage from '../InputLockedMessage.jsx'
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
  reordering,
  reorder,
  lastSavedChildField,
  isThisFieldsetNetworkError,
  isThisFieldsetConnectionRestored,
  nulledFields,
  syncronousErrors,
  // Forwarded to FieldsetField
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
  onAccordionClick,
  onCloseAccordionClick,
  onHide,
}) => {
  const { t } = useTranslation()
  // Browsers restart CSS animations when React moves a node, so only animate on mount
  const [entering, setEntering] = useState(true)

  const setValues = get(formValues, set)
  const fieldsetDisabled = !!(lockStatus?.lockStyle && !lockStatus?.owner && lockStatus?.fieldIdentifier === set)
  const deleted = get(formValues, set + '._deleted')
  const automatically_added = get(formValues, set + '._automatically_added')

  if (deleted || hiddenIndex === i) {
    return null
  }

  const lockedMessage = fieldsetDisabled ? <InputLockedMessage t={t} lockStatus={lockStatus} isFieldsetRow={true} /> : <></>;
  const rowTitle = getValueName(setValues, fields, t)
  const titleElement = rowTitle ==  t('project.fieldset-missing-value') ? <span className='italic'>{rowTitle}</span> : rowTitle
  const contentElement = <><div className='accordion-header-text'>{titleElement}</div> {lockedMessage}</>

  const shouldDisableAccordion = saving || hiding || adding || reordering
  const thisRowHasError = formErrors?.some(ef => ef.startsWith(`${set}.`))
  const thisRowHasNetworkError = isThisFieldsetNetworkError && !expanded.includes(i) && !!lastSavedChildField?.startsWith(set)

  const containerClassName = [
    'fieldset-container',
    entering ? 'fieldset-container-enter' : '',
    reorder?.isDragged ? 'fieldset-container-dragging' : '',
    reorder?.dropPosition ? `fieldset-container-drop-${reorder.dropPosition}` : '',
  ].filter(Boolean).join(' ')

  const accordionButton = (
    <button type="button" tabIndex={0}
      className={getAccordionButtonClassName(shouldDisableAccordion, expanded.includes(i), thisRowHasError || thisRowHasNetworkError)}
      onClick={() => { if (!shouldDisableAccordion) { onAccordionClick(set, i) }}}
    >
      <div className='accordion-button-content'>
        {contentElement}
      </div>
      {expanded.includes(i) ? <IconAngleUp size='s'/> : <IconAngleDown size='s'/>}
    </button>
  )

  return (
    <div className={containerClassName} {...reorder?.containerProps}
      onAnimationEnd={(e) => { if (e.target === e.currentTarget) setEntering(false) }}>
      {reorder ? (
        <div className='fieldset-row-header'>
          <FieldsetReorderControl
            rowTitle={rowTitle}
            {...reorder}
          />
          {accordionButton}
        </div>
      ) : accordionButton}
      <div className={expanded.includes(i) ? 'fieldset-accordion-open' : 'fieldset-accordion'}>
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
            disabled={disabled || hiding || saving || adding || reordering }
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
            onCheckLocked={() => {}} // Locking handled on a fieldset row level
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
            disabled={sets.length < 1 || disabled || fieldsetDisabled || saving || reordering || lastSaved?.status === 'error' || (formErrors.length > 0 && !thisRowHasError)}
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
              }}
            />
            {t('project.deleting')}
          </div>
        )}
        <div className='close-accordion-button-container'>
          <Button 
            className='close-accordion-button'
            type="button"
            onClick={() => {onCloseAccordionClick(i)}}
            iconRight={<IconAngleUp size='s'/>}
            variant="supplementary"
          >
            Sulje
          </Button>
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
  reordering: PropTypes.bool,
  reorder: PropTypes.shape({
    isDragged: PropTypes.bool,
    dropPosition: PropTypes.oneOf(['before', 'after']),
    containerProps: PropTypes.object,
  }),
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
  validate: PropTypes.array,
  onChildBlurSave: PropTypes.func.isRequired,
  onCheckLocked: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  onAccordionClick: PropTypes.func.isRequired,
  onCloseAccordionClick: PropTypes.func.isRequired,
}

export default FieldsetRow
