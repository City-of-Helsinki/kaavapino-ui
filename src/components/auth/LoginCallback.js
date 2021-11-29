import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { loginSuccessful, loginFailure } from '../../actions/authActions'
import { CallbackComponent } from 'redux-oidc'
import userManager from '../../utils/userManager'
import { withTranslation } from 'react-i18next';

class LoginCallbackPage extends Component {
  success = () => {
    this.props.loginSuccessful()
  }

  failure = () => {
    this.props.loginFailure()
  }

  render = () => {
    return (
      <CallbackComponent
        userManager={userManager}
        successCallback={this.success}
        errorCallback={this.success}
      >
       <p>{this.props.t('redirecting')}</p>
      </CallbackComponent>
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
