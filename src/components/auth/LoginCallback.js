import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { loginSuccessful, loginFailure } from '../../actions/authActions'
import userManager from '../../utils/userManager'
import { withTranslation } from 'react-i18next';

class LoginCallbackPage extends Component {

  componentDidMount() {
    userManager.signinRedirectCallback()
      .then(() => this.props.loginSuccessful())
      .catch((error) => {
        console.error(error)
        if (error.message === "No matching state found in storage") {
          // Known error with unknown cause, but doesn't actually seem to prevent login
          this.props.loginSuccessful()
        } else {
          this.props.loginFailure()
        }
      })
  }

  render = () => {
    return (
       <p>{this.props.t('redirecting')}</p>
    )
  }
}

LoginCallbackPage.propTypes = {
  loginSuccessful: PropTypes.func,
  loginFailure: PropTypes.func
}

const mapDispatchToProps = {
  loginSuccessful,
  loginFailure
}

export default connect(null, mapDispatchToProps)(withTranslation()(LoginCallbackPage))
