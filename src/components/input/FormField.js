import React, {useCallback,useState} from 'react'
import CustomField from './CustomField'
import Matrix from './Matrix'
import { Form, Label, Popup } from 'semantic-ui-react'
import Info from './Info'
import projectUtils from '../../utils/projectUtils'
import { showField } from '../../utils/projectVisibilityUtils'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { IconClock,IconLock } from 'hds-react'
import { withTranslation } from 'react-i18next'
import { isArray } from 'lodash'

const OneLineFields = ['toggle']

const FormField = ({
  field,
  attributeData,
  checking,
  updated,
  formValues,
  syncronousErrors,
  submitErrors,
  formName,
  isFloorCalculation,
  t,
  className,
  handleSave,
  handleLockField,
  handleUnlockField,
  ...rest
}) => {
  const [lockStatus, setLockStatus] = useState({})
  const handleBlurSave = useCallback(() => {
    if (typeof handleSave === 'function') {
      handleSave()
    }
  }, []);

  const lockField = (lockStyle,owner,identifier) => {
    let fieldName = identifier;
    let fieldSetId = "";
    if(lockStyle && lockStyle.lockData.attribute_lock.fieldset_attribute_identifier){
      fieldName = lockStyle.lockData.attribute_lock.fieldset_attribute_identifier;
      fieldSetId = lockStyle.lockData.attribute_lock.field_identifier;
    }
    const status = {
      lockStyle: lockStyle,
      owner: owner,
      identifier:fieldName,
      fieldIdentifier:fieldSetId
    }
    setLockStatus(status)
  }

  const renderField = (newProps) => {
    let newField = field

    if (newProps) {
      newField = newProps
    }
    switch (newField.type) {
      case 'matrix':
        return (
          <Matrix
            field={newField}
            isFloorCalculation={isFloorCalculation}
            attributeData={attributeData}
            formValues={formValues}
            formName={formName}
          />
        )
      default:
        return (
          <CustomField
            {...rest}
            disabled={newField.disabled}
            field={newField}
            attributeData={attributeData}
            className={className}
            fieldset={newField.type === 'fieldset'}
            formName={formName}
            formValues={formValues}
            handleBlurSave={handleBlurSave}
            handleLockField={handleLockField}
            handleUnlockField={handleUnlockField}
            syncronousErrors={syncronousErrors}
            lockField={lockField}
            lockStatus={lockStatus}
          />
        )
    }
  }

  const required =
    checking && projectUtils.isFieldMissing(field.name, field.required, attributeData)

  const isOneLineField = OneLineFields.indexOf(field.type) > -1

  const isReadOnly =
    field && (field.autofill_readonly || field.display === 'readonly_checkbox')

  const isCheckBox =
    field && (field.display === 'checkbox' || field.display === 'readonly_checkbox')

  const isDeadlineInfo = field && field.display === 'readonly'

  const syncError = syncronousErrors && syncronousErrors[field.name]

  let submitErrorText = ''
  if (submitErrors && submitErrors[field.name]) {
    const submitErrorObject = submitErrors[field.name]

    if (isArray(submitErrorObject)) {
      submitErrorObject.forEach(
        errorText => (submitErrorText = submitErrorText + errorText)
      )
    }
  }

  const error = submitErrorText ? submitErrorText : syncError

  const renderCheckBox = () => {
    const newProps = {
      ...field,
      type: 'checkbox'
    }
    return (
      <Form.Field
        className={`checkbox-container small-margin'} ${showError ? 'error' : ''}`}
      >
        <Label>
          <span className="checkbox">{renderField(newProps)}</span>
        </Label>
      </Form.Field>
    )
  }

  const renderOnHoldCheckbox = () => {
    const newProps = {
      ...field,
      type: 'checkbox-onhold'
    }
    return (
      <Form.Field
        className={`checkbox-container small-margin'} ${showError ? 'error' : ''}`}
      >
        <Label>
          <span className="checkbox">{renderField(newProps)}</span>
        </Label>
      </Form.Field>
    )
  }

  const renderDeadlineInfoField = () => {
    const newProps = {
      ...field,
      type: 'readonly'
    }
    return renderField(newProps)
  }

  const renderNormalField = () => {
    const status = lockStatus
    const title = field.character_limit
      ? `${field.label}  ${t('project.char-limit', { amount: field.character_limit })}`
      : field.label
    return (
      <Form.Field
        className={`input-container ${isOneLineField ? 'small-margin' : ''} ${
          showError ? 'error' : ''
        }`}
      >
        {!isOneLineField && (
          <div className="input-header">
            <Label
              id={field.name}
              className={`input-title${required ? ' highlight' : ''}`}
            >
              {title}
              {status.lockStyle && !status.owner && (
                !status.fieldIdentifier && status.identifier && status.identifier === field.name &&(
                <span className="input-locked"> Käyttäjä {status.lockStyle.lockData.attribute_lock.user_name} on muokkaamassa kenttää <IconLock></IconLock></span>
                )
                )
              }
              {status.lockStyle && status.owner && (
                !status.fieldIdentifier && status.identifier && status.identifier === field.name &&(
                <span className="input-editable">Kenttä on lukittu sinulle <IconLock></IconLock></span>
                )
                )
              }
            </Label>
            <div className="input-header-icons">
              {updated && !isReadOnly && (
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
                      )} ${projectUtils.formatTime(updated.timestamp)} ${
                        updated.user_name
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
        )}
        {renderField(null)}
        {showError && <div className="error-text">{showError}</div>}
      </Form.Field>
    )
  }
  const renderComponent = () => {
    // Only for project timetable modal
    if (isCheckBox && formName === EDIT_PROJECT_TIMETABLE_FORM) {
      return renderCheckBox()
    }

    // Only for project timetable modal
    if (field.type === 'checkbox-onhold') {
      return renderOnHoldCheckbox()
    }
    // Only for project timetable modal
    if (isDeadlineInfo && formName === EDIT_PROJECT_TIMETABLE_FORM) {
      return renderDeadlineInfoField()
    }
    return renderNormalField()
  }

  /* Two ways to bring errors to FormField component:
   * 1) the missing attribute data of required fields is checked automatically.
   * 2) error text can be given directly to the component as props.
   * Redux form gives error information to the Field component, but that's further down the line, and we need that information
   * here to modify the input header accordingly. */

  const showError = required ? t('project.required-field') : error
  if (!showField(field, formValues) || field.display === 'hidden') {
    return null
  } else {
    return renderComponent()
  }
}

export default withTranslation()(FormField)
