import React, { Suspense } from 'react'
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux'
import { init as sentryInit } from '@sentry/browser'
import ReduxToastr from 'react-redux-toastr'
import App from './components/App'
import store from './store'
import apiUtils from './utils/apiUtils'
import 'semantic-ui-css/semantic.min.css'
import 'hds-core'
import './index.css'
import './i18n'

// Software uses semanctic-ui-react as a global style. In the end of 2021 the idea was to change components use
// hds-rect. However since hds-react implementation was only started then, it did not have all the required
// components. Most of the components have been changed from sematic-ui-react to hds-react, but some components
// still missing. When all required components are available, semantic-ui-react could be removed and use hds-react
// as a common style.

// Initialize axios
apiUtils.initAxios()

// Initialize sentry
if (process.env.NODE_ENV === 'production') {
  sentryInit({ dsn: process.env.REACT_APP_SENTRY_URL })
}

const root = ReactDOM.createRoot(document.getElementById("root"));
  
root.render(
  <Provider store={store}>
      <React.Fragment>
        <ReduxToastr
          closeOnToastrClick={true}
          newestOnTop={false}
          position="top-center"
          transitionIn="fadeIn"
          transitionOut="fadeOut"
          timeOut={7500}
        />
        <Suspense fallback='Loading'>
          <App />
        </Suspense>
      </React.Fragment>
  </Provider>
)
