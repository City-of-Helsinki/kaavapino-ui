import React, { useEffect, useState } from 'react'
import userManager from '../../utils/userManager'
import { useTranslation } from 'react-i18next'

function LoginPage() {
  const [currentInterval, setCurrentInterval] = useState()

  const {t} = useTranslation()

  useEffect(() => {
    handleLogin()
    setCurrentInterval(setInterval(() => handleLogin(), 5000))
  }, [])

  useEffect(() => {
    return () => {
      clearInterval(currentInterval)
    }
  }, [])

  const handleLogin = () => userManager.signinRedirect()

  return <div>{t('redirecting')}</div>
}

export default LoginPage
