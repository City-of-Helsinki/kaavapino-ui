import React, { useState, useRef, useEffect } from 'react'
import { TextInput } from 'hds-react'
import isUrl from 'is-url'
import ipRegex from 'ip-regex'
import { IconCross, IconCheck, Button, IconLink } from 'hds-react'
import { useTranslation } from 'react-i18next';
import RollingInfo from '../input/RollingInfo'

const Link = props => {
  const openLink = () => window.open(currentValue)

  const {t} = useTranslation()

  const [currentValue, setCurrentValue] = useState(props.input.value)
  const [editField,setEditField] = useState(false)
  const isValid = value => isUrl(value) || ipRegex({ exact: true }).test(value)

  const multipleLinks = props.type === 'select-multiple'

  const isLinkValid = currentValue && isValid(currentValue)

  const oldValueRef = useRef('');

  useEffect(() => {
    oldValueRef.current = props.input.value;
  }, [])

  const onBlur = (event) => {
    if (isLinkValid) {
      if(event.target.value !== oldValueRef.current){
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
        isCurrentPhase={props.isCurrentPhase}
        selectedPhase={props.selectedPhase}
      />
      :    
      <div className="link-container">
        <TextInput
          {...props}
          onBlur={onBlur}
          type="text"
          value={currentValue}
          error={props.error}
          onChange={onChange}
          className={!isLinkValid && currentValue && !multipleLinks ? 'error' : ''}
          aria-label="link"
        />
        {!multipleLinks && (
        <Button
          className="link-button"
          disabled={!isLinkValid}
          iconLeft={<IconLink />}
          onClick={openLink}
        >
          {t('project.add')}
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
    
    return elements
  }

  return (
    normalOrRollingElement()
  )
}

export default Link
