import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { projectNetworkSelector, lastSavedSelector } from '../../selectors/projectSelector';
import { Button, Notification, IconAlertCircle } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { getFormInitialValues, getFormValues, change, stopSubmit, untouch } from 'redux-form';
import { setLastSaved, formErrorList } from '../../actions/projectActions';
import { EDIT_PROJECT_FORM } from '../../constants';
import './NetworkErrorState.scss';
import PropTypes from 'prop-types';

export default function NetworkErrorState({ fieldName }) {
  if (typeof window !== 'undefined' && !window.__clearedIsRelevantField) {
      try {
          localStorage.removeItem('isRelevantField');
          localStorage.removeItem('warningManuallyClosed');
      } catch (e) {}
      window.__clearedIsRelevantField = true;
  }
  const network = useSelector(projectNetworkSelector);
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const initialValues = useSelector(state => getFormInitialValues(EDIT_PROJECT_FORM)(state))
  const formValues = useSelector(state => getFormValues(EDIT_PROJECT_FORM)(state))
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const status = network.status || 'ok';
  
  // Simple flag to track if this field ever had a network error
  // READ from localStorage on every render to stay in sync
  const wasNetworkErrorKey = `wasNetworkError_${fieldName}`;
  const wasNetworkError = localStorage.getItem(wasNetworkErrorKey) === 'true';
  
  const hasError = status === 'error' || lastSaved?.status === 'field_error';
  const isSuccess = status === 'success' || lastSaved?.status === 'connection_restored';

  const banner = useMemo(() => {
    // IMPORTANT: Check isSuccess FIRST before hasError!
    // When connection is restored after error, both isSuccess and hasError can be true
    // (hasError stays true because storedNetworkError persists until user closes warning)
    // We want to show SUCCESS banner in this case, not error banner
    if (isSuccess) {
      return {
        type: 'success',
        label: t('messages.network-connection-restored-label'),
        message: network.okMessage || t('messages.network-connection-restored-message')
      };
    }
    if (hasError) {
      // Differentiate between field validation error and network error
      const isFieldValidationError = lastSaved?.status === 'field_error';
      return {
        type: 'error',
        label: t('messages.network-save-failed-label'),
        message: isFieldValidationError 
          ? t('messages.field-validation-error') || 'Kentän arvo ei ole kelvollinen'
          : (network.errorMessage || t('messages.network-save-failed-connection'))
      };
    }
    return null;
  }, [hasError, isSuccess, network.errorMessage, network.okMessage, lastSaved?.status, t]);

  const [showWarning, setShowWarning] = useState(true);
  const [showNetworkWarning, setShowNetworkWarning] = useState(wasNetworkError); // Separate state for network errors
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Sync showNetworkWarning with localStorage on mount and when wasNetworkError changes
  useEffect(() => {
    if (wasNetworkError && !showNetworkWarning) {
      setShowNetworkWarning(true);
    }
  }, [wasNetworkError, showNetworkWarning]);

  // Track when a network error occurs for this field
  useEffect(() => {
    if (lastSaved?.status === 'error') {
      const savedFields = Array.isArray(lastSaved?.fields) ? lastSaved.fields : [];
      const isThisFieldAffected = fieldName ? savedFields.includes(fieldName) : false;
      
      if (isThisFieldAffected) {
        try {
          localStorage.setItem(wasNetworkErrorKey, 'true');
        } catch (e) {}
        setShowNetworkWarning(true); // Show network warning when error occurs
      }
    }
  }, [lastSaved?.status, fieldName, lastSaved?.fields, wasNetworkErrorKey]);

  // Show connection restored notification when save succeeds after network error
  useEffect(() => {
    const hadNetworkError = wasNetworkError; // Read directly from localStorage on each render
    const isConnectionRestored = lastSaved?.status === 'success' || lastSaved?.status === 'connection_restored';
    
    if (hadNetworkError && isConnectionRestored) {
      try {
        localStorage.setItem('isRelevantField', fieldName);
      } catch (e) {}
    }
  }, [lastSaved?.status, fieldName, wasNetworkError]);

  // Auto-hide "connection restored" banner after 5 seconds
  // Note: Don't clear localStorage here - let the warning notification stay until user closes it
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        dispatch({ type: 'Reset network status' });
        // Also clear lastSaved status to fully hide the success banner
        dispatch(setLastSaved('', null, [], [], false));
        // Don't clear isRelevantField or warningManuallyClosed here
        // The yellow warning box should stay visible until user clicks "Sulje ilmoitus"
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, dispatch]);

  // Simple scroll lock for custom dialog
  useEffect(() => {
    if (confirmOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [confirmOpen]);

  // Simple warning logic for validation errors only
  useEffect(() => {
    if (lastSaved?.status === 'field_error' && !showWarning) {
      setShowWarning(true);
    } else if (lastSaved?.status !== 'field_error' && showWarning) {
      setShowWarning(false);
    }
  }, [lastSaved?.status, showWarning]);

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
  
  // Show notifications for network errors OR validation errors
  const showForNetworkError = showNetworkWarning && wasNetworkError && (isRelevantField || storedRelevant);
  const showForValidationError = showWarning && lastSaved?.status === 'field_error' && (isRelevantField || storedRelevant);
  const showNotifications = showForNetworkError || showForValidationError;

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
      {(showNetworkWarning && wasNetworkError) || showForValidationError ? (
        <Notification
          type="alert"
          label={t('messages.unsaved-field-warning-label')}
          dismissible={false}
          size="default"
          className="nes-notification nes-warning-notification"
        >
          <div className="nes-warning-notification__content">
            {showForValidationError && !wasNetworkError ? (
              // Validation error (e.g., character limit exceeded)
              <p style={{whiteSpace: 'pre-line'}}>{t('messages.unsaved-field-warning-validation')}</p>
            ) : (
              // Network error
              <p style={{whiteSpace: 'pre-line'}}>{t('messages.unsaved-field-warning-network')}</p>
            )}
          </div>
          <div className="nes-warning-notification__actions">
            <Button
              onClick={() => {
                // Get current field value from Redux Form
                const currentValue = formValues?.[fieldName];
                
                // Format the value for copying
                let textToCopy = '';
                if (currentValue?.ops) {
                  // Quill Delta format - extract text
                  textToCopy = currentValue.ops.map(op => op.insert || '').join('');
                } else if (typeof currentValue === 'string') {
                  textToCopy = currentValue;
                } else if (currentValue) {
                  textToCopy = JSON.stringify(currentValue);
                } else {
                  textToCopy = '';
                }
                
                navigator.clipboard.writeText(textToCopy);
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
      ) : null}
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
                  
                  // Always restore saved value when closing notification
                  // If no saved value exists (undefined/null), use empty string to properly clear field
                  if (fieldName) {
                    const savedValue = initialValues?.[fieldName];
                    const valueToRestore = savedValue !== undefined && savedValue !== null ? savedValue : '';
                    dispatch(change(EDIT_PROJECT_FORM, fieldName, valueToRestore));
                    
                    // Mark field as untouched (pristine) to prevent validation errors on empty restore
                    dispatch(untouch(EDIT_PROJECT_FORM, fieldName));
                    
                    // Remove field from error list to stop passivation
                    dispatch(formErrorList(false, fieldName));
                  }
                  
                  // Clear form-level errors for this field
                  dispatch(stopSubmit(EDIT_PROJECT_FORM, {}));
                  
                  // Check if this is a validation error
                  const isValidationError = lastSaved?.status === 'field_error';
                  
                  if (isValidationError) {
                    // For validation errors: clear warning state
                    setShowWarning(false);
                  } else {
                    // For network errors: clear network error flags
                    setShowNetworkWarning(false);
                    localStorage.removeItem(wasNetworkErrorKey);
                  }
                  
                  // Trigger editor to refresh - needed for BOTH validation and network errors
                  // The RichTextEditor will listen to this and reset validation states
                  window.dispatchEvent(new CustomEvent('forceEditorRefresh', { 
                    detail: { fieldName } 
                  }));
                  
                  // Clear lastSaved if this was the only field with error
                  // This prevents passivation from continuing
                  const otherErrorFields = lastSaved?.fields?.filter(f => f !== fieldName) || [];
                  if (otherErrorFields.length === 0) {
                    dispatch(setLastSaved('', null, [], [], false));
                  }
                  
                  localStorage.removeItem('isRelevantField');
                  dispatch({ type: 'Reset network status' });
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