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
  const entry = Object.entries(values).find(([key, value]) => key === valueNameKey);
  if (!entry) {
    return null;
  }
  const value = entry[1];
  const UUIDregex = /^[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+$/;
  if (UUIDregex.test(value)) {
    const emailValue = Object.entries(values).find(([key, val]) => key.includes("_sahkoposti"))?.[1];
    //Extract name from email in data
    let userName = emailValue?.split('@')[0];
    userName = userName?.split('.')?.join(" ");
    userName = startCase(userName);
    return userName;
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
  if (value?.description) {
    return value.description;
  }
  if (value?.name) {
    return value.name.toString();
  }
  return (Object.prototype.toString.call(value) === "[object Object]") ? null : value;
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

const getFieldsetOrderKey = (item, index) => (Number.isFinite(item?._order) ? item._order : index);

// Returns the array indices of fieldset rows sorted into display order.
const getFieldsetDisplayOrder = (values, length = values?.length ?? 0) =>
  Array.from({ length }, (_, i) => i).sort(
    (a, b) => getFieldsetOrderKey(values?.[a], a) - getFieldsetOrderKey(values?.[b], b) || a - b
  );

// Puts the requested indices first (ignoring any not present in displayOrder),
// followed by the remaining indices in their existing display order.
const applyRequestedOrder = (displayOrder, requestedOrder) => {
  if (!requestedOrder) return displayOrder;
  const requested = requestedOrder.filter((i) => displayOrder.includes(i));
  return [...requested, ...displayOrder.filter((i) => !requested.includes(i))];
};

const moveFieldsetRow = (order, fromPosition, toPosition) => {
  const inRange = (position) => position >= 0 && position < order.length;
  if (fromPosition === toPosition || !inRange(fromPosition) || !inRange(toPosition)) {
    return order;
  }
  const result = order.slice();
  const [moved] = result.splice(fromPosition, 1);
  result.splice(toPosition, 0, moved);
  return result;
};

// Computes the `_order` values needed so that the non-deleted rows of `values` follow `requestedOrder`.
// Returns only the rows whose `_order` changes, as [{ index, order }].
const getFieldsetOrderChanges = (values, requestedOrder) => {
  if (!Array.isArray(values)) return [];
  const visible = getFieldsetDisplayOrder(values).filter((i) => values[i]?._deleted !== true);
  return applyRequestedOrder(visible, requestedOrder)
    .map((index, order) => ({ index, order }))
    .filter(({ index, order }) => values[index]?._order !== order);
};

export {
  buildAddButtonMessage,
  getValueName,
  getNumberOfFieldsets,
  getAccordionButtonClassName,
  getFieldsetDisplayOrder,
  applyRequestedOrder,
  moveFieldsetRow,
  getFieldsetOrderChanges,
};