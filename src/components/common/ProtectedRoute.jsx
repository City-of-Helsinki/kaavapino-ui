import React from 'react'
import { Redirect, Route } from 'react-router-dom'
import PropTypes from 'prop-types'

const ProtectedRoute = ({ render: Component, pred, children, redirect, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props =>
        pred ? (
          (Component && <Component {...props} />) ||
          React.Children.toArray(children).map((c, i) =>
            React.cloneElement(c, { ...props, key: i })
          )
        ) : (
          <Redirect
            to={{
              pathname: redirect,
              state: { from: props.location }
            }}
          />
        )
      }
    />
  )
}

ProtectedRoute.propTypes = {
  render: PropTypes.func,
  pred: PropTypes.bool,
  redirect: PropTypes.string.isRequired
}

export default ProtectedRoute
