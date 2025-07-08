import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next';

const NotFound = () => {

  const {t} = useTranslation()
  return (
    <div>
      <p>{t('error.page-not-found')}</p>
      <Link to="/">{t('error.go-back-front-page')}</Link>
    </div>
  )
}

export default NotFound
