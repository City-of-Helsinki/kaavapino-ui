import React from 'react'
import PropTypes from 'prop-types'
import { IconLinkExternal } from 'hds-react'
import "hds-core";
import { useTranslation } from 'react-i18next';
import LoggingComponent from './LoggingComponent.jsx'

export const NavHeader = ({ actions, title, infoOptions, projectSize, responsibleUser, pino, diaari, pwnumber, pwlink, location }) => {
  const {t} = useTranslation()
  const pathToCheck = location?.pathname

  const getPW = () => {
    if (pwlink?.new_value && pwnumber){
      return <td><a className='link-underlined' href={pwlink?.new_value} target="_blank" rel="noreferrer">{pwnumber} <IconLinkExternal size="xs" aria-hidden="true" /></a></td>
    }
    return <td>{pwnumber || ''}</td>
  }

  let navHeaderContentClass = "nav-header-content"
  let menuActionButtons = <div className='nav-select-container'> {actions} </div>
  if(pathToCheck?.endsWith('/edit')) {
    navHeaderContentClass += " edit"
    menuActionButtons = (
      <nav className='nav-select-container' aria-label={t('project.edit-tools')}>{actions}</nav>
    )
  }
  else if(pathToCheck?.endsWith('/documents')) {
    navHeaderContentClass += " documents"
  }

  return (
    <div className="nav-header-container">
      <div className="nav-header-inner-container">
        <div className={navHeaderContentClass}>
          <div className="nav-header-titles">
            <div className="nav-menu-container">
              <h1 className="nav-header-title">{pathToCheck?.endsWith('/documents') ? t('project.documents') : title}</h1>
              <div className='nav-menu-buttons'>
                <LoggingComponent infoOptions={infoOptions} />
                {menuActionButtons}
              </div>
            </div>
          </div>
        </div>
        {pathToCheck?.endsWith('/edit') &&
        <div className="project-info">
          <table>
            <tbody>
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
            </tbody>
          </table>
        </div>
        }
      </div>
    </div>
  )
}

NavHeader.propTypes = {
  actions: PropTypes.object,
  title: PropTypes.string,
  infoOptions: PropTypes.array,
  projectSize: PropTypes.string,
  responsibleUser: PropTypes.string,
  pino: PropTypes.string,
  diaari: PropTypes.string,
  pwnumber: PropTypes.string,
  pwlink: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  location: PropTypes.object,
}
