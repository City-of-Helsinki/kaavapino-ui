import React, { useEffect, useId, useRef, useState } from 'react'
import { get } from 'lodash'
import {
  Button,
  IconTrash,
  IconAngleDown,
  IconAngleUp,
  IconDrag,
  IconPlus,
  LoadingSpinner,
} from 'hds-react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

import NetworkErrorState from '../NetworkErrorState.jsx'
import FieldsetField from './FieldsetField.jsx'
import InputLockedMessage from '../InputLockedMessage.jsx'
import { getValueName, getAccordionButtonClassName } from './helpers.js'

const FieldsetReorderControl = ({ reorder }) => {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const reorderRef = useRef(null)
  const handleRef = useRef(null)
  const dragged = useRef(false)
  const menuId = useId()
  const showMenu = menuOpen && reorder?.enabled && !reorder?.isDragged

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false)
    if (restoreFocus) handleRef.current?.focus()
  }

  useEffect(() => {
    if (!reorder?.enabled || reorder?.isDragged) setMenuOpen(false)
  }, [reorder?.enabled, reorder?.isDragged])

  useEffect(() => {
    if (!showMenu) return
    reorderRef.current?.querySelector('[role="menuitem"]:not(:disabled)')?.focus()
    const handleOutside = (event) => {
      if (!reorderRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [showMenu])

  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeMenu(true)
    } else if (event.key === 'Tab') {
      closeMenu(true)
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const items = Array.from(reorderRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)'))
      const current = items.indexOf(document.activeElement)
      const direction = event.key === 'ArrowDown' ? 1 : -1
      let next = (current + direction + items.length) % items.length
      if (event.key === 'Home') next = 0
      if (event.key === 'End') next = items.length - 1
      items[next]?.focus()
    }
  }

  return (
    <div className='fieldset-reorder-control' ref={reorderRef}>
      <button
        {...reorder.handleProps}
        ref={handleRef}
        type="button"
        className='fieldset-drag-handle'
        aria-disabled={!reorder.enabled}
        aria-haspopup="menu"
        aria-expanded={!!showMenu}
        aria-controls={showMenu ? menuId : undefined}
        aria-label={t('project.fieldset-reorder-handle', { position: reorder.position + 1, total: reorder.total })}
        title={t('project.fieldset-reorder-handle-title')}
        onMouseDown={() => { dragged.current = false }}
        onDragStart={(event) => {
          dragged.current = true
          closeMenu()
          reorder.handleProps?.onDragStart?.(event)
        }}
        onClick={() => {
          if (reorder.enabled && !dragged.current) setMenuOpen(open => !open)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') dragged.current = false
          reorder.handleProps?.onKeyDown?.(event)
        }}
      >
        <IconDrag size='s' aria-hidden="true" />
      </button>
      {showMenu && (
        <div className='fieldset-reorder-menu' id={menuId} role="menu" tabIndex={-1}
          aria-label={t('project.fieldset-reorder-handle-title')} onKeyDown={handleMenuKeyDown}>
          {[
            ['top', 0, reorder.position === 0],
            ['up', reorder.position - 1, reorder.position === 0],
            ['down', reorder.position + 1, reorder.position === reorder.total - 1],
            ['bottom', reorder.total - 1, reorder.position === reorder.total - 1],
          ].map(([action, position, unavailable]) => (
            <button key={action} type="button" role="menuitem" tabIndex={-1} disabled={unavailable}
              onClick={() => {
                closeMenu(true)
                reorder.onMove(position)
              }}>
              <IconPlus size='s' aria-hidden="true" />
              {t(`project.fieldset-reorder-${action}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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

  const lockedElement = fieldsetDisabled ? <InputLockedMessage t={t} lockStatus={lockStatus} /> : <></>;
  const lockName = <><span className='accoardian-header-text'>{getValueName(setValues, fields, t)}</span> {lockedElement}</>

  const shouldDisableAccordion = saving || hiding || adding || reordering
  const thisRowHasError = formErrors?.some(ef => ef.startsWith(`${set}.`))
  const thisRowHasNetworkError = isThisFieldsetNetworkError && !expanded.includes(i) && !!lastSavedChildField?.startsWith(set)

  const containerClassName = [
    'fieldset-container',
    reorder?.isDragged ? 'fieldset-container-dragging' : '',
    reorder?.dropPosition ? `fieldset-container-drop-${reorder.dropPosition}` : '',
  ].filter(Boolean).join(' ')

  const accordionButton = (
    <button type="button" tabIndex={0}
      className={getAccordionButtonClassName(shouldDisableAccordion, expanded.includes(i), thisRowHasError || thisRowHasNetworkError)}
      onClick={(e) => { if (!shouldDisableAccordion) { onCheckLocked(e, set, i) } }}
    >
      <div className='accordion-button-content'>
        {lockName}
      </div>
      {expanded.includes(i) ? <IconAngleUp size='s'/> : <IconAngleDown size='s'/>}
    </button>
  )

  return (
    <div className={containerClassName} {...reorder?.containerProps}>
      {reorder ? (
        <div className='fieldset-row-header'>
          <FieldsetReorderControl reorder={reorder} />
          {accordionButton}
        </div>
      ) : accordionButton}
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
                '--spinner-thickness': '2px'
              }}
            />
            {t('project.deleting')}
          </div>
        )}
        <div className='close-accordion-button'>
          <button type="button" className={expanded.includes(i) ? "accordion-button-open" : "accordion-button"} onClick={(e) => { onCheckLocked(e, set, i) }}>
            <span>Sulje</span><IconAngleUp size='s'/>
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
  reordering: PropTypes.bool,
  reorder: PropTypes.shape({
    enabled: PropTypes.bool,
    position: PropTypes.number,
    total: PropTypes.number,
    isDragged: PropTypes.bool,
    dropPosition: PropTypes.oneOf(['before', 'after']),
    handleProps: PropTypes.object,
    containerProps: PropTypes.object,
    onMove: PropTypes.func.isRequired,
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
}

FieldsetReorderControl.propTypes = {
  reorder: FieldsetRow.propTypes.reorder,
}

export default FieldsetRow
