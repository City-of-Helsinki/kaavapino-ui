import React, { Suspense } from 'react'
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux'
import { init as sentryInit } from '@sentry/browser'
import ReduxToastr from 'react-redux-toastr'
import App from './components/App.jsx'
import store from './store'
import apiUtils from './utils/apiUtils'
import 'react-redux-toastr/lib/css/react-redux-toastr.min.css'
import 'hds-core'
import './main.scss'
import './i18n'

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
          position="top-right"
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
