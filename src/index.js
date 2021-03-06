import React, { Suspense } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { OidcProvider, processSilentRenew } from 'redux-oidc'
import { init as sentryInit } from '@sentry/browser'
import ReduxToastr from 'react-redux-toastr'
import App from './components/App'
import store from './store'
import userManager from './utils/userManager'
import apiUtils from './utils/apiUtils'
import 'semantic-ui-css/semantic.min.css'
import './index.css'
import i18n from 'i18next'

import './i18n'

if (window.location.pathname === '/silent-renew') {
  processSilentRenew()
} else {
  // Initialize axios
  apiUtils.initAxios()

  // Initialize sentry
  if (process.env.NODE_ENV === 'production') {
    sentryInit({ dsn: process.env.REACT_APP_SENTRY_URL })
  }

  ReactDOM.render(
    <Provider store={store}>
      <OidcProvider userManager={userManager} store={store}>
        <React.Fragment>
          <ReduxToastr
            timeOut={4000}
            newestOnTop={false}
            position="top-center"
            transitionIn="fadeIn"
            transitionOut="fadeOut"
            closeOnToastrClick
          />
          <Suspense fallback={i18n.t('loading')}>
            <App />
          </Suspense>
        </React.Fragment>
      </OidcProvider>
    </Provider>,
    document.getElementById('root')
  )
}
