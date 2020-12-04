import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Route, Switch, Redirect } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'
import { history } from '../store'
import { connect } from 'react-redux'
import { logout } from '../actions/authActions'
import { fetchPhases } from '../actions/phaseActions'
import { fetchProjectTypes } from '../actions/projectTypeActions'
import { authUserLoadingSelector } from '../selectors/authSelector'
import { initApiRequest } from '../actions/apiActions'
import {
  apiLoadingTokenSelector,
  apiTokenSelector,
  apiInitializedSelector
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
import PageHeader from './common/PageHeader'
import Footer from './common/Footer'
import FakeLoginPage from './auth/FakeLogin'
import Overview from './overview'
import Terms from './common/Terms'
import { withTranslation } from 'react-i18next'

class App extends Component {
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
  }

  render() {
    const { t } = this.props
    if (
      this.props.loadingApiToken ||
      this.props.userLoading ||
      !this.props.apiInitialized
    ) {
      return <p>{t('loading')}</p>
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
            <PageHeader />
            <Switch>
              <Route exact path="/" render={() => <Overview />} />
              <Route exact path="/terms" render={() => <Terms />} />
              <Route exact path="/projects" render={() => <ProjectListPage />} />
              <Route exact path="/reports" render={() => <ReportsPage />} />
              <Route
                exact
                path="/:id"
                render={({ match }) => <ProjectPage id={match.params.id} />}
              />
              <Route
                exact
                path="/:id/edit"
                render={({ match }) => <ProjectPage edit id={match.params.id} />}
              />
              <Route
                exact
                path="/:id/documents"
                render={({ match }) => <ProjectPage documents id={match.params.id} />}
              />
              <Route exact path="/error/:code" component={ErrorPage} />
              <Redirect to="/error/404" />
            </Switch>
            <Footer />
          </ProtectedRoute>
        </Switch>
      </ConnectedRouter>
    )
  }
}

App.propTypes = {
  userLoading: PropTypes.bool
}

const mapDispatchToProps = {
  logout,
  fetchPhases,
  fetchProjectTypes,
  initApiRequest
}

const mapStateToProps = state => {
  return {
    userLoading: authUserLoadingSelector(state),
    phases: phasesSelector(state),
    apiToken: apiTokenSelector(state),
    loadingApiToken: apiLoadingTokenSelector(state),
    apiInitialized: apiInitializedSelector(state)
  }
}

export default (connect(mapStateToProps, mapDispatchToProps)(withTranslation()(App)))
