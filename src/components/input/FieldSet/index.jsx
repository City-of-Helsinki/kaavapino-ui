import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { connect, useDispatch } from 'react-redux'
import { checkingSelector, savingSelector, formErrorListSelector, lastSavedSelector, updateFieldSelector, pollSelector} from '../../../selectors/projectSelector.js'
import projectUtils from '../../../utils/projectUtils.js'
import { get } from 'lodash'
import { Button, IconPlus, LoadingSpinner } from 'hds-react'
import { change } from 'redux-form'
import { useTranslation } from 'react-i18next';
import { OutsideClick } from '../../../hooks/OutsideClick.js'
import {getAttributeData, formErrorList, setLastSaved} from '../../../actions/projectActions.js'
import { useIsMount } from '../../../hooks/IsMounted.js'
import { useFieldPassivation } from '../../../hooks/useFieldPassivation.js'
import {
  buildAddButtonMessage,
  getFieldsetInfoData,
  getFieldsetDisplayOrder,
  applyRequestedOrder,
  moveFieldsetRow,
  getFieldsetOrderChanges,
} from './helpers.js'
import FieldsetRow from './FieldsetRow.jsx'
import PropTypes from 'prop-types'
import '../Input.scss'


const FieldSet = ({
  sets,
  fields,
  checking,
  attributeData,
  name,
  disabled,
  formName,
  formValues,
  validate,
  syncronousErrors,
  handleSave,
  onRadioChange,
  updated,
  onBlur,
  handleLockField,
  handleUnlockField,
  field: { disable_fieldset_delete_add },
  lockField,
  lockStatus,
  unlockAllFields,
  saving,
  formErrors,
  lastSaved,
  updateField,
  phaseIsClosed,
  fieldsetTotal,
  isTabActive,
  highlightedInFieldset,
  highlightedTag,
  savingField,
  testingConnection,
  connection
}) => {
  const handleBlur = () => {
    onBlur()
  }

  const dispatch = useDispatch()
  const { t } = useTranslation()
  const isMount = useIsMount()
  const accordionRef = useRef(null)
  const autoOpenScrollPending = useRef(false)
  
  // Check if other fields have errors - passivate fieldset expand/delete buttons
  const shouldDisableForErrors = useFieldPassivation(name, { formName })

  const savedFields = Array.isArray(lastSaved?.fields) ? lastSaved.fields : []
  const isThisFieldsetNetworkError = lastSaved?.status === 'error' && savedFields.some(f =>
    typeof f === 'string' && (f === name || f.startsWith(`${name}[`))
  )

  const nulledFields = fields?.map(field => {
    return { [field.name]: null, _deleted: true }
  })

  const [hiddenIndex, setHiddenIndex] = useState(-1)
  const [expanded, setExpanded] = useState([])
  const [adding,setAdding] = useState(false)
  const [lastSavedChildField, setLastSavedChildField] = useState(null)

  const [hiding,setHiding] = useState(false)
  const [currentFieldset,setCurrentFieldset] = useState(false)
  const [pendingAutoOpen, setPendingAutoOpen] = useState(false)

  // Requested row order (array indices) shown optimistically until it has been applied to the form
  const [pendingOrder, setPendingOrder] = useState(null)
  const reordering = pendingOrder !== null
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const rowTops = useRef(new Map())
  const previousOrderKey = useRef(null)

  const refreshFieldset = () => {
    if (connection?.connection === false) {
      dispatch(setLastSaved('error', null, [name], [], false))
      return
    }
    //Fetch fieldset data from backend and see if there is new sub fieldset or data changes before adding new sub fieldset
    //After completed fetch useEffect adds new sub fieldset to updated last fieldset index and saves
    setAdding(true)
    setCurrentFieldset(name)
    dispatch(getAttributeData(attributeData?.projektin_nimi,name))
  }

  const hideFieldset = (formName, set, nulledFields,i) => {
    if (connection?.connection === false) {
      dispatch(setLastSaved('error', null, [name], [], false))
      return
    }
    setHiding(true)
    
    // Remove all fields in this fieldset from error list to prevent UI from getting stuck
    // When a fieldset is deleted, any errors in its fields should be cleared
    fields.forEach(field => {
      const fieldName = `${set}.${field.name}`;
      dispatch(formErrorList(false, fieldName));
    });
    
    dispatch(getAttributeData(attributeData?.projektin_nimi,name,formName, set, nulledFields,i))
  }

  const requestReorder = (requestedOrder) => {
    if (connection?.connection === false) {
      dispatch(setLastSaved('error', null, [name], [], false))
      return
    }
    //Fetch latest fieldset data first, the new order is applied to it in the updateField useEffect
    setPendingOrder(requestedOrder)
    dispatch(getAttributeData(attributeData?.projektin_nimi,name))
  }

  useEffect(() => {
    if (lastSaved?.status === 'ok' || lastSaved?.status === 'success') {
      setLastSavedChildField(null)
    }

    if(lastSaved?.status === "error") {
      if (!isThisFieldsetNetworkError) {
        setExpanded([])
      }
      setAdding(false)
      setCurrentFieldset(false)
      setHiding(false)
      setPendingOrder(null)
    }
  }, [lastSaved?.status])
 
  useEffect(() => {
    if(!isMount){
      if(updateField?.fieldName === name && adding){
        //Add new fieldset to last index after fetching latest fieldset data
        setCurrentFieldset(name)
        sets.push({})
        handleBlur()
        handleOutsideClick()
        setAdding(false)
        setPendingAutoOpen(true)
      }
      else if(updateField?.fieldName === name && hiding){
        //Hide fieldset after fetching latest fieldset data
        setCurrentFieldset(name)
        dispatch(change(updateField?.formName, updateField?.set, updateField?.nulledFields))
        setHiddenIndex(updateField?.i)
        handleBlur()
        setHiding(false)
      }
      else if(updateField?.fieldName === name && reordering){
        //Apply requested order to the latest fieldset data; rows added meanwhile by others end up last
        const latestValues = updateField?.data?.[name] ?? get(formValues, name)
        const orderChanges = getFieldsetOrderChanges(latestValues, pendingOrder)
        orderChanges.forEach(({ index, order }) => {
          dispatch(change(formName, `${name}[${index}]._order`, order))
        })
        if (orderChanges.length > 0) {
          handleBlur()
        }
        setPendingOrder(null)
      }
      else if(updateField?.fieldName === name && saving){
        setCurrentFieldset(name)
      }
    }
  }, [updateField?.fieldName,updateField?.data]) 

  useEffect(() => {
    if (autoOpenScrollPending.current && expanded.length > 0) {
      autoOpenScrollPending.current = false
      requestAnimationFrame(() => {
        const containers = accordionRef.current?.querySelectorAll('.fieldset-container')
        const lastContainer = containers?.[containers.length - 1]
        if (lastContainer) {
          lastContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      })
    }
  }, [expanded])

  useEffect(() => {
    if (!saving) {
      if (pendingAutoOpen && lastSaved?.status !== 'error') {
        const formFieldValues = sets
        const newIndex = formFieldValues.reduce((lastActive, _, idx) => {
          const del = get(formValues, `${name}[${idx}]._deleted`)
          return del ? lastActive : idx
        }, -1)
        if (newIndex !== -1) {
          const newSet = `${name}[${newIndex}]`
          autoOpenScrollPending.current = true
          setExpanded([newIndex])
          handleLockField(newSet)
        }
        setPendingAutoOpen(false)
      }
      setCurrentFieldset(false)
    }
  }, [saving])

  const closeAccordion = (index, expandedArray = expanded.slice()) => {
    const fieldsetIdentifier = `${name}[${index}]`;
    const isOffline = lastSaved?.status === 'error';
    const hasError = formErrors?.some(errorFieldName => errorFieldName.startsWith(name));
    const expandedIndex = expandedArray.indexOf(index);
    if (expandedIndex !== -1) {
      expandedArray.splice(expandedIndex, 1);
      if (!isOffline && !hasError) handleUnlockField(fieldsetIdentifier);
    }
    return expandedArray;
  }

  const onAccordionClick = (set, i) => {
    let expandedArray = expanded.slice();
    if (expandedArray.includes(i)) {
      expandedArray = closeAccordion(i, expandedArray);
    } else {
      if (lastSaved?.status !== 'error') {
        // Opening fieldset - fetch data only if no validation errors in this fieldset
        // This preserves user's invalid input so they can fix it
        const hasFieldsetErrors = formErrors?.some(errorFieldName =>
          errorFieldName.startsWith(`${set}.`)
        );
        if (!hasFieldsetErrors) {
          dispatch(getAttributeData(attributeData?.projektin_nimi, name, formName, set, nulledFields, i));
        }
        // Don't lock fieldset if any field has errors - The problematic field should already be locked
        // Locking any field clears existing locks
        if (!formErrors?.length) {
          handleLockField(set);
        }
      }
      //Close other accordions and open latest
      expandedArray = [i];
    }
    setExpanded(expandedArray);
  }

  const onCloseAccordionClick = (index) => {
    setExpanded(closeAccordion(index));
  }

  const handleOutsideClick = () => {
    const isOffline = lastSaved?.status === 'error'
    const hasError = formErrors?.some(errorFieldName => errorFieldName.startsWith(name))
    const lockedField = lockStatus.fieldIdentifier;
    const thisIslockedField = lockedField?.startsWith(name) && lockStatus?.lockStyle?.isLocked;
    //close all accordions and unlock locked field when clicked outside fieldset main
    setExpanded([]);
    if (thisIslockedField && lockStatus.owner && !isOffline && !hasError) {
      handleUnlockField(lockedField);
    }
  }

  OutsideClick(accordionRef, handleOutsideClick)
  
  const anyFieldsetHasChildError = !!formErrors?.some(ef => ef.startsWith(`${name}[`));

  const isThisFieldsetConnectionRestored = lastSaved?.status === 'connection_restored' && savedFields.some(f =>
    typeof f === 'string' && (f === name || f.startsWith(`${name}[`))
  )

  const addButtonMessage = buildAddButtonMessage({
    isNetworkError: isThisFieldsetNetworkError,
    isConnectionRestored: isThisFieldsetConnectionRestored,
    hasChildError: anyFieldsetHasChildError,
    t
  })

  const fieldsetValues = get(formValues, name)
  const displayOrder = applyRequestedOrder(getFieldsetDisplayOrder(fieldsetValues, sets.length), pendingOrder)
  const visibleOrder = displayOrder.filter(i => !get(fieldsetValues, `[${i}]._deleted`) && i !== hiddenIndex)
  const displayOrderKey = displayOrder.join()

  // FLIP: when the order changes, rows slide from their previous position (offsetTop ignores running transforms)
  useLayoutEffect(() => {
    const rows = [...(accordionRef.current?.querySelectorAll(':scope > .fieldset-container[data-row]') ?? [])]
    const previousTops = rowTops.current
    rowTops.current = new Map(rows.map(row => [row.dataset.row, row.offsetTop]))
    const orderChanged = previousOrderKey.current !== null && previousOrderKey.current !== displayOrderKey
    previousOrderKey.current = displayOrderKey
    if (!orderChanged || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    rows.forEach(row => {
      const delta = previousTops.get(row.dataset.row) - row.offsetTop
      if (delta) {
        row.animate?.([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 180, easing: 'ease-out' })
      }
    })
  })

  const lockedByOtherUser = !!(lockStatus?.lockStyle && !lockStatus?.owner &&
    lockStatus?.fieldIdentifier?.startsWith(`${name}[`))
  const canReorder = !disabled && visibleOrder.length > 1 && !saving && !hiding && !adding && !reordering &&
    !lockedByOtherUser && lastSaved?.status !== 'error' && !(formErrors?.length > 0) && !shouldDisableForErrors

  const clearDragState = () => {
    const visiblePosition = visibleOrder.indexOf(dropTarget?.index)
    if (visiblePosition !== -1){
      document.body.ariaNotify(t('project.fieldset-reordered', {to: dropTarget?.index, total: visibleOrder.length}))
    }
    setDraggedIndex(null)
    setDropTarget(null)
  }

  const moveRow = (fromIndex, toPosition) => {
    const newOrder = moveFieldsetRow(visibleOrder, visibleOrder.indexOf(fromIndex), toPosition)
    if (canReorder && newOrder !== visibleOrder) {
      requestReorder(newOrder)
    }
  }

  const getDropPosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  }

  // The whole list (extended past its edges while dragging) accepts drops; beyond the first/last row the pointer decides
  const getEdgeDropTarget = (clientY) => {
    const rows = accordionRef.current?.querySelectorAll(':scope > .fieldset-container[data-row]')
    if (!rows?.length) return null
    const first = rows[0]
    const last = rows[rows.length - 1]
    if (clientY < first.getBoundingClientRect().top) return { index: Number(first.dataset.row), position: 'before' }
    if (clientY > last.getBoundingClientRect().bottom) return { index: Number(last.dataset.row), position: 'after' }
    return null
  }

  const listDropProps = {
    onDragOver: (e) => {
      if (draggedIndex === null) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const edge = getEdgeDropTarget(e.clientY)
      if (edge && (edge.index !== dropTarget?.index || edge.position !== dropTarget?.position)) {
        setDropTarget(edge)
      }
    },
    onDrop: (e) => {
      if (draggedIndex === null) return
      e.preventDefault()
      const target = getEdgeDropTarget(e.clientY) ?? dropTarget
      if (target) {
        const from = visibleOrder.indexOf(draggedIndex)
        const to = visibleOrder.indexOf(target.index) + (target.position === 'after' ? 1 : 0)
        moveRow(draggedIndex, from < to ? to - 1 : to)
      }
      clearDragState()
    },
  }

  const getRowReorder = (i) => {
    if (disabled) {
      return null
    }
    const position = visibleOrder.indexOf(i)
    return {
      enabled: canReorder,
      position,
      total: visibleOrder.length,
      isDragged: draggedIndex === i,
      dropPosition: dropTarget?.index === i && draggedIndex !== i ? dropTarget.position : null,
      onMove: (toPosition) => moveRow(i, toPosition),
      onDragStart: () => setDraggedIndex(i),
      onDragEnd: clearDragState,
      containerProps: {
        'data-row': i,
        onDragOver: (e) => {
          if (draggedIndex === null) return
          const dropPosition = getDropPosition(e)
          if (dropTarget?.index !== i || dropTarget?.position !== dropPosition) {
            setDropTarget({ index: i, position: dropPosition })
          }
        },
      },
    }
  }


  const infoData = fieldsetTotal ? getFieldsetInfoData(fieldsetTotal, formValues, name, t) : {}

  const addButtonStyle = {};
  if (infoData.count === 0) addButtonStyle.paddingLeft = 0;
  if ((currentFieldset === name) && adding) addButtonStyle.color = "#000";

  return (
    <>
    <div className={`fieldset-main-container${draggedIndex === null ? '' : ' fieldset-main-container-dragging'}`}
      ref={accordionRef} {...(disabled ? {} : listDropProps)}>
    <div className={'fieldset-info' + (!infoData.count > 0 ? ' no-fs-rows' : '')}>
      {infoData?.label}
    </div>
      {displayOrder.map((i) => (
        <React.Fragment key={`${name}-${i}`}>
          <FieldsetRow
            set={`${name}[${i}]`}
            i={i}
            sets={sets}
            name={name}
            fields={fields}
            formName={formName}
            formValues={formValues}
            formErrors={formErrors}
            attributeData={attributeData}
            lastSaved={lastSaved}
            lockStatus={lockStatus}
            disabled={disabled}
            disable_fieldset_delete_add={disable_fieldset_delete_add}
            hiddenIndex={hiddenIndex}
            expanded={expanded}
            hiding={hiding}
            saving={saving}
            adding={adding}
            reordering={reordering}
            reorder={getRowReorder(i)}
            lastSavedChildField={lastSavedChildField}
            isThisFieldsetNetworkError={isThisFieldsetNetworkError}
            isThisFieldsetConnectionRestored={isThisFieldsetConnectionRestored}
            nulledFields={nulledFields}
            syncronousErrors={syncronousErrors}
            updated={updated}
            highlightedTag={highlightedTag}
            highlightedInFieldset={highlightedInFieldset}
            phaseIsClosed={phaseIsClosed}
            isTabActive={isTabActive}
            handleSave={handleSave}
            handleLockField={handleLockField}
            handleUnlockField={handleUnlockField}
            onRadioChange={onRadioChange}
            lockField={lockField}
            unlockAllFields={unlockAllFields}
            validate={validate}
            onChildBlurSave={(currentName) => {
              setLastSavedChildField(currentName)
              if (onBlur) {
                handleBlur()
              }
            }}
            onAccordionClick={onAccordionClick}
            onCloseAccordionClick={onCloseAccordionClick}
            onHide={hideFieldset}
          />
        </React.Fragment>
      ))}
      {!disable_fieldset_delete_add && (
        <Button
          className={`fieldset-button-add ${checking && projectUtils.hasFieldsetErrors(name, fields, attributeData) ? 'fieldset-internal-error' : null
            }`}
          style={addButtonStyle}
          onClick={() => {
            refreshFieldset()
          }}
          disabled={disabled || formErrors.length > 0 || saving || reordering || lastSaved?.status === 'error' || (shouldDisableForErrors && !anyFieldsetHasChildError)}
          variant="supplementary"
          size='small'
          fullWidth={true}
          iconLeft={
          (currentFieldset === name) && adding ? (
            <div className="fieldset-spinner-button">
              <LoadingSpinner 
                className="loading-spinner" 
                theme={{
                  '--spinner-color': '#0000BF',
                }}
              />
            </div>
          ) : (
            <IconPlus />
          )
        }
        >
        {(currentFieldset === name) && adding
          ? t('project.adding')
          : t('project.add')}
        </Button>
      )}
    </div>
    {addButtonMessage}
    </>
  )
}

const mapStateToProps = state => ({
  checking: checkingSelector(state),
  saving: savingSelector(state),
  lastSaved: lastSavedSelector(state),
  updateField: updateFieldSelector(state),
  formErrors: formErrorListSelector(state),
  connection: pollSelector(state),
  savingField: state.project.savingField,
  testingConnection: state.project.testingConnection,
})

FieldSet.propTypes = {
  unlockAllFields:PropTypes.func,
  saving: PropTypes.bool,
  sets: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  fields: PropTypes.array,
  lastSaved: PropTypes.object,
  updateField: PropTypes.oneOfType([PropTypes.bool, PropTypes.shape({
    fieldName: PropTypes.string,
    formName: PropTypes.string,
    set: PropTypes.string,
    nulledFields: PropTypes.arrayOf(PropTypes.object),
    i: PropTypes.number,
    data: PropTypes.any
  })]),
  attributeData: PropTypes.object,
  updated: PropTypes.object,
  phaseIsClosed: PropTypes.bool,
  lockStatus: PropTypes.object,
  isTabActive: PropTypes.bool,
  savingField: PropTypes.string,
  highlightedInFieldset: PropTypes.string,
  highlightedTag: PropTypes.string,
  fieldsetTotal: PropTypes.string,
  testingConnection: PropTypes.shape({
    isActive: PropTypes.bool,
    fieldName: PropTypes.string
  }),
  checking: PropTypes.bool,
  formErrors: PropTypes.arrayOf(PropTypes.string),
  name: PropTypes.string.isRequired,
  formName: PropTypes.string.isRequired,
  formValues: PropTypes.object.isRequired,
  handleSave: PropTypes.func.isRequired,
  onRadioChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  handleLockField: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  handleUnlockField: PropTypes.func.isRequired,
  field: PropTypes.shape({disable_fieldset_delete_add: PropTypes.bool}).isRequired,
  validate: PropTypes.array,
  syncronousErrors: PropTypes.object,
  lockField: PropTypes.func,
  connection: PropTypes.shape({
    connection: PropTypes.bool
  })
  
}

export default connect(mapStateToProps)(FieldSet)
