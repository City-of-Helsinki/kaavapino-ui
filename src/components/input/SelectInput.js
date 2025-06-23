import React, { useRef, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { Select, LoadingSpinner } from 'hds-react'
import { isArray, isEqual, uniq, uniqBy } from 'lodash'
import { useSelector } from 'react-redux'
import {lockedSelector,savingSelector } from '../../selectors/projectSelector'
import RollingInfo from '../input/RollingInfo'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'

// Label when there are more than one same option. To avoid key errors.
const MORE_LABEL = ' (2)'
const SelectInput = ({
  input,
  error,
  lockField,
  options,
  onFocus,
  onBlur,
  placeholder,
  disabled,
  multiple,
  handleUnlockField,
  insideFieldset,
  nonEditable, 
  rollingInfo, 
  modifyText, 
  rollingInfoText,
  phaseIsClosed,
  editDisabled,
  autofillRule,
  formValues,
  formName,
  isProjectTimetableEdit,
  timetable_editable
}) => {
  const currentValue = []
  const oldValueRef = useRef('');
  const [selectValues, setSelectValues] = useState('')
  const lockedStatus = useSelector(state => lockedSelector(state))
  const lockedStatusJsonString = JSON.stringify(lockedStatus);
  const [readonly, setReadOnly] = useState(false)
  const [fieldName, setFieldName] = useState("")
  const [editField,setEditField] = useState(false)
  const [isInstanceSaving, setIsInstanceSaving] = useState(false);
  const saving =  useSelector(state => savingSelector(state))

  useEffect(() => {
    //Chekcs that locked status has more data then inital empty object
    if(lockedStatus && Object.keys(lockedStatus).length > 0){
      if(lockedStatus.lock === false){
        let identifier;
        let name = input.name;
        //Field is fieldset field and has different type of identifier
        //else is normal field
        if(lockedStatus.lockData.attribute_lock.fieldset_attribute_identifier){
          identifier = lockedStatus.lockData.attribute_lock.field_identifier;
        }
        else{
          identifier = lockedStatus.lockData.attribute_lock.attribute_identifier;
        }
        //Split value for fieldsets
        if(insideFieldset){
          if(name){
            //Get index of fieldset
            name = name.split('.')[0]
          }
        }

        const lock = name === identifier

        if(insideFieldset){
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

            setSelectValue(fieldData)
            lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
            setReadOnly(false)
          }
          else{
            lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
            setReadOnly(false)
          }
        }
        else{
          //Check if locked field name matches with instance and that owner is true to allow edit
          //else someone else is editing and prevent editing
          if(lock && lockedStatus.lockData.attribute_lock.owner){
            setReadOnly(false)
            //Add changed value from db if there has been changes
            setSelectValue(lockedStatus.lockData.attribute_lock.field_data)
            //Change styles from FormField
            lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
          }
          else{
            setReadOnly(true)
            setFieldName(identifier)
            //Change styles from FormField
            lockField(lockedStatus,lockedStatus.lockData.attribute_lock.owner,identifier)
          }
        }
      }
    }
  }, [lockedStatusJsonString]);

  useEffect(() => {
    if (!saving && isInstanceSaving) {
      setIsInstanceSaving(false);
    }
  }, [saving]);

  useEffect(() => {
    oldValueRef.current = input.value;
    setSelectValues(input.value);
    return () => {

    };
  }, [])

  const getLabel = value => {
    const current = options && options.find(option => option.value === value)
    if (current && current.label && current.label !== ' ') {
      return current.label
    } else {
      return value
    }
  }
  let currentSingleValue

  if(!readonly){
    if (multiple) {
      if (isArray(input?.value)) {
        const val = uniq(input.value);
        val.forEach(value =>
          currentValue.push({ key:value.toString(), label: getLabel(value), value: value })
        )
      } else {
        const val = uniq(input.value);
        currentValue.push(val)
      }
    } else {
      const current = options && options.find(option => option.value === input.value)
  
      if (current) {
        currentSingleValue = {
          label: current && current.label,
          value: current && current.value
        }
      } else {
        currentSingleValue = {
          label: input.value,
          value: input.value
        }
      }
    }
  }

  if (autofillRule){
    input.value = getFieldAutofillValue(autofillRule, formValues, fieldName, formName)
  }

  const handleFocus = () => {
    if (typeof onFocus === 'function' && !insideFieldset) {
      //Sent a call to lock field to backend
      onFocus(input.name);
    }
  }

  const handleBlur = () => {
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
    if (typeof lockField === 'function' && !insideFieldset) {
      //Send identifier data to change styles from FormField.js
      lockField(false,false,identifier)
    }
    
    if (typeof handleUnlockField === 'function' && !insideFieldset && 
      lockedStatus.lockData.attribute_lock.owner) {
      //Sent a call to unlock field to backend
      handleUnlockField(input.name)
    }
    if (selectValues !== oldValueRef.current) {
      //prevent saving if locked
      if (!readonly) {
        if (typeof onBlur === 'function') {
          setIsInstanceSaving(true);
          //Sent call to save changes
          onBlur();
          oldValueRef.current = selectValues;
        }
      }
    }
    if(rollingInfo){
      setEditField(false)
    }
    setFieldName("")
  }

  const setSelectValue = (dbValue) => {
    if(!isEqual(oldValueRef.current,dbValue)){
      input.onChange(dbValue, input.name)
    }
  }

  const handleInputChange = useCallback((val) => {
    if(!readonly){
      input.onChange(val, input.name)
    }
  }, [input.name, input.value]);

  const editRollingField = () => {
    setEditField(true)
  }

  const getPreparedOptions = (options) => {
    const filtered = options
      ? options.filter(option => option.label && option.label.trim() !== '')
      : [];
    const seenLabels = new Set();
    return filtered.map(option => {
      if (!option) return option;
      let label = option.label;
      if (seenLabels.has(label)) {
        label = label + MORE_LABEL;
      }
      seenLabels.add(label);
      return { ...option, label };
    });
  }

  const getRollingInfoValue = (multiple, currentValue, input, preparedOptions) => {
    if (multiple && currentValue.length) {
    // Show option texts instead of value ids on multi select for RollingInfo
    return currentValue?.map(c => c.label);
    } else if (input.name === "vastuuhenkilo_nimi_readonly") {
      // Formatted separately in RollingInfo
      return input.value;
    } else {
      return preparedOptions.reduce(
        (info_value, option) =>
          option.key === input.value ? option.label : info_value,
        input.value
      );
    }
  }

  const normalOrRollingElement = () => {
    let preparedOptions = !readonly ? getPreparedOptions(options) : options;
    let notSelectable = readonly === true && fieldName === input.name
    let readOnlyStyle = notSelectable ? 'selection readonly' : 'selection'
    let rollingInfoValue = getRollingInfoValue(multiple, currentValue, input, preparedOptions);

    const identifier =
    lockedStatus?.lockData?.attribute_lock?.field_identifier ??
    lockedStatus?.lockData?.attribute_lock?.attribute_identifier ??
    "";
    //Render rolling info field or normal edit field
    //If clicking rolling field button makes positive lock check then show normal editable field
    //Rolling field can be nonEditable
    const elements = nonEditable || rollingInfo && !editField ?
      <RollingInfo
        name={input.name} 
        value={rollingInfoValue}
        nonEditable={nonEditable}
        modifyText={modifyText}
        rollingInfoText={rollingInfoText}
        editRollingField={editRollingField}
        type={"select"}
        phaseIsClosed={phaseIsClosed}
      />
      :
      <div className="select-input-wrapper">
      {!multiple ? (
        <Select
          data-testid="select-single"
          placeholder={placeholder}
          className={readOnlyStyle}
          id={input.name}
          multiselect={false}
          error={inputUtils.hasError(error)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          clearable={false}
          disabled={disabled || editDisabled || (isProjectTimetableEdit && !timetable_editable)}
          options={preparedOptions}
          value={currentSingleValue}
          onChange={data => {
            if(!notSelectable){
              let returnValue = data ? data.value : null
              if (returnValue === '') {
                returnValue = null
              }
              setSelectValues(returnValue)
              handleInputChange(returnValue)
            }
          }}
        />
        ) : (
        <Select
          data-testid="select-multi"
          placeholder={placeholder}
          className={readOnlyStyle}
          id={input.name}
          name={input.name}
          multiselect={multiple}
          error={error}
          onBlur={handleBlur}
          onFocus={handleFocus}
          clearable={true}
          disabled={disabled || editDisabled || (isProjectTimetableEdit && !timetable_editable)}
          options={preparedOptions}
          defaultValue={currentValue}
          onChange={data => {
            if(!notSelectable){
              let uniqData = uniqBy(data, 'key');
              let returnValue = uniqData && uniqData.map(currentValue => currentValue.value)
              setSelectValues(uniqData)
              handleInputChange(returnValue)
            }
          }}
        />
        )}

        {saving && isInstanceSaving && (
          <div className={`select-spinner-overlay ${multiple ? 'multi' : 'single'}`}>
            <LoadingSpinner className="loading-spinner" />
          </div>
        )}
      </div>
    return elements
  }

  return (
    normalOrRollingElement()
  )
}

SelectInput.propTypes = {
  input: PropTypes.object.isRequired,
  options: PropTypes.array.isRequired
}

export default SelectInput
