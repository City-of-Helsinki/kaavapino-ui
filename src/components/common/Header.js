import React, { useState } from 'react'
import {
  Navigation,
  IconSignout,
  IconPlus,
  IconPen,
  IconDownload,
  IconRefresh
} from 'hds-react'
import { withRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from './ConfirmationModal'
import 'hds-core'
import { useSelector } from 'react-redux'
import { usersSelector } from '../../selectors/userSelector'
import authUtils from '../../utils/authUtils'
import { authUserSelector } from '../../selectors/authSelector'

const Header = props => {
  const [showConfirm, setShowConfirm] = useState(false)

  const { t } = useTranslation()

  const users = useSelector(state => usersSelector(state))
  const user = useSelector(state => authUserSelector(state))

  const currentUser = users.find(
    item => user && user.profile && item.id === user.profile.sub
  )

  const userIsResponsible = currentUser
    ? authUtils.isResponsible(currentUser.id, users)
    : false

  const currentEnv = process.env.REACT_APP_ENVIRONMENT

  const navigateToProjects = () => {
    props.history.push('/projects')
  }

  const navigateToHome = () => {
    props.history.push('/')
  }

  const navigateToReports = () => {
    props.history.push('/reports')
  }

  const logout = () => {
    props.history.push('/Logout')
  }

  const label = currentUser && currentUser.privilege_name
    ? `${user && user.profile.name} (${currentUser.privilege_name})`
    : user && user.profile.name

  const renderConfirmationDialog = () => {
    return <ConfirmationModal callback={callback} open={showConfirm} />
  }

  const callback = value => {
    setShowConfirm(false)
    if (value) {
      props.resetProjectDeadlines()
    }
  }

  const backgroundColor =
    currentEnv === 'production' ? 'var(--color-fog-light)' : 'var(--color-brick-light)'

  const getTitle = ()  => {
    if ( currentEnv === 'production' ) {
      return t('title')
    }
    if ( !currentEnv ) {
      return t('title')
    } else {
      return t('title') + ' (' + currentEnv + ')'
    }
  }  

  return (
    <>
      {renderConfirmationDialog()}

      <Navigation
        label="navigation"
        logoLanguage="fi"
        menuToggleAriaLabel={t('header.choices-label')}
        title={getTitle()}
        
        titleAriaLabel={t('title')}
        titleUrl="./"
        className="header"
        theme={{
          '--header-background-color': backgroundColor,
          '--header-color': 'var(--color-black-90)',
          '--header-divider-color': 'var(--color-black-20)',
          '--header-focus-outline-color': 'var(--color-black)',
          '--mobile-menu-background-color': 'var(--color-white)',
          '--mobile-menu-color': 'var(--color-black-90)',
          '--navigation-row-background-color': 'var(--color-white)',
          '--navigation-row-color': 'var(--color-black-90)',
          '--navigation-row-focus-outline-color': 'var(--color-coat-of-arms)'
        }}
      >
        <Navigation.Row variant="inline">
          <Navigation.Item
            as="a"
            label={t('header.overview')}
            onClick={navigateToHome}
            className={(props.location.pathname === "/")
            ? "header-nav-item active"
            : "header-nav-item " 
          }
            active={(props.location.pathname === "/")
            ? true
            : false 
            }
          />
          <Navigation.Item
            as="a"
            label={t('header.projects')}
            onClick={navigateToProjects}
            className={(props.location.pathname === "/projects")
            ? "header-nav-item active"
            : "header-nav-item " 
          }
            active={(props.location.pathname === "/projects")
            ? true
            : false 
            }
          />
          <Navigation.Item
            as="a"
            label={t('header.reports')}
            onClick={navigateToReports}
            className={(props.location.pathname === "/reports")
              ? "header-nav-item active"
              : "header-nav-item " 
            }
            active={(props.location.pathname === "/reports")
              ? true
              : false 
            }
          />
        </Navigation.Row>
        <Navigation.Actions>
          <Navigation.User authenticated={true}>
            <Navigation.Item label={label} href="/" target="_blank" variant="primary" />
            {props.createProject && userIsResponsible && (
              <Navigation.Item
                label={t('projects.createNewProject')}
                className="pointer"
                onClick={props.openCreateProject}
                icon={<IconPlus aria-hidden />}
                variant="primary"
              />
            )}
            {props.modifyProject && userIsResponsible && (
              <Navigation.Item
                label={t('project.modify-project')}
                className="pointer"
                onClick={props.openModifyProject}
                variant="primary"
                icon={<IconPen />}
              />
            )}
            {props.showPrintProjectData && (
              <Navigation.Item
                label={t('project.print-project-data')}
                className="pointer"
                onClick={props.openPrintProjectData}
                variant="primary"
                icon={<IconDownload />}
              />
            )}
            {props.resetDeadlines && userIsResponsible && (
              <Navigation.Item
                label={t('deadlines.reset-project-deadlines')}
                className="pointer"
                onClick={() => setShowConfirm(true)}
                variant="primary"
                icon={<IconRefresh />}
              />
            )}

            <Navigation.Item
              href="#"
              icon={<IconSignout aria-hidden />}
              label={t('header.sign-out')}
              onClick={logout}
              variant="supplementary"
            />
          </Navigation.User>
        </Navigation.Actions>
      </Navigation>
    </>
  )
}

export default withRouter(Header)
