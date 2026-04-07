import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { projectNetworkSelector, lastSavedSelector } from '../../selectors/projectSelector';
import { useTranslation } from 'react-i18next';
import { setLastSaved } from '../../actions/projectActions';
import './NetworkErrorState.scss';
import PropTypes from 'prop-types';

export default function NetworkErrorState({ fieldName, validationError, maxSizeOver, readonly }) {
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
  
  // Check if field has ACTUAL network error (not just maxSizeOver passivation)
  // Passivated fields (readonly && maxSizeOver) should not show network error banner
  // unless there's an actual network/save error (lastSaved.status)
  const hasError = lastSaved?.status === 'error' || lastSaved?.status === 'field_error';
  const isSuccess = status === 'success' || lastSaved?.status === 'connection_restored';
  const hasValidationError = !!validationError;

  // Get saved fields early so we can use it in banner useMemo
  const savedFields = Array.isArray(lastSaved?.fields) ? lastSaved.fields : [];

  const banners = useMemo(() => {
    const notifications = [];
    
    // PRIORITY 1: Network error (show network error, HIDE validation errors)
    // Check lastSaved.status directly, not via hasError (which includes maxSizeOver)
    const isNetworkError = lastSaved?.status === 'error';
    
    // PRIORITY 2: Backend field validation error (show backend error, HIDE client validation errors)
    const isFieldError = lastSaved?.status === 'field_error' && savedFields.includes(fieldName);
    
    // PRIORITY 3: Connection restored (show success, HIDE validation errors)
    const isConnectionRestored = isSuccess;
    
    // PRIORITY 4: Client validation error (show ONLY if no network/backend error or success)
    const shouldShowValidationError = hasValidationError && !isNetworkError && !isConnectionRestored && !isFieldError;
    
    // Show validation error only if not overridden by network state
    if (shouldShowValidationError) {
      // Ensure validationError is a string (not Quill Delta object)
      let errorMessage = validationError;
      if (typeof errorMessage === 'object' && errorMessage !== null) {
        // If it's an object (e.g., Quill Delta), use a generic message
        errorMessage = t('project.charsover'); // fallback to generic validation error
      }
      
      notifications.push({
        type: 'error',
        label: errorMessage,
        key: 'validation'
      });
    }
    
    // Show success message (connection restored)
    // Always show when isSuccess is true (network has recovered)
    if (isSuccess) {
      notifications.push({
        type: 'success',
        label: t('messages.network-connection-restored-label'),
        key: 'success'
      });
    }
    
    // Show network/save errors 
    // Don't show if success is also active (prevents "both at once" dual notification)
    if (hasError && !isSuccess) {
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
          let errorText = Array.isArray(backendErrorMessage) 
            ? backendErrorMessage[0] // Take first error if array
            : backendErrorMessage;
          
          // Backend may return Quill Delta object (with 'ops' property) instead of string
          // React cannot render objects as children - must convert to string or use fallback
          if (typeof errorText === 'object' && errorText !== null) {
            // If it's a Quill Delta object or any other object, use fallback message
            errorText = t('messages.network-save-failed-message');
          }
          
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
  }, [hasError, isSuccess, hasValidationError, validationError, lastSaved?.status, lastSaved?.lock, savedFields, fieldName, lastSaved?.values, t, readonly, maxSizeOver]);

  // Auto-hide "connection restored" banner after 5 seconds
  const [isFadingOut, setIsFadingOut] = useState(false)
  useEffect(() => {
    if (isSuccess) {
      setIsFadingOut(false)
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true)
      }, 8000 - 300);
      const hideTimer = setTimeout(() => {
        dispatch({ type: 'Reset network status' });
        dispatch(setLastSaved('', null, [], [], false));
        localStorage.removeItem('isRelevantField');
      }, 8000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isSuccess, dispatch]);

  // Limit visibility to fields present in lastSaved.fields when error/success
  // (savedFields already defined above for use in banner)
  const storedFieldName = localStorage.getItem('isRelevantField') || null;
  const isRelevantField = fieldName ? savedFields.includes(fieldName) : false;
  const storedRelevant = fieldName ? storedFieldName === fieldName : false;

  useEffect(() => {
    if (hasError && isRelevantField) {
      // Always update localStorage to the current error field, even if another field's
      // value was still stored (e.g. from a previous error that wasn't cleared yet)
      if (storedFieldName !== fieldName) {
        try {
          localStorage.setItem('isRelevantField', fieldName);
        } catch (e) {}
      }
    }
  }, [hasError, storedFieldName, isRelevantField, fieldName]);
  
  // Global network/save error (lastSaved.status === 'error') affects ALL fields
  // Unlike field_error (backend validation), 'error' means network/server failure
  // This happens when API call fails (catch block in saga), not just DevTools offline
  const isGlobalNetworkError = lastSaved?.status === 'error';
  
  // Show banner for:
  // 1. Validation errors (always show for this field)
  // 2. Network/save errors (show ONLY for the field that was being saved)
  // 3. Field-specific validation errors / success (only for relevant fields)
  // 4. Passivated fields with network error (readonly && maxSizeOver)
  const showBanner = hasValidationError || 
                      (isGlobalNetworkError && (isRelevantField || 
                      storedRelevant)) || // Show only for the field that was saved
                      ((lastSaved?.status === 'field_error' || 
                      isSuccess) && (isRelevantField || 
                      storedRelevant)) ||
                      (readonly && maxSizeOver && hasError); // Passivated RichTextEditor fields

  if (!showBanner) {
      return null;
  }

  return (
    <div className="network-error-state" aria-live="polite" aria-atomic="true">
      {showBanner && banners.map((banner, index) => {
        const className = banner.type === 'success' ? `success-text${isFadingOut ? ' fade-out' : ' fade-in'}` : 'error-text';
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
	validationError: PropTypes.string,
	maxSizeOver: PropTypes.bool,
	readonly: PropTypes.bool
}