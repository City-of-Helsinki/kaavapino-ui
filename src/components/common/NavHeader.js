import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { IconLinkExternal } from 'hds-react'
import "hds-core";
import { useTranslation } from 'react-i18next';
import LoggingComponent from './LoggingComponent'

export const NavHeader = ({ routeItems, actions, title, infoOptions, attributes, projectSize, responsibleUser, pino, diaari, pwnumber, pwlink, location }) => {
  const [isMobile, setIsMobile] = useState(false)
  const {t} = useTranslation()
  const pathToCheck = location?.pathname
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

  const getPW = () => {
    //TODO undesided how this goes and no pwlink comes from excel and backend yet
    let pw
    if(pwlink?.new_value && pwnumber){
      pw = <td><a className='link-underlined' href={pwlink?.new_value} target="_blank" rel="noreferrer">{pwnumber} <IconLinkExternal size="xs" aria-hidden="true" /></a></td>
    }
    else if(pwnumber){
      pw = <td>{pwnumber}</td>
    }
    else{
      pw = <td></td>
    }
    return pw
  }

  if (isMobile) {
    return null
  }

  let navHeaderContentClass = ""
  if(pathToCheck?.endsWith('/edit')) {
    navHeaderContentClass = "nav-header-content edit"
  }
  else if(pathToCheck?.endsWith('/documents')) {
    navHeaderContentClass = "nav-header-content documents"
  }
  else {
    navHeaderContentClass = "nav-header-content"
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
        <div className={navHeaderContentClass}>
          <div className="nav-header-titles">
            <div className="nav-menu-container">
              <div>
                <h1 className="nav-header-title">{pathToCheck?.endsWith('/documents') ? t('project.documents') : title}</h1>
              </div>
              <div className='nav-menu-buttons'>
                <LoggingComponent infoOptions={infoOptions} attributes={attributes} />
                <div className='nav-select-container'>
                  {actions}
                </div>
              </div>
            </div>
          </div>
        </div>
        {pathToCheck?.endsWith('/edit') &&
        <div className="project-info">
          <table>
            <tr>
              <th>{t('project-edit-info.size')}</th>
              <td>{projectSize}</td>
            </tr>
            <tr>
              <th>{t('project-edit-info.person')}</th>
              <td>{responsibleUser}</td>
            </tr>
            <tr>
              <th>{t('project-edit-info.pino')}</th>
              <td>{pino}</td>
            </tr>
            <tr>
              <th>{t('project-edit-info.diaari')}</th>
              <td>{diaari}</td>
            </tr>
            <tr>
              <th>{t('project-edit-info.pwnum')}</th>
              {getPW()}
            </tr>
          </table>
        </div>
        }
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
