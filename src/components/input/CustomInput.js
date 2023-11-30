import React, { useCallback, useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { TextInput } from 'hds-react'
import { useDispatch, useSelector } from 'react-redux'
import {updateFloorValues} from '../../actions/projectActions'
import {lockedSelector,lastModifiedSelector } from '../../selectors/projectSelector'
import moment from 'moment'
import { useTranslation } from 'react-i18next'
import RollingInfo from '../input/RollingInfo'
import {useFocus} from '../../hooks/useRefFocus'

const CustomInput = ({ input, meta: { error }, ...custom }) => {
  const [readonly, setReadOnly] = useState({name:"",read:false})
  const [hasError,setHasError] = useState(false)
  const [editField,setEditField] = useState(false)

  const lastModified = useSelector(state => lastModifiedSelector(state))
  const lockedStatus = useSelector(state => lockedSelector(state))

  const [inputRef, setInputFocus] = useFocus()
  const oldValueRef = useRef('');
  const { t } = useTranslation()
  const dispatch = useDispatch()

  useEffect(() => {
    oldValueRef.current = input.value;
    if(custom.type === "date" && !custom.insideFieldset){
      setReadOnly({name:input.name,read:true})
    }
    return () => {

    };
  }, [])

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
  }, [lockedStatus]);

  const handleFocus = () => {
    if (typeof custom.onFocus === 'function' && !lockedStatus?.saving && !custom.insideFieldset) {
      //Sent a call to lock field to backend
      custom.onFocus(input.name);
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
    if (typeof custom.handleUnlockField === 'function' && !custom.insideFieldset) {
      //Sent a call to unlock field to backend
      custom.handleUnlockField(input.name)
    }

    if (event.target.value !== oldValueRef.current) {
      //prevent saving if locked
      if (!readonly) {
        //Sent call to save changes
        if (typeof custom.onBlur === 'function') {
          if(custom.type === "date"){
            //Validate date
            let dateOk = moment(event.target.value, 'YYYY-MM-DD',false).isValid()
            if(dateOk){
              custom.onBlur();
              oldValueRef.current = event.target.value;
            }
          }
          else{
            localStorage.setItem("changedValues", input.name);
            custom.onBlur();
            if(!custom.insideFieldset){
              setReadOnly({name:input.name,read:true})
            }
            oldValueRef.current = event.target.value;
            if(custom.regex){
              const regex = new RegExp(custom.regex);
              setHasError(!regex.test(event.target.value))
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
    if(dbValue && oldValueRef.current !== dbValue){
      input.onChange(dbValue, input.name)
    }
  }

  const handleInputChange = useCallback((event,readonly) => {
    if(!readonly || custom.type === "date"){
      if(!event.target.value?.trim()){
        setHasError(true)
      }
      else{
        setHasError(false)
      }
      input.onChange(event.target.value, input.name)
      if(custom.isFloorAreaForm){
        //Edit floor area model object data with current value and dispatch change for form total value recalculation
        let newObject = custom.floorValue
        newObject[input.name] = Number(event.target.value)
        dispatch(updateFloorValues(newObject))
      }
    }
  }, [input.name, input.value]);

  const editRollingField = () => {
    setEditField(true)
    setTimeout(function(){
      setInputFocus()
    }, 200);
  }


  const normalOrRollingElement = () => {
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
        isCurrentPhase={custom.isCurrentPhase}
        selectedPhase={custom.selectedPhase}
      />
      :    
      <div className={custom.disabled || !inputUtils.hasError(error).toString() || !hasError ? "text-input " : "text-input " +t('project.error')}>
        <TextInput
          ref={inputRef}
          aria-label={input.name}
          error={inputUtils.hasError(error).toString()}
          errorText={custom.disabled || !inputUtils.hasError(error).toString() || !hasError ? "" : t('project.error')}
          fluid="true"
          {...input}
          {...custom}
          onChange={(event) =>{handleInputChange(event,readonly.read)}}
          onBlur={(event) => {handleBlur(event,readonly.read)}}
          onFocus={() => {handleFocus()}}
          readOnly={readonly.read}
        />
      </div>
    
    return elements
  }

  return (
    normalOrRollingElement()
  )
}

CustomInput.propTypes = {
  input: PropTypes.object.isRequired
}

export default CustomInput