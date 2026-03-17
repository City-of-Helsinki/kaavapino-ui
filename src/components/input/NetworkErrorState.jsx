import React, { useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { projectNetworkSelector, lastSavedSelector } from '../../selectors/projectSelector';
import { useTranslation } from 'react-i18next';
import { setLastSaved } from '../../actions/projectActions';
import './NetworkErrorState.scss';
import PropTypes from 'prop-types';

export default function NetworkErrorState({ fieldName, validationError }) {
  const clearedIsRelevantField = useRef(false);
  
  // Clear localStorage on first mount only
  if (typeof window !== 'undefined' && !clearedIsRelevantField.current) {
      try {
          localStorage.removeItem('isRelevantField');
          localStorage.removeItem('warningManuallyClosed');
          clearedIsRelevantField.current = true;
      } catch (e) {}
  }
  const network = useSelector(projectNetworkSelector);
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const status = network.status || 'ok';
  
  const hasError = status === 'error' || lastSaved?.status === 'field_error';
  const isSuccess = status === 'success' || lastSaved?.status === 'connection_restored';
  const hasValidationError = !!validationError;

  // Get saved fields early so we can use it in banner useMemo
  const savedFields = Array.isArray(lastSaved?.fields) ? lastSaved.fields : [];

  const banners = useMemo(() => {
    const notifications = [];
    
    // Show validation error if present
    if (hasValidationError) {
      notifications.push({
        type: 'error',
        label: validationError,
        key: 'validation'
      });
    }
    
    // Show success message
    if (isSuccess) {
      notifications.push({
        type: 'success',
        label: t('messages.network-connection-restored-label'),
        key: 'success'
      });
    }
    
    // Show network/save errors
    if (hasError) {
      // Differentiate between field validation error and network error
      const isFieldValidationError = lastSaved?.status === 'field_error';
      
      // For network errors (including lock errors), show two-line message
      if (!isFieldValidationError) {
        notifications.push({
          type: 'error',
          label: t('messages.network-save-failed-label'),
          message: t('messages.network-save-failed-message'),
          key: 'network'
        });
      }
      
      // For backend validation errors (400), show the actual backend error message
      // Find this field's error message from lastSaved.values array
      // Skip if client validation error is already shown to prevent duplicates
      if (isFieldValidationError && fieldName && !hasValidationError) {
        const fieldIndex = savedFields.indexOf(fieldName);
        const backendErrorMessage = fieldIndex >= 0 && Array.isArray(lastSaved?.values) 
          ? lastSaved.values[fieldIndex] 
          : null;
        
        if (backendErrorMessage) {
          // Backend provided a specific error message for this field
          const errorText = Array.isArray(backendErrorMessage) 
            ? backendErrorMessage[0] // Take first error if array
            : backendErrorMessage;
          
          notifications.push({
            type: 'error',
            label: t('messages.network-save-failed-label'),
            message: errorText,
            key: 'field_error'
          });
        }
      } else if (isFieldValidationError) {
        // Fallback for field_error without specific message
        notifications.push({
          type: 'error',
          label: t('messages.network-save-failed-label'),
          key: 'field_error'
        });
      }
    }
    
    return notifications;
  }, [hasError, isSuccess, hasValidationError, validationError, lastSaved?.status, lastSaved?.lock, savedFields, fieldName, lastSaved?.values, t]);

  // Auto-hide "connection restored" banner after 5 seconds
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        dispatch({ type: 'Reset network status' });
        dispatch(setLastSaved('', null, [], [], false));
        localStorage.removeItem('isRelevantField');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, dispatch]);

  // Limit visibility to fields present in lastSaved.fields when error/success
  // (savedFields already defined above for use in banner)
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
  
  // Show banner for:
  // 1. Validation errors (always show for this field)
  // 2. Network errors/success (only for relevant fields)
  const showBanner = hasValidationError || ((hasError || isSuccess) && (isRelevantField || storedRelevant));

  if (!showBanner) {
      return null;
  }

  return (
    <div className="network-error-state" aria-live="polite" aria-atomic="true">
      {showBanner && banners.map((banner, index) => {
        const className = banner.type === 'success' ? 'success-text' : 'error-text';
        // Single-line error notifications use notification-message class (14px regular)
        // Two-line notifications use notification-label (16px bold) + notification-message (14px regular)
        // Success notifications always use notification-label (16px bold) even if single-line
        const isSingleLine = !banner.message;
        const isSuccessNotification = banner.type === 'success';
        return (
          <div key={banner.key || index} className={className} style={index > 0 ? { marginTop: '8px' } : {}}>
            <div className="notification-content">
              {isSingleLine ? (
                <span className={isSuccessNotification ? "notification-label" : "notification-message"}>{banner.label}</span>
              ) : (
                <>
                  <span className="notification-label">{banner.label}</span>
                  <br />
                  <span className="notification-message">{banner.message}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

NetworkErrorState.propTypes = {
	fieldName: PropTypes.string,
	validationError: PropTypes.string
}