import React, { useState, useRef, useEffect } from 'react'
import { connect, useDispatch } from 'react-redux'
import { checkingSelector, savingSelector, formErrorListSelector, lastSavedSelector, updateFieldSelector} from '../../selectors/projectSelector'
import CustomField from './CustomField.jsx'
import { Form, Label, Popup } from 'semantic-ui-react'
import projectUtils from '../../utils/projectUtils'
import Info from './Info.jsx'
import { showField } from '../../utils/projectVisibilityUtils'
import { has, get, startCase } from 'lodash'
import { Button, IconLock, IconClock, IconPlus, IconTrash, IconAngleDown, IconAngleUp, LoadingSpinner } from 'hds-react'
import { change } from 'redux-form'
import { useTranslation } from 'react-i18next';
import { OutsideClick } from '../../hooks/OutsideClick'
import {getAttributeData} from '../../actions/projectActions'
import { useIsMount } from '../../hooks/IsMounted'
import PropTypes from 'prop-types'
import './Input.scss'

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
  visibleErrors,
  lastSaved,
  updateField,
  phaseIsClosed,
  fieldsetTotal,
  isTabActive
}) => {
  const handleBlur = () => {
    onBlur()
  }

  const dispatch = useDispatch()
  const { t } = useTranslation()
  const isMount = useIsMount()
  const accordianRef = useRef(null)

  const nulledFields = fields && fields.map(field => {
    return { [field.name]: null, _deleted: true }
  })

  const [hiddenIndex, setHiddenIndex] = useState(-1)
  const [expanded, setExpanded] = useState([])
  const [adding,setAdding] = useState(false)

  const [hiding,setHiding] = useState(false)
  const [currentFieldset,setCurrentFieldset] = useState(false)

  const refreshFieldset = () => {
    //Fetch fieldset data from backend and see if there is new sub fieldset or data changes before adding new sub fieldset
    //After completed fetch useEffect adds new sub fieldset to updated last fieldset index and saves
    setAdding(true)
    setCurrentFieldset(name)
    dispatch(getAttributeData(attributeData?.projektin_nimi,name))
  }

  const hideFieldset = (formName, set, nulledFields,i) => {
    setHiding(true)
    dispatch(getAttributeData(attributeData?.projektin_nimi,name,formName, set, nulledFields,i))
  }

  useEffect(() => {
    if(lastSaved?.status === "error"){
      //Unable to lock fields and connection backend not working so prevent editing
      setExpanded([])
    }
  }, [lastSaved?.status === "error"])
 
  useEffect(() => {
    if(!isMount){
      if(updateField?.fieldName === name && adding){
        //Add new fieldset to last index after fetching latest fieldset data
        setCurrentFieldset(name)
        sets.push({})
        handleBlur()
        handleOutsideClick()
        setAdding(false)
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
    if (!saving) {
      setCurrentFieldset(false)
    }
  }, [saving])

  const checkLocked = (e,set,i) => {
    //Fetch fieldset data from backend and see if there is new sub fieldset or data changes
    dispatch(getAttributeData(attributeData?.projektin_nimi,name,formName, set, nulledFields,i))

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

   const handleOutsideClick = () => {
    const lockedField = lockStatus.fieldIdentifier
    //close all accordians and unlock locked field when clicked outside fieldset main
    setExpanded([]);
    if (lockStatus.owner) {
      handleUnlockField(lockedField)
    }
  }

  const getNumberOfFieldsets = (fieldsetTotal) => {
   let fieldText = fieldsetTotal
   const fieldName = get(formValues, name)
   let fieldsLength = fieldName?.filter( i => i?._deleted !== true );
   fieldText = fieldText.replace("{{kpl}}", fieldsLength?.length || 0)
   return fieldText 
  }

  OutsideClick(accordianRef, handleOutsideClick)

  const getCorrectValueType = (values,valueNameKey) => {
    for (const [key, value] of Object.entries(values)) {
      if(key === valueNameKey){
        const regex = /^[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+$/;
        if(regex.test(value)){
          for (const [k, v] of Object.entries(values)) {
            if(k.includes("_sahkoposti")){
              //Extract name from email in data
              //Name info in data is ID value for api
              let fieldsetHeader = v?.split('@')[0]
              fieldsetHeader = fieldsetHeader?.split('.')?.join(" ")
              fieldsetHeader = startCase(fieldsetHeader)
              return fieldsetHeader
            }
          }
        }
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
        else if (value?.description){
          return value.description
        }
        else if(value?.name){
          return value.name.toString()
        }
        else {
          return (Object.prototype.toString.call(value) === "[object Object]") ? null : value
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
      <div className='fieldset-info'>{fieldsetTotal ? getNumberOfFieldsets(fieldsetTotal) : ""}</div>
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
                <button type="button" tabIndex={0} className={saving || hiding || adding ? "accordion-button-disabled" : expanded.includes(i) ? "accordion-button-open" : "accordion-button"} onClick={(e) => {if(!(saving || hiding || adding)){checkLocked(e,set,i)}}}>
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

                  let title = field.character_limit
                    ? t('project.fieldset-title', { label: field.label, max: field.character_limit })
                    : field.label
                  title += field?.required ? '*' : ''
                  const error = syncronousErrors && syncronousErrors[field.name]

                  /* Two ways to bring errors to FormField component:
                   * 1) the missing attribute data of required fields is checked automatically.
                   * 2) error text can be given directly to the component as props.
                   * Redux form gives error information to the Field component, but that's further down the line, and we need that information
                   * here to modify the input header accordingly. */
                  const showError = required ? t('project.required-field') : error
                  const fieldUpdated = updated?.new_value && has(updated?.new_value[0], field.name)
                  let fieldRollingInfo
                  let rollingInfoText = "Tieto siirtyy vaiheiden välillä ja sitä voi täydentää"
                  let nonEditable = false

                  if(field?.categorization.includes("katsottava tieto") || field?.categorization.includes("päivitettävä tieto")){
                    fieldRollingInfo = true
                  }
                  else{
                    fieldRollingInfo = false
                  }

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
                              <Info content={field.help_text} link={field.help_link} linked={field.linked_fields} help_img_link={field.help_img_link}/>
                            )}
                          </div>
                        </div>
                        <CustomField
                          field={{ ...field, name: currentName, disabled: disabled || hiding || saving || adding, automatically_added }}
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
                          checkLocked={(e) => {checkLocked(e,set,i)}}
                          lockField={lockField}
                          unlockAllFields={unlockAllFields}
                          validate={validate}
                          fieldSetDisabled={fieldsetDisabled}
                          insideFieldset={true}
                          rollingInfo={fieldRollingInfo}
                          modifyText={t('project.modify')}
                          rollingInfoText={rollingInfoText}
                          nonEditable={nonEditable}
                          phaseIsClosed={phaseIsClosed}
                          isTabActive={isTabActive}
                        />
                        {showError && <div className="error-text">{showError}</div>}
                        {assistiveText && <div className='assistive-text'>{assistiveText}.</div>}
                      </Form.Field>
                    </div>
                  )
                })}
                {(!disable_fieldset_delete_add && !automatically_added && !disabled) && (
                  <Button
                    className={`${fieldsetDisabled || saving ? 'fieldset-button-remove-disabled' : 'fieldset-button-remove'} ${hiding ? ' hidden' : ''}`}
                    disabled={sets.length < 1 || disabled || fieldsetDisabled || saving}
                    variant="secondary"
                    size='small'
                    iconLeft={<IconTrash/>}
                    onClick={() => {
                      hideFieldset(formName, set, ...nulledFields,i)
                    }}
                  > {t('project.remove')}</Button>
                )}
                {hiding && (
                <div className="fieldset-spinner-remove">
                  <LoadingSpinner className="loading-spinner" />
                  {t('project.deleting')}
                </div>
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
            refreshFieldset()
          }}
          disabled={disabled || visibleErrors.length > 0 || saving}
          variant="supplementary"
          size='small'
          fullWidth={true}
          iconLeft={
          (currentFieldset === name) && adding ? (
            <div className="fieldset-spinner-button">
              <LoadingSpinner className="loading-spinner" />
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
        {(currentFieldset === name) && saving
         ? (
           <div className='fieldset-saving-notification'>
             <div className="fieldset-spinner">
               <LoadingSpinner className="loading-spinner" />
             </div>
             {t('project.saving')}
           </div>
         )
         : <></>}
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
  lastSaved: lastSavedSelector(state),
  updateField: updateFieldSelector(state)
})

FieldSet.propTypes = {
  unlockAllFields:PropTypes.func,
  saving: PropTypes.bool,
  fields: PropTypes.array,
  lastSaved: PropTypes.object,
  updateField: PropTypes.bool,
  attributeData: PropTypes.object,
  updated: PropTypes.object,
  phaseIsClosed: PropTypes.bool,
  lockStatus: PropTypes.object,
  isTabActive: PropTypes.bool
}

export default connect(mapStateToProps)(FieldSet)
