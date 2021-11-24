import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { logoutSuccessful } from '../../actions/authActions'
import { withTranslation } from 'react-i18next'

class LoginCallbackPage extends Component {
  componentDidMount = () => this.props.logoutSuccessful()

  render = () => {
    return <div>{this.props.t('redirecting')}</div>
  }
}

LoginCallbackPage.propTypes = {
  logoutSuccessful: PropTypes.func
}

const mapDispatchToProps = {
  logoutSuccessful
}

export default connect(null, mapDispatchToProps)(withTranslation()(LoginCallbackPage))
