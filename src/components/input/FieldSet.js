import React, { useState, useRef, useEffect } from 'react'
import { connect, useDispatch } from 'react-redux'
import { checkingSelector, savingSelector, formErrorListSelector, lastSavedSelector } from '../../selectors/projectSelector'
import CustomField from './CustomField'
import { Form, Label, Popup } from 'semantic-ui-react'
import projectUtils from '../../utils/projectUtils'
import Info from './Info'
import { showField } from '../../utils/projectVisibilityUtils'
import { has } from 'lodash'
import { Button, IconLock, IconClock, IconPlus, IconTrash, IconAngleDown, IconAngleUp } from 'hds-react'
import { change } from 'redux-form'
import { get } from 'lodash'
import { useTranslation } from 'react-i18next';
import { OutsideClick } from '../../hooks/OutsideClick'
import PropTypes from 'prop-types'

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
  rollingInfo,
  saving,
  visibleErrors,
  lastSaved
}) => {
  const handleBlur = () => {
    onBlur()
  }
  
  const dispatch = useDispatch()

  const { t } = useTranslation()

  const [hiddenIndex, setHiddenIndex] = useState(-1)
  const [expanded, setExpanded] = useState([]);
  const accordianRef = useRef(null)

  useEffect(() => {
    if(lastSaved?.status === "error"){
      //Unable to lock fields and connection backend not working so prevent editing
      setExpanded([]);
    }
  }, [lastSaved?.status === "error"])

  const checkLocked = (e,set,i) => {
    let expand = false
    //Change expanded styles if close button or accordian heading element is clicked
    const substrings = ["fieldset-accordian-close","accordion-button"];
    if (substrings.some(v => e?.target?.className?.includes(v))) {
        expand = true
    }
    
    if(expand && lastSaved?.status !== "error"){
      //Expand or close element that was clicked inside fieldset array of elements
      //Prevent focus and editing to field if not locked
      let expandedArray = expanded.slice();
      if(expandedArray.includes(i)){
        expandedArray.splice(expandedArray.indexOf(i), 1);
        handleUnlockField(set)
      }
      else{
        //Close other accordians and open latest
        expandedArray = [i];
        //check is someone else editing the fieldset or lock it to this user
        handleLockField(set)
      }
      setExpanded(expandedArray);
    }

  }

  const nulledFields =
    fields &&
    fields.map(field => {
      return { [field.name]: null, _deleted: true }
  })

   const handleOutsideClick = () => {
    //close all accordians when clicked outside fieldset main
    setExpanded([]);
    unlockAllFields()
  }

  const getNumberOfFieldsets = () => {
   const fieldName = get(formValues, name)
   let fieldsLength = fieldName?.filter( i => i?._deleted !== true );
   return fieldsLength?.length || 0 
  }

  OutsideClick(accordianRef, handleOutsideClick)

  const getCorrectValueType = (values,valueNameKey) => {
    for (const [key, value] of Object.entries(values)) {
      if(key === valueNameKey){
        if(value?.ops){
          let richText = []
          let val = value?.ops
          if(Array.isArray(val)){
            for (let i = 0; i < val.length; i++) {
              richText.push(val[i].insert);
            }
          }
          return richText.toString()
        }
        else if(value?.name){
          if(value?.description){
            return value.description
          }
          return value.name.toString()
        }
        else {
          return value
        }
      }
    }
  }

  const getValueName = (values,fields) => {
    //Name for fieldset is always the first value, should be set that way in Excel for fieldsets
    let valueNameKey
    let valueType
    if(values){
      fields.some((field) => {
        if (field.fieldset_index !== null) {
          valueNameKey = field.name?.toString()
          return true;
        }
      })
      valueType = getCorrectValueType(values,valueNameKey)
    }

    return valueType || <span className='italic'>Tieto puuttuu</span>
  }

  return (
    <div className='fieldset-main-container' ref={accordianRef}>
    <React.Fragment>
      <div className='fieldset-info'>{t('project.fieldset-info', { fieldAmount: getNumberOfFieldsets() })}</div>
      {sets.map((set, i) => {
        const setValues = get(formValues, set)
        const fieldsetDisabled = lockStatus?.lockStyle && !lockStatus?.owner && lockStatus?.fieldIdentifier === set ? true : false;
        const deleted = get(formValues, set + '._deleted')
        const automatically_added = get(formValues, set + '._automatically_added')
        const lockedElement = fieldsetDisabled ? <span className="input-locked"> Käyttäjä {lockStatus.lockStyle.lockData.attribute_lock.user_name} {lockStatus.lockStyle.lockData.attribute_lock.user_email} on muokkaamassa kenttää<IconLock></IconLock></span> : <></>
        const lockName = <><span className='accoardian-header-text'>{getValueName(setValues,fields)}</span> {lockedElement}</>
        return (
          <React.Fragment key={`${name}-${i}`}>
            {!deleted && hiddenIndex !== i && (
              <div key={i} className="fieldset-container">
                <button type="button" tabIndex={0} className={!saving ? expanded.includes(i) ? "accordion-button-open" : "accordion-button" : "accordion-button-disabled"} onClick={(e) => {if(!saving){checkLocked(e,set,i)}}}>
                  <div className='accordion-button-content'>
                    {lockName}
                  </div>
                  {expanded.includes(i) ? <IconAngleUp size='s'/> : <IconAngleDown size='s'/>}
                </button>
                <div className={expanded.includes(i) ? 'fieldset-accordian-open' : 'fieldset-accordian'}>
                {fields.map((field, j) => {
                  const currentName = `${set}.${field.name}`
                  if (
                    !showField(field, formValues, currentName) ||
                    !field.fieldset_index
                  ) {
                    return null
                  }

                  let required = false

                  const isReadOnly = field && field.autofill_readonly
                  if (checking && !(!attributeData[name] || !attributeData[name][i])) {
                    if (
                      checking &&
                      projectUtils.isFieldMissing(
                        field.name,
                        field.required,
                        attributeData[name][i]
                      )
                    ) {
                      required = true
                    }
                  } else if (checking && field.required) {
                    required = true
                  }

                  const title = field.character_limit
                    ? t('project.fieldset-title', { label: field.label, max: field.character_limit })
                    : field.label
                  const error = syncronousErrors && syncronousErrors[field.name]

                  /* Two ways to bring errors to FormField component:
                   * 1) the missing attribute data of required fields is checked automatically.
                   * 2) error text can be given directly to the component as props.
                   * Redux form gives error information to the Field component, but that's further down the line, and we need that information
                   * here to modify the input header accordingly. */
                  const showError = required ? t('project.required-field') : error

                  const fieldUpdated =
                    updated && updated.new_value && has(updated.new_value[0], field.name)

                  let rollingInfoText = "Tieto siirtyy vaiheiden välillä ja sitä voi täydentää"
                  let nonEditable = false
                  if(isReadOnly || field?.display === 'readonly_checkbox'){
                    rollingInfoText = "Tieto on automaattisesti muodostettu"
                    nonEditable = true
                  }
                  const assistiveText = field.assistive_text
                  return (
                    <div
                      className={`input-container ${showError ? 'error' : ''} ${fieldsetDisabled ? 'disabled-fieldset' : ''}`}
                      key={j}
                    >
                      <Form.Field required={required}>
                        <div className="input-header">
                          <Label
                            className={`input-title${required ? ' highlight' : ''} ${showError ? 'error' : ''
                              }`}
                          >
                            {title} 
                            {lockStatus &&(
                              lockStatus.lockStyle && !lockStatus.owner && (
                                  lockStatus.fieldIdentifier && lockStatus.fieldIdentifier === set + "." + field.name &&(
                                  <span className="input-locked"> Käyttäjä {lockStatus.lockStyle.lockData.attribute_lock.user_name} {lockStatus.lockStyle.lockData.attribute_lock.user_email} on muokkaamassa kenttää <IconLock></IconLock></span>
                                  )
                                )
                              )
                            }
                            {/* Temp commented out incase it is decided that this was a good info {lockStatus &&(
                              lockStatus.lockStyle && lockStatus.owner && (
                                  lockStatus.fieldIdentifier && lockStatus.fieldIdentifier === set + "." + field.name &&(
                                  <span className="input-editable">Kenttä on lukittu sinulle <IconLock></IconLock></span>
                                  )
                                )
                              )
                            } */}
                          </Label>
                          <div className="input-header-icons">
                            {fieldUpdated && !isReadOnly && (
                              <Popup
                                trigger={<IconClock />}
                                inverted
                                on="hover"
                                position="top center"
                                hideOnScroll
                                content={
                                  <span className="input-history">
                                    <span>{`${projectUtils.formatDate(
                                      updated.timestamp
                                    )} ${projectUtils.formatTime(updated.timestamp)} ${updated.user_name
                                      }`}</span>
                                  </span>
                                }
                              />
                            )}
                            {field.help_text && (
                              <Info content={field.help_text} link={field.help_link} linked={field.linked_fields}/>
                            )}
                          </div>
                        </div>
                        <CustomField
                          field={{ ...field, name: currentName, disabled, automatically_added }}
                          attributeData={attributeData}
                          fieldset={field.type === 'fieldset'}
                          parentName={name}
                          formName={formName}
                          formValues={formValues}
                          handleSave={handleSave}
                          handleLockField={handleLockField}
                          handleUnlockField={handleUnlockField}
                          onRadioChange={onRadioChange}
                          handleBlurSave={() => {
                            if (onBlur) {
                              handleBlur()
                            }
                          }}
                          lockField={lockField}
                          unlockAllFields={unlockAllFields}
                          validate={validate}
                          fieldSetDisabled={fieldsetDisabled}
                          insideFieldset={true}
                          rollingInfo={rollingInfo}
                          modifyText={t('project.modify')}
                          rollingInfoText={rollingInfoText}
                          nonEditable={nonEditable}
                        />
                        {showError && <div className="error-text">{showError}</div>}
                        {assistiveText && <div className='assistive-text'>{assistiveText}.</div>}
                      </Form.Field>
                    </div>
                  )
                })}
                {(!disable_fieldset_delete_add && !automatically_added && !disabled) && (
                  <Button
                    className={fieldsetDisabled ? 'fieldset-button-remove-disabled' : 'fieldset-button-remove'}
                    disabled={sets.length < 1 || disabled || fieldsetDisabled}
                    variant="secondary"
                    size='small'
                    iconLeft={<IconTrash/>}
                    onClick={() => {
                      dispatch(change(formName, set, ...nulledFields))
                      setHiddenIndex(i)
                      handleBlur()
                    }}
                  > {t('project.remove')}</Button>
                )}
                  <div className='close-accordion-button'>
                    <button className={expanded.includes(i) ? "accordion-button-open" : "accordion-button"}  onClick={(e) => {checkLocked(e,set,i)}}><span>Sulje</span><IconAngleUp onClick={(e) => {checkLocked(e,set,i)}} size='s'/></button>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        )
      })}
      {!disable_fieldset_delete_add && (
      <>
        <Button
          className={`fieldset-button-add ${checking && projectUtils.hasFieldsetErrors(name, fields, attributeData) ? 'fieldset-internal-error' : null
            }`}
          onClick={() => {
            sets.push({})
            handleBlur()
            handleOutsideClick()
          }}
          disabled={disabled || saving || visibleErrors.length > 0}
          variant="supplementary"
          size='small'
          iconLeft={<IconPlus/>}
        >
          {t('project.add')}
        </Button>
        {visibleErrors?.length > 0 ? <div className="error-text add-error">{t('project.error-prevent-add')}</div> : ""}
      </>
      )}
    </React.Fragment>
    </div>
  )
}

const mapStateToProps = state => ({
  checking: checkingSelector(state),
  saving: savingSelector(state),
  visibleErrors:formErrorListSelector(state),
  lastSaved: lastSavedSelector(state)
})

FieldSet.propTypes = {
  rollingInfo: PropTypes.bool,
  unlockAllFields:PropTypes.func,
  saving: PropTypes.bool,
  fields: PropTypes.object,
  lastSaved: PropTypes.object
}

export default connect(mapStateToProps)(FieldSet)
