import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { projectNetworkSelector, lastSavedSelector } from '../../selectors/projectSelector';
import { Notification } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { setLastSaved } from '../../actions/projectActions';
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
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const status = network.status || 'ok';
  
  const hasError = status === 'error' || lastSaved?.status === 'field_error';
  const isSuccess = status === 'success' || lastSaved?.status === 'connection_restored';

  const banner = useMemo(() => {
    // IMPORTANT: Check isSuccess FIRST before hasError!
    if (isSuccess) {
      return {
        type: 'success',
        label: t('messages.network-connection-restored-label')
      };
    }
    if (hasError) {
      // Differentiate between field validation error and network error
      const isFieldValidationError = lastSaved?.status === 'field_error';
      
      // For network errors, use custom two-line message
      if (!isFieldValidationError) {
        return {
          type: 'error',
          label: 'Tallennus epäonnistui',
          message: 'Odota yhteyden palautumista.'
        };
      }
      
      // For validation errors, use standard format
      return {
        type: 'error',
        label: t('messages.network-save-failed-label'),
        message: t('messages.field-validation-error') || 'Kentän arvo ei ole kelvollinen'
      };
    }
    return null;
  }, [hasError, isSuccess, network.errorMessage, network.okMessage, lastSaved?.status, t]);

  // Auto-hide "connection restored" banner after 5 seconds
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        dispatch({ type: 'Reset network status' });
        dispatch(setLastSaved('', null, [], [], false));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, dispatch]);

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
  
  // Show red/blue banner for errors and success - NO yellow warning box anymore
  const showBanner = (hasError || isSuccess) && (isRelevantField || storedRelevant);

  if (!showBanner) {
      return null;
  }

  return (
    <div className="network-error-state" aria-live="polite" aria-atomic="true">
      {banner && showBanner && (
        <Notification
          type={banner.type}
          label={banner.label}
          dismissible={false}
          size={"medium"}
          aria-label={banner.label}
          className={`nes-notification nes-${banner.type}`}
        >
          {banner.message && <p>{banner.message}</p>}
        </Notification>
      )}
    </div>
  );
}

NetworkErrorState.propTypes = {
	fieldName: PropTypes.string
}