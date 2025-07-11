import React from 'react'
import { Button, LoadingSpinner, Tooltip } from 'hds-react'
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
    <Tooltip tooltipLabel={help}>{btn}</Tooltip>
  ) : (
    btn
  )
}

FormButton.propTypes = {
  handleClick: PropTypes.func,
  value: PropTypes.string
}

export default FormButton
