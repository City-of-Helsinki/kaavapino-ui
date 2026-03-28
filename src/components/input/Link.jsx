import React, { useState, useRef, useEffect } from 'react'
import { TextInput } from 'hds-react'
import isUrl from 'is-url'
import ipRegex from 'ip-regex'
import { IconCross, IconCheck, Button, IconLink } from 'hds-react'
import { useSelector,useDispatch } from 'react-redux'
import { savingSelector, lastModifiedSelector, lastSavedSelector, pollingProjectsSelector } from '../../selectors/projectSelector'
import { useTranslation } from 'react-i18next';
import RollingInfo from '../input/RollingInfo.jsx'
import NetworkErrorState from './NetworkErrorState.jsx'
import { useIsMount } from '../../hooks/IsMounted'
import { useFieldPassivation } from '../../hooks/useFieldPassivation'
import {formErrorList} from '../../actions/projectActions'

const Link = props => {
  const openLink = () => {
    try {
      window.open(currentValue);
    }
    catch (e) {
      if (currentValue.includes("pw://")){
        const encoded_URN = "pw://" + currentValue.split("pw://")[1].replace(":", "%3A");
        window.open(encoded_URN);
      } else {
        throw e;
      }
    }
  }

  // destructure props to avoid spreading custom props onto the DOM element
  const {
    lockField,
    fieldData,
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
    ...restProps
  } = props;

  const {t} = useTranslation()
  const dispatch = useDispatch()

  const [currentValue, setCurrentValue] = useState(props.input.value)
  const [editField,setEditField] = useState(false)
  const saving =  useSelector(state => savingSelector(state))
  const lastModified = useSelector(state => lastModifiedSelector(state))
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const pollingProjects = useSelector(pollingProjectsSelector)
  const [isThisFieldSaving, setIsThisFieldSaving] = useState(false)
  const isValid = value => isUrl(value) || ipRegex({ exact: true }).test(value) || value === ""
  
  // Check if other fields have validation errors (UX60.2.5 - passivate fields when error exists)
  // Include connection errors so Links are disabled when ANY field has network error
  const shouldDisableForErrors = useFieldPassivation(props.input.name, { formName: props.meta.form })

  const multipleLinks = props.type === 'select-multiple'
  const isLinkValid = isValid(currentValue)
  const isMount = useIsMount();

  const oldValueRef = useRef('');
  
  // Check if THIS field has network error (network down or lock error)
  // DO NOT include field_error - those are backend validation errors and user must be able to fix them!
  const isThisFieldNetworkError = (lastSaved?.status === 'error' || lastSaved?.status === 'connection_restored') && 
    lastSaved?.fields?.includes(props.input.name);

  useEffect(() => {
    oldValueRef.current = props.input.value;
  }, [])



  useEffect(() => {
    if(!isMount){
      //!ismount skips initial render
      if(!isLinkValid && currentValue){
        dispatch(formErrorList(true,props.input.name))
      }
      else{
        //removes field from error list
        dispatch(formErrorList(false,props.input.name))
      }
    }
  }, [isLinkValid, currentValue])

  useEffect(() => {
    // Reset isThisFieldSaving when saving is complete for this field
    if (isThisFieldSaving && (!saving || lastModified !== props.input.name)) {
      setIsThisFieldSaving(false);
    }
  }, [saving, lastModified, props.input.name, isThisFieldSaving])

  const onBlur = (event) => {
    if (isLinkValid) {
      if(event.target.value !== oldValueRef.current){
        oldValueRef.current = event.target.value;
        setIsThisFieldSaving(true);
        localStorage.setItem("changedValues", props.input.name);
        props.onBlur(props.input.name)
      }
    }
    if(props.rollingInfo){
      setEditField(false)
    }
  }

  const onChange = event => {
    const value = event.target.value
    if (multipleLinks) {
      value && props.input.onChange(value.split(','))
    } else {
      props.input.onChange(value)
    }
    setCurrentValue(value)
  }

  const editRollingField = () => {
    setEditField(true)
  }

  const normalOrRollingElement = () => {
    //Render rolling info field or normal edit field
    //If clicking rolling field button makes positive lock check then show normal editable field
    //Rolling field can be nonEditable
    
    const blurredClass = (isThisFieldSaving || isThisFieldNetworkError) ? ' blurred' : '';
    const networkErrorClass = isThisFieldNetworkError ? ' has-network-error' : '';
    
    const elements = props.nonEditable || props.rollingInfo && !editField ?
      <RollingInfo 
        name={props.input.name} 
        value={currentValue} 
        nonEditable={props.nonEditable}
        modifyText={props.modifyText}
        rollingInfoText={props.rollingInfoText}
        editRollingField={editRollingField}
        type={"link"}
        phaseIsClosed={props.phaseIsClosed}
      />
      :    
      <>
      <div className="link-container">
        <div className={`link-input-wrapper${blurredClass}${networkErrorClass}`}>
        <TextInput
          {...restProps}
          onBlur={onBlur}
          type="text"
          value={currentValue}
          error={props.error}
          onChange={onChange}
          className={(!isLinkValid && currentValue && !multipleLinks) ? 'error link' : 'link'}
          aria-label="link"
          disabled={props.disabled || saving || shouldDisableForErrors || isThisFieldSaving || isThisFieldNetworkError}
        />
        </div>
        {!multipleLinks && (
        <Button
          className="link-button"
          disabled={!isLinkValid || props.disabled || saving || shouldDisableForErrors || isThisFieldSaving || isThisFieldNetworkError}
          iconLeft={<IconLink />}
          onClick={openLink}
        >
          {t('project.open')}
        </Button>
        )}
        {!multipleLinks && currentValue && isLinkValid && (
        <IconCheck className="link-status" size="l" color="green" />
        )}
        {!multipleLinks && !isLinkValid && currentValue && currentValue.length > 0 && (
        <IconCross className="link-status" size="l" color="red" />
        )}
        {!isLinkValid && currentValue && !multipleLinks && (
        <div className="error-text">{t('project.link-is-broken')}</div>
        )}
      </div>
      <NetworkErrorState fieldName={props.input.name} />
      </>
    return elements
  }

  return (
    normalOrRollingElement()
  )
}

export default Link
