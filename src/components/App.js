import React, { Component } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'
import PropTypes from 'prop-types'
import { history } from '../store'
import { connect } from 'react-redux'
import { logout } from '../actions/authActions'
import { fetchPhases } from '../actions/phaseActions'
import { fetchProjectTypes } from '../actions/projectTypeActions'
import { initApiRequest } from '../actions/apiActions'
import {
  apiTokenSelector,
  apiInitializedSelector,
  loadingTokenSelector
} from '../selectors/apiSelector'
import { phasesSelector } from '../selectors/phaseSelector'
import LoginPage from './auth/Login'
import LogoutPage from './auth/Logout'
import LoginCallbackPage from './auth/LoginCallback'
import LogoutCallbackPage from './auth/LogoutCallback'
import ProtectedRoute from './common/ProtectedRoute'
import ProjectListPage from './projectList'
import ProjectPage from './project'
import ReportsPage from './reports'
import ErrorPage from './error'
import CustomFooter from './common/CustomFooter'

import FakeLoginPage from './auth/FakeLogin'
import Overview from './overview'
import Terms from './common/Terms'
import IdleMonitor from './auth/IdleMonitor'
import { withTranslation } from 'react-i18next'
class App extends Component {

  componentDidMount(){
    //Matomo analytic
    const currentEnv = process.env.REACT_APP_ENVIRONMENT
    const matomoURL = process.env.REACT_APP_MATOMO_URL
    const siteID = process.env.REACT_APP_MATOMO_SITE_ID

    if(currentEnv === 'production' && matomoURL && siteID){
      let _paq = window._paq = window._paq || [];
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        let u=`${matomoURL}`;
        _paq.push(['setTrackerUrl', u+'matomo.php']);
        _paq.push(['setSiteId', `${siteID}`]);
        let d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
      })();
    }

    // Start the refresh timeout when loading
    this.startLoadingTimeout();
  }

  componentWillUnmount() {
    this.clearLoadingTimeout();
  }

  startLoadingTimeout() {
    this.clearLoadingTimeout(); // Ensure no duplicate timeouts
    this.loadingTimeout = setTimeout(() => {
      //Try to reload the page if loading is stuck
      window.location.reload();
    }, 30000); // 30 seconds
  }

  clearLoadingTimeout() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.apiInitialized && this.props.apiInitialized) {
      this.props.fetchPhases()
      this.props.fetchProjectTypes()
    } else if (!prevProps.apiToken && this.props.apiToken) {
      // One request needs to be done before anything else because
      // of a bug in a backend library that causes a race condition
      // when it tries to cache multiple token values at the same time.
      this.props.initApiRequest()
    }

    // Reset timeout when loading state changes
    if (this.props.loadingToken || (!this.props.apiToken && !this.props.apiInitialized)) {
      this.startLoadingTimeout();
    } else {
      this.clearLoadingTimeout();
    }
  }

  render() {
    const { t} = this.props
    if (this.props.loadingToken || (this.props.apiToken !== null && !this.props.apiInitialized)) {
      return (<p>{t('loading')}</p>)
    }
   
    return (
      <ConnectedRouter history={history}>
        <Switch>
          {process.env.REACT_APP_API_TOKEN ? (
            <Route path="/login" render={() => <FakeLoginPage />} />
          ) : (
            <Route path="/login" render={() => <LoginPage />} />
          )}
          <Route path="/callback" render={() => <LoginCallbackPage />} />
          <Route
            exact
            path="/logout"
            render={() => <LogoutPage handleLogout={this.props.logout} />}
          />
          <Route path="/logout/callback" render={() => <LogoutCallbackPage />} />
          <ProtectedRoute path="/" pred={this.props.apiToken !== null} redirect="/login">
            <Switch>
              <Route
                exact
                path="/"
                render={() => (
                  <Overview/>
                )}
              />
              <Route exact path="/terms" render={() => <Terms />} />
              <Route
                exact
                path="/projects"
                render={() => (
                  <ProjectListPage/>
                )}
              />
              <Route
                exact
                path="/reports"
                render={() => (
                  <ReportsPage/>
                )}
              />
              <Route
                exact
                path="/projects/:id"
                render={({ match }) => (
                  <ProjectPage
                    id={match.params.id}
                    
                  />
                )}
              />
              <Route
                exact
                path="/projects/:id/edit"
                render={({ match }) => (
                  <ProjectPage
                    edit
                    id={match.params.id}
                  />
                )}
              />
              <Route
                exact
                path="/projects/:id/documents"
                render={({ match }) => (
                  <ProjectPage
                    documents
                    id={match.params.id}
                  />
                )}
              />
              <Route
                exact
                path="/error/:code"
                component={ErrorPage}
              />
              <Redirect to="/error/404" />
            </Switch>
            <IdleMonitor/>
            <CustomFooter />
          </ProtectedRoute>
        </Switch>
      </ConnectedRouter>
    )
  }
}

App.propTypes = {
  loadingToken: PropTypes.bool,
  apiInitialized: PropTypes.bool
}

const mapDispatchToProps = {
  logout,
  fetchPhases,
  fetchProjectTypes,
  initApiRequest
}

const mapStateToProps = state => {
  return {
    phases: phasesSelector(state),
    apiToken: apiTokenSelector(state),
    apiInitialized: apiInitializedSelector(state),
    loadingToken: loadingTokenSelector(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(App))
