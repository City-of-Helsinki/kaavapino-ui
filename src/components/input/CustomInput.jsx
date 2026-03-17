import React, { useCallback, useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput, NumberInput } from 'hds-react'
import { useDispatch, useSelector } from 'react-redux'
import {updateFloorValues,formErrorList} from '../../actions/projectActions'
import {lockedSelector,lastModifiedSelector,pollSelector,lastSavedSelector,savingSelector,pollingProjectsSelector } from '../../selectors/projectSelector'
import moment from 'moment'
import { useTranslation } from 'react-i18next'
import RollingInfo from '../input/RollingInfo.jsx'
import NetworkErrorState from './NetworkErrorState.jsx'
import {useFocus} from '../../hooks/useRefFocus'
import { useIsMount } from '../../hooks/IsMounted'
import { useFieldPassivation } from '../../hooks/useFieldPassivation'
import './Input.scss'

const CustomInput = ({ fieldData, input, meta, ...custom }) => {

  const { error } = meta;

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
  const [isThisFieldSaving, setIsThisFieldSaving] = useState(false)

  const lastModified = useSelector(state => lastModifiedSelector(state))
  const lockedStatus = useSelector(state => lockedSelector(state))
  const connection = useSelector(state => pollSelector(state))
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const saving = useSelector(state => savingSelector(state))
  const pollingProjects = useSelector(pollingProjectsSelector)

  const isMount = useIsMount();
  const [inputRef, setInputFocus] = useFocus()
  const oldValueRef = useRef('');
  const { t } = useTranslation()
  const dispatch = useDispatch()
  
  /**
   * Check if this field has an active network error stored in localStorage
   */
  const hasActiveNetworkError = () => {
    const wasNetworkErrorKey = `wasNetworkError_${input.name}`;
    try {
      return localStorage.getItem(wasNetworkErrorKey) === 'true';
    } catch (e) {
      return false;
    }
  };
  
  // Check if other fields have validation errors OR connection errors (UX60.2.5 - passivate fields when error exists)
  const shouldDisableForErrors = useFieldPassivation(input.name, { formName: meta.form })

  // Needed for using lockedStatus as useEffect dependency
  const lockedStatusJsonString = JSON.stringify(lockedStatus);

  useEffect(() => {
    oldValueRef.current = input.value;
    if(custom.type === "date" && !custom.insideFieldset){
      setReadOnly({name:input.name,read:true})
    }
    return () => {};
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
    //!ismount skips initial render
    if(!isMount){
      //Adds field to error list that don't trigger toastr right away (too many chars,empty field etc) and shows them when trying to save
      // Add to error list immediately when validation fails (enables field passivation)
      if(hasError){
        dispatch(formErrorList(true,input.name))
      }
      //removes field from error list (can remove even if not touched)
      else if(!hasError){
        dispatch(formErrorList(false,input.name))
      }
    }
  }, [hasError])

  // Handle error list for rolling info fields (when field is closed but has network errors)
  useEffect(() => {
    if(!isMount && custom.rollingInfo && !editField){
      // When rolling info field is closed and has network error
      const hasNetworkError = hasActiveNetworkError();
      
      if(hasNetworkError){
        dispatch(formErrorList(true, input.name))
      } else {
        dispatch(formErrorList(false, input.name))
      }
    }
  }, [custom.rollingInfo, editField, isMount]);

  useEffect(() => {
    if(lastSaved?.status === "error"){
      //Unable to lock fields and connection backend not working so prevent editing
      document.activeElement.blur()
    }
  }, [lastSaved?.status === "error"])

  useEffect(() => {
    // Reset isThisFieldSaving when saving is complete for this field
    // Check both lastModified (old behavior) and lastSaved.status (new behavior for timing sync)
    const savingComplete = !saving || lastModified !== input.name;
    const savedSuccessfully = lastSaved?.status === "success";
    
    if (isThisFieldSaving && (savingComplete || savedSuccessfully)) {
      setIsThisFieldSaving(false);
    }
  }, [saving, lastModified, input.name, isThisFieldSaving, lastSaved?.status])

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
        if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
          identifier = lockedStatus.lockData.attribute_lock.field_identifier;
        }
        //is normal field
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
                //If field is this instance of component then set value for it from db
                if(key === field){
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
          if(lock && lockedStatus.lockData.attribute_lock.owner){
            if(lastModified === input.name && lockedStatus?.saving){
              setReadOnly({name:input.name,read:true})
            }
            //someone else is editing and prevent editing
            else{
              //Add changed value from db if there has been changes
              setReadOnly({name:input.name,read:false})
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
    // Clear readonly state when there's a validation error to allow editing
    if(!custom.insideFieldset && !custom?.isProjectTimetableEdit && hasError){
      setReadOnly({name:input.name,read:false})
    }

    if (typeof custom.onFocus === 'function' && !lockedStatus?.saving && !custom.insideFieldset) {
      //Sent a call to lock field to backend
      custom.onFocus(input.name);
    }

    // Only prevent editing on network errors (not field validation errors)
    if(lastSaved?.status === "error"){
      //Prevent focus and editing to field if there's a network error
      document.activeElement.blur()
    }
  }

  const handleBlur = (event,readonly) => {
    // Ignore blur only when moving focus to the +/- buttons of the *same* NumberInput
    if (
      custom.type === 'number' &&
      !custom.isFloorAreaForm &&
      event &&
      event.relatedTarget
    ) {
      const currentContainer = inputRef.current
        ? inputRef.current.closest('.NumberInput-module_numberInputContainer__hKNPp')
        : null;
      const nextContainer = event.relatedTarget.closest(
        '.NumberInput-module_numberInputContainer__hKNPp'
      );

      if (currentContainer && nextContainer && currentContainer === nextContainer) {
        // Moving from input to its +/- button: keep it as one control.
        // Refocus the input so that the *next* click outside will blur it and trigger onBlur normally.
        setTimeout(() => {
          if (inputRef.current && typeof inputRef.current.focus === 'function') {
            inputRef.current.focus();
          }
        }, 0);
        return;
      }
    }
    let identifier;
    //Chekcs that locked status has more data then inital empty object
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      //Field is fieldset field and has different type of identifier
      if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
        identifier = lockedStatus.lockData.attribute_lock.field_identifier;
      }
      //is normal field
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
              localStorage.setItem("changedValues", input.name);
              setIsThisFieldSaving(true);
              custom.onBlur(input.name);
              oldValueRef.current = event.target.value;
            }
          }
          else{
            // Check for validation errors BEFORE attempting to save
            let validationError = false;
            
            // Check character limit first (like RichTextEditor)
            const maxLength = custom?.characterLimit;
            if(maxLength && maxLength > 0 && event.target.value.length > maxLength) {
              validationError = true;
              setHasError(true);
            } else if(custom.regex){
              const regex = new RegExp(custom.regex);
              validationError = event.target.value !== "" && !regex.test(event.target.value);
              setHasError(validationError);
            } else if(custom.type === 'number') {
              const regex = /^-?\d+$/;
              validationError = event.target.value !== "" && !regex.test(event.target.value);
              setHasError(validationError);
            }
            
            // Only proceed with save if there's no validation error
            if(!validationError){
              localStorage.setItem("changedValues", input.name);
              setIsThisFieldSaving(true);
              custom.onBlur(input.name);
              oldValueRef.current = event.target.value;
              
              // Only set readonly if there's no validation error
              if(!custom.insideFieldset){
                const readOnlyValue = !custom?.isProjectTimetableEdit
                setReadOnly({name:input.name,read:readOnlyValue})
              }
            } else {
              // Keep field editable when there's a validation error
              if(!custom.insideFieldset){
                setReadOnly({name:input.name,read:false})
              }
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

  // Sets the value of the input from the database if it has changed,
  // used when field locking/unlocking or when data is updated externally
  const setValue = (dbValue) => {
    // Don't overwrite if this field is currently saving or has focus
    if(isThisFieldSaving || document.activeElement === inputRef.current){
      return;
    }
    
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

  // Helper for sanitizing floor area integer input
  const sanitizeFloorAreaValue = (value) => value.replaceAll(/\D/g, '');

  const processFloorAreaInput = (value) => {
    let sanitized = sanitizeFloorAreaValue(value);
    if (sanitized.startsWith('-')) sanitized = sanitized.substring(1);
    return sanitized;
  };

  const handleInputChange = useCallback((event, readonly) => {
    const isConnected = connection.connection ?? true;
    let value = event.target.value;

    if (custom.type === 'number' && custom.isFloorAreaForm) {
      value = processFloorAreaInput(value);

      if (value === '') {
        setHasError(!!custom?.fieldData?.isRequired);
        input.onChange('', input.name);
        if (custom.isFloorAreaForm) {
          //Edit floor area model object data with current value and dispatch change for form total value recalculation
          let newObject = custom.floorValue;
          newObject[input.name] = '';
          dispatch(updateFloorValues(newObject));
        }
        return;
      }
    }

    // Always allow changes for immediate UI feedback - readOnly on NumberInput is handled by the prop
    const isConnectedOrAllowEdits = !readonly || custom.type === "date" || custom.type === "number" || isConnected;
    
    // Validate number input during typing
    if(custom.type === 'number' && !custom.isFloorAreaForm) {
      if(value === '') {
        // Empty field - error only if required
        setHasError(!!custom?.fieldData?.isRequired);
      } else {
        // Non-empty field - check if valid integer
        const regex = /^-?\d+$/;
        const isValid = regex.test(value);
        setHasError(!isValid);
      }
    } else if(custom.type !== 'number' || custom.isFloorAreaForm) {
      // Check max length during typing (enables immediate field passivation)
      // Support character_limit for consistency with RichTextEditor
      const maxLength = custom?.characterLimit;
      const exceedsMaxLength = maxLength && maxLength > 0 && value.length > maxLength;
      
      if(exceedsMaxLength) {
        setHasError(true);
      } else if(!value?.trim() && !!custom?.fieldData?.isRequired) {
        // For other types, error if empty and required
        setHasError(true);
      } else {
        setHasError(false);
      }
    }
    
    // Always update the value for number inputs to ensure UI is responsive
    if (custom.type === 'number' || isConnectedOrAllowEdits) {
      input.onChange(value, input.name);
      if (custom.isFloorAreaForm) {
        let newObject = custom.floorValue;
        newObject[input.name] = value === '' ? '' : Number(value);
        dispatch(updateFloorValues(newObject));
      }
    }
  }, [input.name, input.value]);



  const editRollingField = () => {
    // Don't open field if other fields have errors (passivation active)
    if (shouldDisableForErrors) {
      return;
    }
    setEditField(true)
    setTimeout(function(){
      setInputFocus()
    }, 200);
  }

  // Renders the rolling info field (read-only or with edit option)
  const renderRollingInfo = () => (
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
      shouldDisableForErrors={shouldDisableForErrors}
    />
  );

  // Renders the standard text input with error handling and loading spinner
  const renderTextInput = () => {
    // Determine appropriate error message
    const maxLength = custom?.characterLimit;
    const exceedsMaxLength = maxLength && maxLength > 0 && input.value && input.value.length > maxLength;
    const errorString = custom.customError || 
      (exceedsMaxLength ? t('project.charsover') : 
        (custom.type === 'number' ? t('project.error-input-int') : t('project.error')));
    // Check if THIS field has network error OR backend validation error (include connection_restored to keep spinner during recovery)
    const isThisFieldNetworkError = (lastSaved?.status === 'error' || lastSaved?.status === 'field_error' || lastSaved?.status === 'connection_restored') && 
      lastSaved?.fields?.includes(input.name);
    
    const blurredClass = (isThisFieldSaving || (pollingProjects && isThisFieldNetworkError)) ? ' blurred' : '';
    const hasErrorClass = (inputUtils.hasError(error) || hasError) ? ' error' : '';
    const networkErrorClass = isThisFieldNetworkError ? ' has-network-error' : '';
    
    // Check if there's a validation error
    const hasValidationError = inputUtils.hasError(error) || hasError;
    
    return (
      <div className={`text-input${custom.type === 'number' ? ' number-input' : ''}${blurredClass}${hasErrorClass}${networkErrorClass}`}>
        {custom.type === 'number' ? (
          <NumberInput
            ref={inputRef}
            aria-label={input.name}
            error={hasValidationError ? true : undefined}
            errorText=""
            fluid="true"
            {...input}
            {...restCustom}
            min={custom.isFloorAreaForm ? 0 : undefined}
            step={custom.isFloorAreaForm ? null : 1}
            disabled={custom?.isProjectTimetableEdit ? !custom?.timetable_editable : custom.disabled || isThisFieldSaving || shouldDisableForErrors}
            onChange={(event) => { handleInputChange(event, readonly.read) }}
            onBlur={(event) => { handleBlur(event, readonly.read) }}
            onFocus={() => { handleFocus() }}
            readOnly={readonly.read || lastSaved?.status === "error"}
            minusStepButtonAriaLabel="Vähennä yhdellä"
            plusStepButtonAriaLabel="Lisää yhdellä"
          />
        ) : (
          <TextInput
            ref={inputRef}
            aria-label={input.name}
            error={hasValidationError ? true : undefined}
            errorText=""
            fluid="true"
            {...input}
            {...restCustom}
            disabled={custom?.isProjectTimetableEdit ? !custom?.timetable_editable : custom.disabled || shouldDisableForErrors}
            onChange={(event) => { handleInputChange(event, readonly.read) }}
            onBlur={(event) => { handleBlur(event, readonly.read) }}
            onFocus={() => { handleFocus() }}
            readOnly={readonly.read || lastSaved?.status === "error"}
            id={fieldData?.id}
          />
        )}
        <NetworkErrorState fieldName={input.name} validationError={hasValidationError ? errorString : null} />
      </div>
    );
  };

  // Decides whether to show a rolling info field or a normal text input
  const normalOrRollingElement = () => {
     // If the field is non-editable, or rollingInfo is enabled and not in edit mode, show rolling info
    if (custom.nonEditable || (custom.rollingInfo && !editField)) {
      return renderRollingInfo();
    }
    // Otherwise, show the standard text input
    return renderTextInput();
  };

  return (
    normalOrRollingElement()
  )
}

CustomInput.propTypes = {
  input: PropTypes.object.isRequired,
  isTabActive: PropTypes.bool
}

export default CustomInput