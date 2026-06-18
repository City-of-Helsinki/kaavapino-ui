import React, { useState, useRef, useEffect } from 'react'
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
import { buildAddButtonMessage, getNumberOfFieldsets } from './helpers.js'
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
  const accordianRef = useRef(null)
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
      else if(updateField?.fieldName === name && saving){
        setCurrentFieldset(name)
      }
    }
  }, [updateField?.fieldName,updateField?.data]) 

  useEffect(() => {
    if (autoOpenScrollPending.current && expanded.length > 0) {
      autoOpenScrollPending.current = false
      requestAnimationFrame(() => {
        const containers = accordianRef.current?.querySelectorAll('.fieldset-container')
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

  const checkLocked = (e,set,i) => {
    let expand = false
    //Change expanded styles if close button or accordian heading element is clicked
    const substrings = ["fieldset-accordian-close","accordion-button"];
    if (substrings.some(v => e?.target?.className?.includes(v))) {
      expand = true
    }
    
    if(expand){
      const isOffline = lastSaved?.status === 'error'
      //Expand or close element that was clicked inside fieldset array of elements
      //Prevent focus and editing to field if not locked
      let expandedArray = expanded.slice();
      if(expandedArray.includes(i)){
        expandedArray.splice(expandedArray.indexOf(i), 1);
        if (!isOffline) handleUnlockField(set)
      }
      else{
        if (!isOffline) {
          // Opening fieldset - fetch data only if no validation errors in this fieldset
          // This preserves user's invalid input so they can fix it
          const hasFieldsetErrors = formErrors?.some(errorFieldName => 
            errorFieldName.startsWith(`${set}.`)
          );
          if (!hasFieldsetErrors) {
            dispatch(getAttributeData(attributeData?.projektin_nimi,name,formName, set, nulledFields,i))
          }
          handleLockField(set)
        }
        //Close other accordians and open latest
        expandedArray = [i];
      }
      setExpanded(expandedArray);
    }

  }

   const handleOutsideClick = () => {
    const lockedField = lockStatus.fieldIdentifier
    //close all accordians and unlock locked field when clicked outside fieldset main
    setExpanded([]);
    if (lockStatus.owner) {
      handleUnlockField(lockedField)
    }
  }

  OutsideClick(accordianRef, handleOutsideClick)
  
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

  return (
    <>
    <div className='fieldset-main-container' ref={accordianRef}>
    <div className='fieldset-info'>{fieldsetTotal ? getNumberOfFieldsets(fieldsetTotal, formValues, name, t) : ""}</div>
      {sets.map((set, i) => (
        <React.Fragment key={`${name}-${i}`}>
          <FieldsetRow
            set={set}
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
            onCheckLocked={checkLocked}
            onHide={hideFieldset}
          />
        </React.Fragment>
      ))}
      {!disable_fieldset_delete_add && (
        <Button
          className={`fieldset-button-add ${checking && projectUtils.hasFieldsetErrors(name, fields, attributeData) ? 'fieldset-internal-error' : null
            }`}
          onClick={() => {
            refreshFieldset()
          }}
          disabled={disabled || formErrors.length > 0 || saving || lastSaved?.status === 'error' || (shouldDisableForErrors && !anyFieldsetHasChildError)}
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
                  '--spinner-thickness': '2px'
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
