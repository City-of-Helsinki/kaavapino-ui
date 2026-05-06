import React, { useCallback, useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { TextArea } from 'hds-react'
import { useSelector } from 'react-redux'
import { useFieldPassivation } from '../../hooks/useFieldPassivation';
import { lastSavedSelector, savingSelector } from '../../selectors/projectSelector'
import NetworkErrorState from './NetworkErrorState.jsx'
import './Input.scss'

const CustomTextArea = ({ input, meta, ...custom }) => {
  const { error } = meta;

  const shouldDisableForErrors = useFieldPassivation(input.name, { formName: meta.form });
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const saving = useSelector(state => savingSelector(state))
  const [isThisFieldSaving, setIsThisFieldSaving] = useState(false)
  const oldValueRef = useRef('');

  useEffect(() => {
    oldValueRef.current = input.value;
    return () => {
    };
  }, [])

  useEffect(() => {
    setIsThisFieldSaving(saving && saving === input.name);
  }, [saving, input.name])

  const handleInputChange = useCallback((event) => {
    input.onChange(event, input.name);
  }, [input.name, input.value]);

  const handleFocus = () => {
    custom.onFocus(input.name);
  }

  const handleBlur = (event) => {
    custom.handleUnlockField()
    if (event.target.value !== oldValueRef.current) {
        custom.onBlur();
        oldValueRef.current = event.target.value;
    }
  }

  // Check if THIS field has network error (network down or lock error)
  // DO NOT include field_error - those are backend validation errors and user must be able to fix them!
  const isThisFieldNetworkError = (lastSaved?.status === 'error' || lastSaved?.status === 'connection_restored') && 
    lastSaved?.fields?.includes(input.name);

  const blurredClass = (isThisFieldSaving || isThisFieldNetworkError) ? ' blurred' : '';
  const networkErrorClass = isThisFieldNetworkError ? ' has-network-error' : '';

  // Prepare validation error string for NetworkErrorState
  const errorString = typeof error === 'string' ? error : '';
  const hasValidationError = !!error;

  return (
    <div className={`textarea-wrapper${blurredClass}${networkErrorClass}`}>
      <TextArea
        {...input}
        {...custom}
        error={error}
        disabled={shouldDisableForErrors || custom.disabled || isThisFieldSaving || isThisFieldNetworkError}
        onFocus={handleFocus}
        onChange={handleInputChange}
        onBlur={handleBlur}
        data-testid="text1"
      />
      <NetworkErrorState fieldName={input.name} validationError={hasValidationError ? errorString : null} />
    </div>
  )
}

CustomTextArea.propTypes = {
  input: PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
  }).isRequired,
  meta: PropTypes.shape({
    error: PropTypes.string,
    form: PropTypes.string
  }),
  disabled: PropTypes.bool,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  handleUnlockField: PropTypes.func
}

export default CustomTextArea