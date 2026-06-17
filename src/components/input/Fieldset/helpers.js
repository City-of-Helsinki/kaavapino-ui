import { get, startCase } from 'lodash';

const buildAddButtonMessage = ({ isNetworkError, isConnectionRestored, hasChildError, t }) => {
  if (isNetworkError) {
    return (
      <div className="network-error-state" aria-live="polite" aria-atomic="true">
        <div className="error-text">
          <div className="notification-content">
            <span className="notification-label">{t('messages.network-save-failed-label')}</span>
            <br />
            <span className="notification-message">{t('messages.network-save-failed-message-brief')}</span>
          </div>
        </div>
      </div>
    );
  }
  if (isConnectionRestored) {
    return (
      <div className="network-error-state" aria-live="polite" aria-atomic="true">
        <div className="success-text fade-in">
          <div className="notification-content">
            <span className="notification-label">{t('project.fieldset-connection-restored-label')}</span>
          </div>
        </div>
      </div>
    );
  }
  if (hasChildError) {
    return <div className="error-text add-error">{t('project.error-prevent-add')}</div>;
  }
  return null;
}

const getCorrectValueType = (values, valueNameKey) => {
  for (const [key, value] of Object.entries(values)) {
    if (key === valueNameKey) {
      const regex = /^[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+$/;
      if (regex.test(value)) {
        for (const [k, v] of Object.entries(values)) {
          if (k.includes("_sahkoposti")) {
            //Extract name from email in data
            //Name info in data is ID value for api
            let fieldsetHeader = v?.split('@')[0];
            fieldsetHeader = fieldsetHeader?.split('.')?.join(" ");
            fieldsetHeader = startCase(fieldsetHeader);
            return fieldsetHeader;
          }
        }
      }
      if (value?.ops) {
        let richText = [];
        let val = value?.ops;
        if (Array.isArray(val)) {
          for (const element of val) {
            richText.push(element.insert);
          }
        }
        return richText.toString();
      }
      else if (value?.description) {
        return value.description;
      }
      else if (value?.name) {
        return value.name.toString();
      }
      else {
        return (Object.prototype.toString.call(value) === "[object Object]") ? null : value;
      }
    }
  }
};

const getValueName = (values, fields, t) => {
  //Name for fieldset is always the first value, should be set that way in Excel for fieldsets
  let valueNameKey;
  let valueType;
  if (values) {
    fields.some((field) => {
      if (field.fieldset_index !== null) {
        valueNameKey = field.name?.toString();
        return true;
      }
    });
    valueType = getCorrectValueType(values, valueNameKey);
  }

  return valueType || <span className='italic'>{t('project.fieldset-missing-value')}</span>;
};

const getNumberOfFieldsets = (fieldsetTotal, formValues, name, t) => {
  const fieldName = get(formValues, name);
  const fieldsLength = fieldName?.filter(i => i?._deleted !== true);
  const count = fieldsLength?.length || 0;
  if (count === 0) {
    const label = fieldsetTotal?.split(/\s+/)[0]?.toLowerCase() || '';
    return t('project.fieldset-empty', { label });
  }
  return fieldsetTotal.replace('{{kpl}}', count);
}

const getAccordionButtonClassName = (shouldDisableAccordion, isOpen, hasError) => {
  if (shouldDisableAccordion) return "accordion-button-disabled";
  if (isOpen) return "accordion-button-open";
  if (hasError) return "accordion-button accordion-button-error";
  return "accordion-button";
}

export { buildAddButtonMessage, getValueName, getNumberOfFieldsets, getAccordionButtonClassName };