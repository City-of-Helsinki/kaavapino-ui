import React, { Component } from 'react'

class Prompt extends Component {
  componentDidMount() {
    const { onCancel, onConfirm, message } = this.props
    window.confirm(message) ? onConfirm() : onCancel()
  }

  render() {
    return <div className="prompt" />
  }
}

export default Prompt
