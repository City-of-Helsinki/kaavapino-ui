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
import PropTypes from 'prop-types'

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
  unlockAllFields,
  highlightedTag,
  highlightStyle,
  insideFieldset,
  disabled,
  deadlines,
  isProjectTimetableEdit,
  rollingInfo,
  isCurrentPhase,
  selectedPhase,
  phaseIsClosed,
  hasEditRights,
  isTabActive,
  disabledDates,
  lomapaivat,
  dateTypes,
  deadlineSection,
  maxMoveGroup, 
  maxDateToMove,
  groupName,
  visGroups,
  visItems,
  deadlineSections,
  confirmedValue,
  sectionAttributes,
  allowedToEdit,
  timetable_editable,
  isAdmin,
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
    let rollingInfoText = "Tieto siirtyy vaiheiden välillä ja sitä voi täydentää"
    let nonEditable = false
    if(newField?.autofill_readonly || newField.display === 'readonly_checkbox'){
      rollingInfoText = "Tieto on automaattisesti muodostettu"
      nonEditable = true
    }

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
            insideFieldset={insideFieldset}
            hasEditRights={hasEditRights}
          />
        )
      default:
        return (
          <CustomField
            {...rest}
            disabled={typeof newField.disabled === "undefined" ? disabled : newField.disabled}
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
            unlockAllFields={unlockAllFields}
            insideFieldset={insideFieldset}
            deadlines={deadlines}
            isProjectTimetableEdit={isProjectTimetableEdit}
            rollingInfo={rollingInfo}
            modifyText={t('project.modify')}
            rollingInfoText={rollingInfoText}
            nonEditable={nonEditable}
            isCurrentPhase={isCurrentPhase}
            selectedPhase={selectedPhase}
            phaseIsClosed={phaseIsClosed}
            isTabActive={isTabActive}
            disabledDates={disabledDates}
            lomapaivat={lomapaivat}
            dateTypes={dateTypes}
            deadlineSection={deadlineSection}
            maxMoveGroup={maxMoveGroup}
            maxDateToMove={maxDateToMove}
            groupName={groupName}
            visGroups={visGroups}
            visItems={visItems}
            deadlineSections={deadlineSections}
            confirmedValue={confirmedValue}
            sectionAttributes={sectionAttributes}
            allowedToEdit={allowedToEdit}
            isAdmin={isAdmin}
            timetable_editable={timetable_editable}
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

  const isDeadlineInfo = field && field.display === 'readonly' && field.type !== 'choice'

  const syncError = syncronousErrors && syncronousErrors[field.name]

  let submitErrorText = ''
  if (submitErrors && submitErrors[field.name]) {
    const submitErrorObject = submitErrors[field.name]

    if (isArray(submitErrorObject)) {
      submitErrorObject.forEach(
        errorText => {
          // Errors in fieldsets sometimes return as objects within an object...
          if (Object.getPrototypeOf(errorText) === Object.prototype) {
            for (let key in errorText) {
              submitErrorText += Object.values(errorText[key]).join('')
            }
          } else {
            submitErrorText += submitErrorText + errorText
          }
        }
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
    const timetableBoolean = isProjectTimetableEdit && field.type === "boolean"
    const status = lockStatus
    let title = (field.character_limit
      ? `${field.label}  (${t('project.char-limit', { amount: field.character_limit })})`
      : field.label)

    if (field.required || (field?.type === 'fieldset' && projectUtils.isFieldSetRequired(field?.fieldset_attributes))) {
      title += '*'
    }

    const assistiveText = field.assistive_text
    return (
      <>
      <Form.Field
        tabIndex="0"
        className={`input-container ${isOneLineField ? 'small-margin' : ''} ${
          showError ? 'error' : ''
        } ${highlightStyle}`}
      >
        {highlightStyle === "yellow" ? <div className={highlightStyle + " highlight-flag"}>{highlightedTag}</div> : ''}
        {!isOneLineField && !timetableBoolean && (
          <div className='input-header-container'>
            <div className="input-header">
              <Label
                tabIndex="0"
                id={field.name}
                className={`input-title${required ? ' highlight' : ''} ${field.type === "info_fieldset" ? ' hide' : ''}`}
              >
                {title}
                {status.lockStyle && !status.owner && (
                  !status.fieldIdentifier && status.identifier && status.identifier === field.name &&(
                  <span className="input-locked"> Käyttäjä {status.lockStyle.lockData.attribute_lock.user_name} ({status.lockStyle.lockData.attribute_lock.user_email}) on muokkaamassa kenttää <IconLock></IconLock></span>
                  )
                  )
                }
                {/* Commented out for now because uncertainty that should this be used
              {status.lockStyle && status.owner && (
                  !status.fieldIdentifier && status.identifier && status.identifier === field.name &&(
                  <span className="input-editable">Kenttä on lukittu sinulle <IconLock></IconLock></span>
                  )
                  )
                } 
                */}
              </Label>
            </div>
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
              <Info content={field.help_text} link={field.help_link} linked={field.linked_fields} />
            )}
          </div>
        </div>
        )}
        {renderField(null)}
        {showError && <div className="error-text">{showError}</div>}
        {assistiveText && <div className='assistive-text'>{assistiveText}.</div>}
      </Form.Field>
      </>
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

FormField.propTypes = {
  disabled: PropTypes.bool,
  field: PropTypes.object,
  deadlines:PropTypes.array,
  isProjectTimetableEdit:PropTypes.bool,
  rollingInfo:PropTypes.bool,
  isCurrentPhase:PropTypes.bool,
  selectedPhase: PropTypes.number,
  phaseIsClosed: PropTypes.bool,
  isTabActive: PropTypes.bool,
  disabledDates: PropTypes.array,
  lomapaivat: PropTypes.array,
  dateTypes: PropTypes.object,
  deadlineSection: PropTypes.object,
  maxMoveGroup: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  maxDateToMove: PropTypes.string,
  groupName: PropTypes.string,
  visGroups: PropTypes.array,
  visItems: PropTypes.array,
  deadlineSections: PropTypes.array,
  confirmedValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ]),
  sectionAttributes: PropTypes.array
}

export default withTranslation()(FormField)
