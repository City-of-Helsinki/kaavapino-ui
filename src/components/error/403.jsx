import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next';

const Forbidden = () => {

  const {t} = useTranslation()

  return (
    <div>
      <p>{t('no-rights')}</p>
      <Link to="/">{t('go-back-front-page')}</Link>
    </div>
  )
}

export default Forbidden
