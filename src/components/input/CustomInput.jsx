import React, { useCallback, useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput, LoadingSpinner } from 'hds-react'
import { useDispatch, useSelector } from 'react-redux'
import {updateFloorValues,formErrorList} from '../../actions/projectActions'
import {lockedSelector,lastModifiedSelector,pollSelector,lastSavedSelector,savingSelector } from '../../selectors/projectSelector'
import moment from 'moment'
import { useTranslation } from 'react-i18next'
import RollingInfo from '../input/RollingInfo.jsx'
import {useFocus} from '../../hooks/useRefFocus'
import { useIsMount } from '../../hooks/IsMounted'
import './Input.scss'

const CustomInput = ({ fieldData, input, meta: { error }, ...custom }) => {

  // destructure props to avoid spreading custom props onto the DOM element
  const {
    lockField,
    handleUnlockField,
    fieldSetDisabled,
    insideFieldset,
    nonEditable,
    rollingInfo,
    modifyText,
    rollingInfoText,
    isCurrentPhase,
    selectedPhase,
    attributeData,
    phaseIsClosed,
    customError,
    isTabActive,
    isProjectTimetableEdit,
    timetable_editable,
    ...restCustom
  } = custom;

  const [readonly, setReadOnly] = useState({name:"",read:false})
  const [hasError,setHasError] = useState(false)
  const [editField,setEditField] = useState(false)
  const [hadFocusBeforeTabOut, setHadFocusBeforeTabOut] = useState(false)
  const [isInstanceSaving, setIsInstanceSaving] = useState(false);

  const lastModified = useSelector(state => lastModifiedSelector(state))
  const lockedStatus = useSelector(state => lockedSelector(state))
  const connection = useSelector(state => pollSelector(state))
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const saving =  useSelector(state => savingSelector(state))

  const isMount = useIsMount();
  const [inputRef, setInputFocus] = useFocus()
  const oldValueRef = useRef('');
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // Needed for using lockedStatus as useEffect dependency
  const lockedStatusJsonString = JSON.stringify(lockedStatus);

  useEffect(() => {
    oldValueRef.current = input.value;
    if(custom.type === "date" && !custom.insideFieldset){
      setReadOnly({name:input.name,read:true})
    }
    return () => {

    };
  }, [])

  useEffect(() => {
    if (!saving && custom.isTabActive){
      if (hadFocusBeforeTabOut) {
        setInputFocus()
        setHadFocusBeforeTabOut(false)
      }
    }
    else if (document.activeElement == inputRef.current){
      setHadFocusBeforeTabOut(true)
      inputRef.current.blur()
    }
  }, [custom.isTabActive, saving])

  useEffect(() => {
    if(!isMount){
      //!ismount skips initial render
      if(hasError){
        //Adds field to error list that don't trigger toastr right away (too many chars,empty field etc) and shows them when trying to save
        dispatch(formErrorList(true,input.name))
      }
      else{
        //removes field from error list
        dispatch(formErrorList(false,input.name))
      }
    }
  }, [hasError])

  useEffect(() => {
    if(lastSaved?.status === "error"){
      //Unable to lock fields and connection backend not working so prevent editing
      document.activeElement.blur()
    }
  }, [lastSaved?.status === "error"])

  useEffect(() => {
    //Chekcs that locked status has more data then inital empty object
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      if(lockedStatus.lock === false){
        let identifier;
        let name = input.name;

        if(custom.insideFieldset){
          if(name){
            //Get index of fieldset
            name = name.split('.')[0]
          }
        }
        //Field is fieldset field and has different type of identifier
        //else is normal field
        if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
          identifier = lockedStatus.lockData.attribute_lock.field_identifier;
        }
        else{
          identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
        }

        const lock = name === identifier

        if(custom.insideFieldset){
          if(lock){
            let fieldData
            let field = input.name
            const fieldSetFields = lockedStatus.lockData.attribute_lock.field_data
  
            if(field){
              //Get single field
              field = field.split('.')[1]
            }
            
            if(fieldSetFields){
              for (const [key, value] of Object.entries(fieldSetFields)) {
                if(key === field){
                  //If field is this instance of component then set value for it from db
                  fieldData = value
                }
              }
            }

            setValue(fieldData)
            custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
            setReadOnly(false)
          }
          else{
            custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
            setReadOnly(false)
          }
        }
        else{
          //Check if locked field name matches with instance and that owner is true to allow edit
          //else someone else is editing and prevent editing
          if(lock && lockedStatus.lockData.attribute_lock.owner){
            if(lastModified === input.name && lockedStatus?.saving){
              setReadOnly({name:input.name,read:true})
            }
            else{
              setReadOnly({name:input.name,read:false})
              //Add changed value from db if there has been changes
              setValue(lockedStatus.lockData.attribute_lock.field_data)
              //Change styles from FormField
              custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
            }
          }
          else{
            setReadOnly({name:input.name,read:true})
            //Change styles from FormField
            custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
          }
        }
      }
    }
  }, [lockedStatusJsonString, connection.connection]);

  const handleFocus = () => {
    if (typeof custom.onFocus === 'function' && !lockedStatus?.saving && !custom.insideFieldset) {
      //Sent a call to lock field to backend
      custom.onFocus(input.name);
    }

    if(lastSaved?.status === "error"){
      //Prevent focus and editing to field if not locked
      document.activeElement.blur()
    }
  }

  const handleBlur = (event,readonly) => {
    let identifier;
    //Chekcs that locked status has more data then inital empty object
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      //Field is fieldset field and has different type of identifier
      //else is normal field
      if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
        identifier = lockedStatus.lockData.attribute_lock.field_identifier;
      }
      else{
        identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
      }
    }
    //Check lockfield if component is used somewhere where locking is not used.
    if (typeof lockField === 'function' && !custom.insideFieldset) {
      //Send identifier data to change styles from FormField.js
      custom.lockField(false,false,identifier)
    }
    if (typeof custom.handleUnlockField === 'function' && !custom.insideFieldset && 
      lockedStatus.lockData.attribute_lock.owner) {
      //Sent a call to unlock field to backend
      custom.handleUnlockField(input.name)
    }
    let originalData
    if (custom?.attributeData){
      originalData = custom?.attributeData[input?.name]
    }
    else{
      originalData = false
    }

    if (event.target.value !== originalData) {
      //prevent saving if locked
      if (!readonly) {
        //Sent call to save changes
        if (typeof custom.onBlur === 'function') {
          if(custom.type === "date"){
            //Validate date
            let dateOk = moment(event.target.value, 'YYYY-MM-DD',false).isValid()
            if (event.target.value === "" && !custom?.fieldData?.required) {
              dateOk = true
            }
            if(dateOk){
              setIsInstanceSaving(true);
              localStorage.setItem("changedValues", input.name);
              custom.onBlur(input.name);
              oldValueRef.current = event.target.value;
            }
          }
          else{
            setIsInstanceSaving(true);
            localStorage.setItem("changedValues", input.name);
            custom.onBlur(input.name);
            if(!custom.insideFieldset){
              const readOnlyValue = !custom?.isProjectTimetableEdit
              setReadOnly({name:input.name,read:readOnlyValue})
            }
            oldValueRef.current = event.target.value;
            if(custom.regex){
              const regex = new RegExp(custom.regex);
              setHasError(event.target.value !== "" && !regex.test(event.target.value))
            } else if(custom.type === 'number') {
              const regex = new RegExp("^[+-]?\\d+$");
              setHasError(event.target.value !== "" && !regex.test(event.target.value))
            }
          }
        }
      }
    }

    if(custom.type === "date" && !custom.insideFieldset){
      setReadOnly({name:input.name,read:true})
    }

    if(custom.rollingInfo){
      setEditField(false)
    }
  }

  const setValue = (dbValue) => {

    let name = input.name;
    let originalData = custom?.attributeData[name]
    if(custom.insideFieldset && !custom.nonEditable || !custom.rollingInfo){
      let fieldsetName
      let fieldName
      let index
      //Get fieldset name, index and field of fieldset
      fieldsetName = name.split('[')[0]
      index = name.split('[').pop().split(']')[0];
      fieldName = name.split('.')[1]
      if(custom?.attributeData[fieldsetName]?.[index]){
        originalData = custom?.attributeData[fieldsetName][index][fieldName]
      }
    }
    //set editor value from db value updated with focus and lock call if data has changed on db
    if(dbValue && originalData !== dbValue || connection.connection){
      input.onChange(dbValue, input.name)
    }
  }

  const handleInputChange = useCallback((event, readonly) => {
    const isConnected = connection.connection || typeof connection.connection === "undefined" ? true : false;
    let value = event.target.value;

    // Restrict for kerrosalatiedot (floor area) number fields
    if (custom.type === 'number' && custom.isFloorAreaForm) {
      // Remove all non-digit characters
      value = value.replace(/[^0-9]/g, '');

      // Prevent negative numbers (shouldn't be possible, but just in case)
      if (value.startsWith('-')) {
        value = value.substring(1);
      }

      // If value is empty, treat as 0 or empty string as needed
      if (value === '') {
        setHasError(custom?.fieldData?.isRequired);
        input.onChange('', input.name);
        if (custom.isFloorAreaForm) {
          let newObject = custom.floorValue;
          newObject[input.name] = '';
          dispatch(updateFloorValues(newObject));
        }
        return;
      }
    }

    if (!readonly || custom.type === "date" || isConnected) {
      if (!value?.trim() && custom?.fieldData?.isRequired) {
        setHasError(true);
      } else {
        setHasError(false);
      }
      input.onChange(value, input.name);
      if (custom.isFloorAreaForm) {
        // Edit floor area model object data with current value and dispatch change for form total value recalculation
        let newObject = custom.floorValue;
        newObject[input.name] = value === '' ? '' : Number(value);
        dispatch(updateFloorValues(newObject));
      }
    }
  }, [input.name, input.value]);

  useEffect(() => {
    if (!saving && isInstanceSaving) {
      setIsInstanceSaving(false);
    }
  }, [saving]);

  const editRollingField = () => {
    setEditField(true)
    setTimeout(function(){
      setInputFocus()
    }, 200);
  }


  const normalOrRollingElement = () => {
    const errorString = custom.customError || (custom.type === 'number'? t('project.error-input-int') : t('project.error'))
    //Render rolling info field or normal edit field
    //If clicking rolling field button makes positive lock check then show normal editable field
    //Rolling field can be nonEditable
    const elements = custom.nonEditable || custom.rollingInfo && !editField ?
      <RollingInfo 
        name={input.name} 
        value={input.value} 
        nonEditable={custom.nonEditable}
        modifyText={custom.modifyText}
        rollingInfoText={custom.rollingInfoText}
        editRollingField={editRollingField}
        type={"input"}
        phaseIsClosed={custom.phaseIsClosed}
        factaInfo={custom?.fieldData?.assistive_text}
      />
      :    
      <div className={custom.disabled || !inputUtils.hasError(error).toString() || !hasError ? "text-input " : "text-input " +t('project.error')}>
        <TextInput
          ref={inputRef}
          aria-label={input.name}
          error={inputUtils.hasError(error).toString()}
          errorText={custom.disabled || !inputUtils.hasError(error).toString() || !hasError ? "" : errorString}
          fluid="true"
          {...input}
          {...restCustom}
          min={custom.type === 'number' && custom.isFloorAreaForm ? 0 : undefined}
          inputMode={custom.type === 'number' && custom.isFloorAreaForm ? "numeric" : undefined}
          pattern={custom.type === 'number' && custom.isFloorAreaForm ? "[0-9]*" : undefined}
          disabled={custom?.isProjectTimetableEdit ? !custom?.timetable_editable : custom.disabled}
          onKeyDown={custom.type === 'number' && custom.isFloorAreaForm ? (e) => {
            // Allow: digits, navigation keys, editing keys
            const allowed =
              (e.key.length === 1 && /^[0-9]$/.test(e.key)) ||
              ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'].includes(e.key);

            if (!allowed) {
              e.preventDefault();
            }
          } : undefined}
          onChange={(event) => { handleInputChange(event, readonly.read) }}
          onBlur={(event) => { handleBlur(event, readonly.read) }}
          onFocus={() => { handleFocus() }}
          readOnly={readonly.read || lastSaved?.status === "error"}
        />
        {saving && isInstanceSaving && (
          <>
            {custom.type === "date" ? (
              <div className="input-spinner-datetime">
                <LoadingSpinner className="loading-spinner" />
              </div>
            ) : (
              <div className="input-spinner">
                <LoadingSpinner className="loading-spinner" />
              </div>
            )}
          </>
        )}
      </div>
    
    return elements
  }

  return (
    normalOrRollingElement()
  )
}

CustomInput.propTypes = {
  input: PropTypes.object.isRequired,
  isTabActive: PropTypes.bool
}

export default CustomInput