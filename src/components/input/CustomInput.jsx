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
    if(!isMount){
      if(hasError){
        dispatch(formErrorList(true,input.name))
      }
      else{
        dispatch(formErrorList(false,input.name))
      }
    }
  }, [hasError])

  useEffect(() => {
    if(lastSaved?.status === "error"){
      document.activeElement.blur()
    }
  }, [lastSaved?.status === "error"])

  useEffect(() => {
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      if(lockedStatus.lock === false){
        let identifier;
        let name = input.name;

        if(custom.insideFieldset){
          if(name){
            name = name.split('.')[0]
          }
        }
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
              field = field.split('.')[1]
            }
            
            if(fieldSetFields){
              for (const [key, value] of Object.entries(fieldSetFields)) {
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
          if(lock && lockedStatus.lockData.attribute_lock.owner){
            if(lastModified === input.name && lockedStatus?.saving){
              setReadOnly({name:input.name,read:true})
            }
            else{
              setReadOnly({name:input.name,read:false})
              setValue(lockedStatus.lockData.attribute_lock.field_data)
              custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
            }
          }
          else{
            setReadOnly({name:input.name,read:true})
            custom.lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
          }
        }
      }
    }
  }, [lockedStatusJsonString, connection.connection]);

  const handleFocus = () => {
    if (typeof custom.onFocus === 'function' && !lockedStatus?.saving && !custom.insideFieldset) {
      custom.onFocus(input.name);
    }

    if(lastSaved?.status === "error"){
      document.activeElement.blur()
    }
  }

  const handleBlur = (event,readonly) => {
    let identifier;
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
        identifier = lockedStatus.lockData.attribute_lock.field_identifier;
      }
      else{
        identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
      }
    }
    if (typeof lockField === 'function' && !custom.insideFieldset) {
      custom.lockField(false,false,identifier)
    }
    if (typeof custom.handleUnlockField === 'function' && !custom.insideFieldset && 
      lockedStatus.lockData.attribute_lock.owner) {
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
      if (!readonly) {
        if (typeof custom.onBlur === 'function') {
          if(custom.type === "date"){
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
              const regex = new RegExp("^\\d+$");
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
      fieldsetName = name.split('[')[0]
      index = name.split('[').pop().split(']')[0];
      fieldName = name.split('.')[1]
      if(custom?.attributeData[fieldsetName]?.[index]){
        originalData = custom?.attributeData[fieldsetName][index][fieldName]
      }
    }
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
          let newObject = custom.floorValue;
          newObject[input.name] = '';
          dispatch(updateFloorValues(newObject));
        }
        return;
      }
    }

    if (!readonly || custom.type === "date" || isConnected) {
      setHasError(!value?.trim() && !!custom?.fieldData?.isRequired);
      input.onChange(value, input.name);
      if (custom.isFloorAreaForm) {
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
    />
  );

  const renderTextInput = () => {
    const errorString = custom.customError || (custom.type === 'number' ? t('project.error-input-int') : t('project.error'));
    return (
      <div className={custom.disabled || !inputUtils.hasError(error).toString() || !hasError ? "text-input " : "text-input " + t('project.error')}>
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
            const allowed =
              (e.key.length === 1 && /^\d$/.test(e.key)) ||
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
    );
  };

  const normalOrRollingElement = () => {
    if (custom.nonEditable || (custom.rollingInfo && !editField)) {
      return renderRollingInfo();
    }
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