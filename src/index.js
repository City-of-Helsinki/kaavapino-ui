import React, { Suspense } from 'react'
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux'
import { OidcProvider, processSilentRenew } from 'redux-oidc'
import { init as sentryInit } from '@sentry/browser'
import ReduxToastr from 'react-redux-toastr'
import { ToastContainer } from 'react-toastify';
import App from './components/App'
import store from './store'
import userManager from './utils/userManager'
import apiUtils from './utils/apiUtils'
import 'semantic-ui-css/semantic.min.css'
import 'hds-core'
import './index.css'
import './i18n'
import 'react-toastify/dist/ReactToastify.min.css';

// Software uses semanctic-ui-react as a global style. In the end of 2021 the idea was to change components use
// hds-rect. However since hds-react implementation was only started then, it did not have all the required
// components. Most of the components have been changed from sematic-ui-react to hds-react, but some components
// still missing. When all required components are available, semantic-ui-react could be removed and use hds-react
// as a common style. 
if (window.location.pathname === '/silent-renew') {
  console.log("silent renew")
  processSilentRenew()
} else {
  // Initialize axios
  apiUtils.initAxios()

  // Initialize sentry
  if (process.env.NODE_ENV === 'production') {
    sentryInit({ dsn: process.env.REACT_APP_SENTRY_URL })
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  
  root.render(
    <Provider store={store}>
      <OidcProvider userManager={userManager} store={store}>
        <React.Fragment>
          <ReduxToastr
            closeOnToastrClick={true}
            newestOnTop={false}
            position="top-center"
            transitionIn="fadeIn"
            transitionOut="fadeOut"
            timeOut={7500}
          />
          <ToastContainer />
          <Suspense fallback='Loading'>
            <App />
          </Suspense>
        </React.Fragment>
      </OidcProvider>
    </Provider>
  )
}
