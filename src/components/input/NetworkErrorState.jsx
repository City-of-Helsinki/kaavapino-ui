import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { projectNetworkSelector, lastSavedSelector } from '../../selectors/projectSelector';
import { useTranslation } from 'react-i18next';
import { setLastSaved, RESET_NETWORK_STATUS } from '../../actions/projectActions';
import './NetworkErrorState.scss';
import PropTypes from 'prop-types';

function normalizeValidationError(validationError, t) {
  if (typeof validationError === 'object' && validationError !== null) {
    return t('project.charsover');
  }
  return validationError;
}

function buildFieldErrorNotification(lastSaved, savedFields, fieldName, hasValidationError, t) {
  const fieldIndex = savedFields.indexOf(fieldName);
  const backendErrorMessage =
    fieldIndex >= 0 && Array.isArray(lastSaved?.values) ? lastSaved.values[fieldIndex] : null;

  if (!backendErrorMessage) {
    return { type: 'error', label: t('messages.network-save-failed-label'), key: 'field_error' };
  }

  let errorText = Array.isArray(backendErrorMessage) ? backendErrorMessage[0] : backendErrorMessage;

  if (typeof errorText === 'object' && errorText !== null) {
    errorText = t('messages.network-save-failed-message');
  }

  return {
    type: 'error',
    label: t('messages.network-save-failed-label'),
    message: errorText,
    key: 'field_error'
  };
}

function buildErrorNotifications(lastSaved, savedFields, fieldName, hasValidationError, t) {
  const notifications = [];
  const isFieldValidationError = lastSaved?.status === 'field_error';

  if (!isFieldValidationError) {
    notifications.push({
      type: 'error',
      label: t('messages.network-save-failed-label'),
      message: t('messages.network-save-failed-message'),
      key: 'network'
    });
  }

  if (isFieldValidationError && fieldName && !hasValidationError) {
    notifications.push(buildFieldErrorNotification(lastSaved, savedFields, fieldName, hasValidationError, t));
  } else if (isFieldValidationError) {
    notifications.push({ type: 'error', label: t('messages.network-save-failed-label'), key: 'field_error' });
  }

  return notifications;
}

export default function NetworkErrorState({ fieldName, validationError, maxSizeOver, readonly }) {
  const clearedIsRelevantField = useRef(false);
  
  // Clear localStorage on first mount only
  if (globalThis.window !== undefined && !clearedIsRelevantField.current) {
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
  
  // Check if field has network error (not just maxSizeOver passivation)
  const hasError = lastSaved?.status === 'error' || lastSaved?.status === 'field_error';
  const isSuccess = status === 'success' || lastSaved?.status === 'connection_restored';
  const hasValidationError = !!validationError;

  // Get saved fields early so we can use it in banner useMemo
  const savedFields = Array.isArray(lastSaved?.fields) ? lastSaved.fields : [];

  const banners = useMemo(() => {
    const notifications = [];

    const isNetworkError = lastSaved?.status === 'error';

    if (isSuccess) {
      notifications.push({
        type: 'success',
        label: t('messages.network-connection-restored-label'),
        key: 'success'
      });
    }

    if (hasValidationError && !isNetworkError) {
      notifications.push({
        type: 'error',
        label: normalizeValidationError(validationError, t),
        key: 'validation'
      });
    }

    if (hasError && !isSuccess && !hasValidationError) {
      notifications.push(...buildErrorNotifications(lastSaved, savedFields, fieldName, hasValidationError, t));
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
        dispatch({ type: RESET_NETWORK_STATUS });
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
        const fadeClass = isFadingOut ? ' fade-out' : ' fade-in';
        const className = banner.type === 'success' ? `success-text${fadeClass}` : 'error-text';
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