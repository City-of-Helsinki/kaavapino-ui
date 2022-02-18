import React from 'react'
import DateTime from 'react-datetime'
import { useTranslation } from 'react-i18next';

const CustomDateTime = ({ input, placeholder, ...custom }) => {

  const {t} = useTranslation()
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
      inputProps={{ placeholder }}
      clearable
    />
  )
}

export default CustomDateTime
