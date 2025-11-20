import React, { useState, useRef, useEffect } from 'react'
import { TextInput } from 'hds-react'
import isUrl from 'is-url'
import ipRegex from 'ip-regex'
import { IconCross, IconCheck, Button, IconLink } from 'hds-react'
import { useSelector,useDispatch } from 'react-redux'
import { savingSelector } from '../../selectors/projectSelector'
import { useTranslation } from 'react-i18next';
import RollingInfo from '../input/RollingInfo.jsx'
import NetworkErrorState from './NetworkErrorState.jsx'
import { useIsMount } from '../../hooks/IsMounted'
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
  const isValid = value => isUrl(value) || ipRegex({ exact: true }).test(value) || value === "" 

  const multipleLinks = props.type === 'select-multiple'
  const isLinkValid = isValid(currentValue)
  const isMount = useIsMount();

  const oldValueRef = useRef('');

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

  const onBlur = (event) => {
    if (isLinkValid) {
      if(event.target.value !== oldValueRef.current){
        oldValueRef.current = event.target.value;
        setIsInstanceSaving(true);
        props.onBlur()
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
        <div className="link-input-wrapper">
        <TextInput
          {...restProps}
          onBlur={onBlur}
          type="text"
          value={currentValue}
          error={props.error}
          onChange={onChange}
          className={(!isLinkValid && currentValue && !multipleLinks) ? 'error link' : 'link'}
          aria-label="link"
        />
        </div>
        {!multipleLinks && (
        <Button
          className="link-button"
          disabled={!isLinkValid}
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
