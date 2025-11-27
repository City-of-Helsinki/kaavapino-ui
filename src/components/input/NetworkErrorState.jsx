import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { projectNetworkSelector,lastSavedSelector } from '../../selectors/projectSelector';
import { Button, Notification, IconAlertCircle, IconCross } from 'hds-react';
import { useTranslation } from 'react-i18next';
import './NetworkErrorState.scss';
import PropTypes from 'prop-types';

export default function NetworkErrorState({ fieldName }) {
  if (typeof window !== 'undefined' && !window.__clearedIsRelevantField) {
      try {
          localStorage.removeItem('isRelevantField');
      } catch (e) {}
      window.__clearedIsRelevantField = true;
  }
  const network = useSelector(projectNetworkSelector);
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const status = network.status || 'ok';
  const hasError = status === 'error';
  const isSuccess = status === 'success';

  const banner = useMemo(() => {
    if (hasError) {
      return {
        type: 'error',
        label: t('messages.network-save-failed-label'),
        message: network.errorMessage || t('messages.network-save-failed-connection')
      };
    }
    if (isSuccess) {
      return {
        type: 'success',
        label: t('messages.network-connection-restored-label'),
        message: network.okMessage || t('messages.network-connection-restored-message')
      };
    }
    return null;
  }, [hasError, isSuccess, network.errorMessage, network.okMessage]);

  const [showWarning, setShowWarning] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Simple scroll lock for custom dialog
  useEffect(() => {
    if (confirmOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [confirmOpen]);

  const getFieldSetValues = (object) => {
    const arrayValues = [];
    let index = 1;
    for (let i = 0; i < object.length; i++) {
      const fieldsetObject = object[i];
      for (const data in fieldsetObject) {
        if (Object.prototype.hasOwnProperty.call(fieldsetObject, data)) {
          if (fieldsetObject[data]?.ops) {
            const opsArray = fieldsetObject[data].ops;
            for (let j = 0; j < opsArray.length; j++) {
              arrayValues.push('fieldset-' + index);
              arrayValues.push(data + ': ' + opsArray[j].insert);
              index = index + 1;
            }
          }
        }
      }
    }
    return arrayValues;
  };

  let newErrorValue = lastSaved?.values || [];
  let arrayValues = [];

  if (Array.isArray(newErrorValue) && newErrorValue.length > 0) {
    if (newErrorValue[0]?.ops) {
      const opsArray = newErrorValue[0].ops;
      for (let i = 0; i < opsArray.length; i++) {
        arrayValues.push(opsArray[i].insert);
      }
      newErrorValue = arrayValues.toString();
      arrayValues = [];
    }
    else if (typeof newErrorValue[0] === 'object' && newErrorValue[0] !== null) {
      arrayValues = getFieldSetValues(newErrorValue[0]);
    }
  }

  let errorTextValue = arrayValues.length > 0 ? arrayValues : newErrorValue.toString();
  if (errorTextValue.includes('true') || errorTextValue.includes('false')) {
    errorTextValue = errorTextValue === 'true' ? 'Kyllä' : 'Ei';
  } else if (errorTextValue === '') {
    errorTextValue = 'Tieto puuttuu';
  }
  const copyFieldsetValues = arrayValues.map(a => a).join('\n');

  useEffect(() => {
    if (hasError && !showWarning) {
      setShowWarning(true);
    }
  }, [hasError, showWarning]);

  // Limit visibility to fields present in lastSaved.fields when error/success
  const savedFields = Array.isArray(lastSaved?.fields) ? lastSaved.fields : [];
  const storedFieldName = localStorage.getItem('isRelevantField') || null;
  const isRelevantField = fieldName ? savedFields.includes(fieldName) : false;
  const storedRelevant = fieldName ? storedFieldName === fieldName : false;

  useEffect(() => {
    if (hasError && !storedFieldName && isRelevantField) {
        try {
          localStorage.setItem('isRelevantField', fieldName);
        } catch (e) {}
    }
  }, [hasError, storedFieldName, isRelevantField, fieldName]);
  
  const showNotifications = showWarning && (isRelevantField || storedRelevant) && (hasError || isSuccess);

  if (!showNotifications) {
      return null;
  }

  return (
    <div className="network-error-state" aria-live="polite" aria-atomic="true">
      {banner && (
        <Notification
          type={banner.type}
          label={banner.label}
          dismissible={false}
          size="default"
          aria-label={banner.label}
          className={`nes-notification nes-${banner.type}`}
        />
      )}
      {showWarning && (hasError || isSuccess) && (
        <Notification
          type="alert"
          label={t('messages.unsaved-field-warning-label')}
          dismissible={false}
          size="default"
          className="nes-notification nes-warning-notification"
        >
          <div className="nes-warning-notification__content">
            <p className="mb-4">{t('messages.unsaved-field-warning-text1')}</p>
            <p>{t('messages.unsaved-field-warning-text2')}</p>
          </div>
          <div className="nes-warning-notification__actions">
            <Button
              onClick={() => {
                const toCopy = arrayValues.length > 0 ? copyFieldsetValues : errorTextValue;
                navigator.clipboard.writeText(toCopy);
              }}
              size="small"
              variant="primary"
            >
              {t('messages.copy-value')}
            </Button>
            <Button onClick={() => setConfirmOpen(true)} variant="danger">
              {t('messages.close-notification')}
            </Button>
          </div>
        </Notification>
      )}
      {confirmOpen && createPortal(
        <div 
          className="custom-dialog-backdrop"
          onClick={() => setConfirmOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setConfirmOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-dialog-title"
          tabIndex={-1}
        >
          <div 
            className="custom-dialog-content"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="custom-dialog-header">
              <div className="custom-dialog-header-content">
                <IconAlertCircle className="custom-dialog-icon" />
                <h2 id="custom-dialog-title" className="custom-dialog-title">
                  {t('messages.close-notification-question')}
                </h2>
              </div>
              <button
                className="custom-dialog-close"
                onClick={() => setConfirmOpen(false)}
                aria-label={t('common.close')}
                type="button"
              >
                <IconCross size="s" />
              </button>
            </div>
            
            <div className="custom-dialog-body">
              <p>{t('messages.close-notification-warning')}</p>
            </div>
            
            <div className="custom-dialog-actions">
              <Button 
                onClick={() => setConfirmOpen(false)} 
                variant="secondary" 
                className="custom-dialog-cancel"
              >
                {t('messages.cancel-button-text')}
              </Button>
              <Button
                onClick={() => {
                  setConfirmOpen(false);
                  setShowWarning(false);
                  localStorage.removeItem('isRelevantField');
                  dispatch({ type: 'Set network status', payload: { status: 'ok', okMessage: '', errorMessage: '' } });
                }}
                variant="danger"
                className="custom-dialog-confirm"
              >
                {t('messages.close-notification')}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

NetworkErrorState.propTypes = {
	fieldName: PropTypes.string
}