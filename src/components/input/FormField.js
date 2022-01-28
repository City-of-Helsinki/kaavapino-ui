import React from 'react'
import CustomField from './CustomField'
import Matrix from './Matrix'
import { Form, Label, Popup } from 'semantic-ui-react'
import Info from './Info'
import projectUtils from '../../utils/projectUtils'
import { showField } from '../../utils/projectVisibilityUtils'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { IconClock } from 'hds-react'
import { withTranslation} from 'react-i18next';

const OneLineFields = ['toggle']

const FormField = props => {

  const renderField = newProps => {
    const {
      field,
      attributeData,
      formName,
      formValues,
      isFloorCalculation,
      className,
      syncronousErrors,
      ...rest
    } = props
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
            syncronousErrors={syncronousErrors}
            setRef={props.setRef }
          />
        )
    }
  }
  const {
    field,
    attributeData,
    checking,
    updated,
    formValues,
    syncronousErrors,
    submitErrors,
    formName,
    t
  } = props
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
    submitErrorText = submitErrorObject ? submitErrorObject[field.name] : ''
  }

  const error = submitErrorText ? submitErrorText : syncError
  
  /* Two ways to bring errors to FormField component:
   * 1) the missing attribute data of required fields is checked automatically.
   * 2) error text can be given directly to the component as props.
   * Redux form gives error information to the Field component, but that's further down the line, and we need that information
   * here to modify the input header accordingly. */

  const showError = required ? t('project.required-field') : error
  if (!showField(field, formValues) || field.display === 'hidden') {
    return null
  }

  const title = field.character_limit
    ? `${field.label}  ${t('project.char-limit', {amount: field.character_limit})}`
    : field.label

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
    return (
      <Form.Field
        className={`input-container ${isOneLineField ? 'small-margin' : ''} ${
          showError ? 'error' : ''
        }`}
      >
        {!isOneLineField && (
          <div className="input-header">
            <Label id={field.name} className={`input-title${required ? ' highlight' : ''}`}>
              {title}
            </Label>
            <div className="input-header-icons">
              {updated && !isReadOnly && (
                <Popup
                  trigger={<IconClock />}
                  inverted
                  on="hover"
                  position="top center"
                  hideOnScroll
                  content={ (
                    <span className="input-history">
                      <span>{`${projectUtils.formatDate(
                        updated.timestamp
                      )} ${projectUtils.formatTime(updated.timestamp)} ${
                        updated.user_name
                      }`}</span>
                    </span>
                    )
                  }
                />
              )}
              {field.help_text && (
                <Info content={field.help_text} link={field.help_link} />
              )}
            </div>
          </div>
        )}
        {renderField()}
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

  return renderComponent()
}

export default withTranslation()(FormField)
