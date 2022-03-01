import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Grid } from 'semantic-ui-react'
import "hds-core";

import LoggingComponent from './LoggingComponent'

export const NavHeader = ({ routeItems, actions, title, infoOptions, attributes }) => {
  const [isMobile, setIsMobile] = useState(false)

  // create an event listener
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    if (window.innerWidth < 720) {
      setIsMobile(true)
    }
  })

  //choose the screen size
  const handleResize = () => {
    if (window.innerWidth < 720) {
      setIsMobile(true)
    } else {
      setIsMobile(false)
    }
  }

  if (isMobile) {
    return null
  }

  return (
    <div className="nav-header-container">
      <div className="nav-header-inner-container">
        <div className="nav-header-route">
          <div className="nav-header-route-items">
            {routeItems.map((item, i) => {
              return (
                <span key={i}>
                  <Link to={item.path}>{item.value}</Link>
                </span>
              )
            })}
          </div>
        </div>
        <div className="nav-header-content">
          <div className="nav-header-titles">
            <Grid className="full-width" stackable padded={false} columns="equal">
              <Grid.Column width={4}>
                <h1 className="nav-header-title">{title}</h1>
              </Grid.Column>
              <Grid.Column textAlign="right">{actions && actions}</Grid.Column>
            </Grid>
          </div>
          <LoggingComponent infoOptions={infoOptions} attributes={attributes} />
        </div>
      </div>
    </div>
  )
}

NavHeader.propTypes = {
  routeItems: PropTypes.array,
  actions: PropTypes.object,
  large: PropTypes.bool,
  title: PropTypes.string
}
