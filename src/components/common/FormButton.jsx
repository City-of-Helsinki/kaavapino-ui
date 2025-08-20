import React from 'react'
import { Popup } from 'semantic-ui-react'
import { Button, LoadingSpinner } from 'hds-react'
import PropTypes from 'prop-types'

const FormButton = ({
  handleClick,
  value,
  icon,
  loading,
  help,
  variant,
  fullWidth,
  ...rest
}) => {
  const btn = (
    <Button
      disabled={loading}
      variant={variant}
      className="form-button"
      onClick={handleClick}
      fullWidth={fullWidth}
      iconLeft={loading ? <LoadingSpinner className="loading-spinner" small /> : null}
      {...rest}
    >
      {!loading && icon}
      {` ${value}`}
    </Button>
  )
  return help ? (
    <Popup trigger={btn} content={help} hideOnScroll position="bottom center" />
  ) : (
    btn
  )
}

FormButton.propTypes = {
  handleClick: PropTypes.func,
  value: PropTypes.string
}

export default FormButton
