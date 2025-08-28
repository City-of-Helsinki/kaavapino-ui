import React from 'react'
import NotFound from './404'
import Forbidden from './403'

const ErrorPage = ({
  match: {
    params: { code }
  }
}) => {
  const getErrorPageContent = () => {
    switch (code) {
      case '404':
        return <NotFound />
      case '403':
        return <Forbidden />
      default:
        return <NotFound />
    }
  }

  return <div className="error-page">{getErrorPageContent()}</div>
}

export default ErrorPage
