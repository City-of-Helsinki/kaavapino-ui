import React from 'react';
import { useSelector } from 'react-redux';
import { Form, Label } from 'semantic-ui-react';
import InputLockedMessage from '../InputLockedMessage.jsx';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { checkingSelector, formErrorListSelector } from '../../../selectors/projectSelector.js';

import CustomField from '../CustomField.jsx';
import NetworkErrorState from '../NetworkErrorState.jsx';
import Info from '../Info.jsx';
import inputUtils from '../../../utils/inputUtils.js';
import projectUtils from '../../../utils/projectUtils.js';
import { showField } from '../../../utils/projectVisibilityUtils.js';

const FieldsetField = ({
  field,
  set,
  attribute,
  name,
  formName,
  formValues,
  attributeData,
  disabled,
  syncError,
  highlightedTag,
  highlightedInFieldset,
  phaseIsClosed,
  isTabActive,
  fieldsetDisabled,
  automatically_added,
  lastSavedChildField,
  isThisFieldsetNetworkError,
  isThisFieldsetConnectionRestored,
  lockStatus,
  handleSave,
  handleLockField,
  handleUnlockField,
  onRadioChange,
  lockField,
  unlockAllFields,
  validate,
  onChildBlurSave,
  onCheckLocked,
}) => {
  const { t } = useTranslation();
  const checking = useSelector(checkingSelector);
  const formErrors = useSelector(formErrorListSelector);
  const savingField = useSelector(state => state.project.savingField);
  const testingConnection = useSelector(state => state.project.testingConnection);
  const currentName = `${set}.${field.name}`;

  if (!showField(field, formValues, currentName) || !field.fieldset_index) {
    return null;
  }

  const isReadOnly = field?.autofill_readonly;

  let required = false;
  if (checking) {
    required = attribute ? projectUtils.isFieldMissing(field.name, field.required, attribute) : !!field.required;
  }

  let title = field.character_limit
    ? t('project.fieldset-title', { label: field.label, max: field.character_limit })
    : field.label;
  title += field?.required ? '*' : '';

  const errorText = required ? t('project.required-field') : syncError;

  const fieldRollingInfo = field?.categorization.includes("katsottava tieto") || field?.categorization.includes("päivitettävä tieto");
  const rollingInfoText = isReadOnly || field?.display === 'readonly_checkbox' ? t('project.rolling-info') : t('project.auto-generated-info');

  const isLastSavedOrErrorField = (lastSavedChildField === currentName || (!lastSavedChildField && formErrors.includes(currentName)));
  const isNetworkErrorField = isThisFieldsetNetworkError && isLastSavedOrErrorField;

  const getLockedFieldComponent = () => {
    if (lockStatus?.lockStyle && !lockStatus?.owner && lockStatus?.fieldIdentifier === currentName) {
      return ( <InputLockedMessage t={t} lockStatus={lockStatus} /> );
    }
    return null;
  };
  const getInputHeader = () => {
    return (
    <div className="input-header">
      <Label className={`input-title${required ? ' highlight' : ''} ${errorText ? 'error' : ''}`}>
        {title}
        {getLockedFieldComponent()}
      </Label>
      <div className="input-header-icons">
        {!isReadOnly && (
          inputUtils.renderUpdatedFieldInfo({ savingField, fieldName: currentName, updated: null, t, isFieldset: false, testingConnection })
        )}
        {field.help_text && (
          <Info content={field.help_text} link={field.help_link} linked={field.linked_fields} help_img_link={field.help_img_link} />
        )}
      </div>
    </div>
    );
  };

  const isHighlighted = field?.field_subroles === highlightedTag && highlightedInFieldset === "yellow";
  const containerClass = `input-container ${errorText || isNetworkErrorField ? 'error' : ''} ${fieldsetDisabled ? 'disabled-fieldset' : ''}`;
  return (
    <div className={containerClass}>
      <Form.Field required={required} className={isHighlighted ? "yellow-fieldset" : ""}>
        {isHighlighted && <div className={"yellow-fieldset" + " highlight-flag"}>{highlightedTag}</div>}
        {getInputHeader()}
        <CustomField
          field={{ ...field, name: currentName, disabled, automatically_added }}
          attributeData={attributeData}
          fieldset={field.type === 'fieldset'}
          formName={formName}
          formValues={formValues}
          handleSave={handleSave}
          handleLockField={handleLockField}
          handleUnlockField={handleUnlockField}
          onRadioChange={onRadioChange}
          handleBlurSave={() => onChildBlurSave(currentName)}
          checkLocked={onCheckLocked}
          lockField={lockField}
          unlockAllFields={unlockAllFields}
          validate={validate}
          fieldSetDisabled={fieldsetDisabled}
          insideFieldset={true}
          rollingInfo={fieldRollingInfo}
          modifyText={t('project.modify')}
          rollingInfoText={rollingInfoText}
          nonEditable={isReadOnly || field?.display === 'readonly_checkbox'}
          phaseIsClosed={phaseIsClosed}
          isTabActive={isTabActive}
          highlightedInFieldset={highlightedInFieldset}
          highlightedTag={highlightedTag}
        />
        {errorText && <div className="error-text">{errorText}</div>}
        {(isThisFieldsetNetworkError || isThisFieldsetConnectionRestored) && isLastSavedOrErrorField && (
          <NetworkErrorState fieldName={name} />
        )}
        {field.assistive_text && <div className='assistive-text'>{field.assistive_text}.</div>}
      </Form.Field>
    </div>
  );
};

FieldsetField.propTypes = {
  field: PropTypes.object.isRequired,
  set: PropTypes.string.isRequired,
  attribute: PropTypes.object,
  name: PropTypes.string.isRequired,
  formName: PropTypes.string.isRequired,
  formValues: PropTypes.object.isRequired,
  attributeData: PropTypes.object,
  disabled: PropTypes.bool,
  syncError: PropTypes.string,
  highlightedTag: PropTypes.string,
  highlightedInFieldset: PropTypes.string,
  phaseIsClosed: PropTypes.bool,
  isTabActive: PropTypes.bool,
  fieldsetDisabled: PropTypes.bool,
  automatically_added: PropTypes.bool,
  lastSavedChildField: PropTypes.string,
  isThisFieldsetNetworkError: PropTypes.bool,
  isThisFieldsetConnectionRestored: PropTypes.bool,
  lockStatus: PropTypes.object,
  handleSave: PropTypes.func.isRequired,
  handleLockField: PropTypes.func.isRequired,
  handleUnlockField: PropTypes.func.isRequired,
  onRadioChange: PropTypes.func.isRequired,
  lockField: PropTypes.func,
  unlockAllFields: PropTypes.func,
  validate: PropTypes.func.isRequired,
  onChildBlurSave: PropTypes.func.isRequired,
  onCheckLocked: PropTypes.func.isRequired,
};

export default FieldsetField;
