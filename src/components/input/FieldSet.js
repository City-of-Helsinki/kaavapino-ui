import React, { useState, useRef } from 'react'
import { connect, useDispatch } from 'react-redux'
import { checkingSelector } from '../../selectors/projectSelector'
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
  unlockAllFields
}) => {

  const handleBlur = () => {
    onBlur()
  }
  
  const dispatch = useDispatch()

  const { t } = useTranslation()

  const [hiddenIndex, setHiddenIndex] = useState(-1)
  const [expanded, setExpanded] = useState([]);
  const accordianRef = useRef(null)

  const checkLocked = (e,set,i) => {
    let expand = false
    //Change expanded styles if close button or accordian heading element is clicked
    const substrings = ["fieldset-accordian-close","accordion-button"];
    if (substrings.some(v => e?.target?.className?.includes(v))) {
        expand = true
    }
    
    if(expand){
      //Expand or close element that was clicked inside fieldset array of elements
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
  }

  OutsideClick(accordianRef, handleOutsideClick)
  //<Accordion className={expanded.includes(i) ? 'fieldset-accordian-open' : 'fieldset-accordian'} closeButtonClassName="fieldset-accordian-close" size="s" card border heading={lockName} language="fi" style={{ maxWidth: '100%' }}>
  return (
    <div className='fieldset-main-container' ref={accordianRef}>
    <React.Fragment>
      <div className='fieldset-info'>Korvataan tämä info excelistä tulevalla datalla</div>
      {sets.map((set, i) => {
        const fieldsetDisabled = lockStatus?.lockStyle && !lockStatus?.owner && lockStatus?.fieldIdentifier === set ? true : false;
        const deleted = get(formValues, set + '._deleted')
        const automatically_added = get(formValues, set + '._automatically_added')
        const lockedElement = fieldsetDisabled ? <span className="input-locked"> Käyttäjä {lockStatus.lockStyle.lockData.attribute_lock.user_name} {lockStatus.lockStyle.lockData.attribute_lock.user_email} on muokkaamassa kenttää<IconLock></IconLock></span> : <></>
        const lockName = <><span className='accoardian-header-text'>{name}</span> {lockedElement}</>
        return (
          <React.Fragment key={`${name}-${i}`}>
            {!deleted && hiddenIndex !== i && (
              <div key={i} className="fieldset-container">
                <button className={expanded.includes(i) ? "accordion-button-open" : "accordion-button"} onClick={(e) => {checkLocked(e,set,i)}}>
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
                              <Info content={field.help_text} link={field.help_link} />
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
                        />
                        {showError && <div className="error-text">{showError}</div>}
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
      <Button
        className={`fieldset-button-add ${checking && projectUtils.hasFieldsetErrors(name, fields, attributeData) ? 'fieldset-internal-error' : null
          }`}
        onClick={() => {
          sets.push({})
          handleBlur()
        }}
        disabled={disabled}
        variant="supplementary"
        size='small'
        iconLeft={<IconPlus/>}
      >
        {t('project.add')}
      </Button>
      )}
    </React.Fragment>
    </div>
  )
}

const mapStateToProps = state => ({
  checking: checkingSelector(state)
})

export default connect(mapStateToProps)(FieldSet)
