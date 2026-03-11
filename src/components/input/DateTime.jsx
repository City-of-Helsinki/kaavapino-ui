import React from 'react'
import PropTypes from 'prop-types'
import DateTime from 'react-datetime'
import { useTranslation } from 'react-i18next';
import { useFieldPassivation } from '../../hooks/useFieldPassivation';

const CustomDateTime = ({ input, meta, placeholder, ...custom }) => {

  const {t} = useTranslation()
  const shouldDisableForErrors = useFieldPassivation(input.name, { formName: meta.form });
  
  const formatDate = value => {
    if (!isNaN(new Date(value))) {
      return new Date(value)
    }
    return value
  }

  return (
    <DateTime
      dateFormat={t('dateformat')}
      timeFormat={t('timeformat')}
      value={formatDate(input.value)}
      {...input}
      {...custom}
      locale="fi"
      closeOnSelect={true}
      inputProps={{ 
        placeholder,
        disabled: shouldDisableForErrors || custom.disabled 
      }}
      clearable
    />
  )
}

CustomDateTime.propTypes = {
  input: PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ])
  }).isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool
}

export default CustomDateTime
