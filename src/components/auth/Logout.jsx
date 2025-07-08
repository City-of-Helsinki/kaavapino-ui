import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

function LogoutPage(props) {
  useEffect(() => {
    props.handleLogout()
  }, [])
  const { t } = useTranslation()

  return <div>{t('logging-out')}</div>
}

LogoutPage.propTypes = {
  handleLogout: PropTypes.func
}

export default LogoutPage
