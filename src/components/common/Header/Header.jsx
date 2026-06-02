import React, { useEffect } from 'react'
import { Navigation, IconSignout } from 'hds-react'
import { withRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DocumentsPageHeader from './DocumentsPageHeader.jsx'
import EditPageHeader from './EditPageHeader.jsx'
import 'hds-core'
import { useSelector } from 'react-redux'
import { usersSelector } from '../../../selectors/userSelector.js'
import { authUserSelector } from '../../../selectors/authSelector.js'
import PropTypes from 'prop-types'


const Header = props => {
  const { t } = useTranslation()
  const users = useSelector(state => usersSelector(state))
  const user = useSelector(state => authUserSelector(state))

  const currentUser = users.find(
    item => user?.profile && item.id === user.profile.sub
  )

  const currentEnv = process.env.REACT_APP_ENVIRONMENT

  // Manual accessibility implementations for user menu, reconsider when HDS is updated
  const focusVisibleMenuItem = () => {
    // HDS creates multiple elements with the same id (mobile and desktop), focus only the visible one
    document.querySelectorAll("#nav-user-menu-logout").forEach(item => {
      if (item.offsetParent !== null) {
        item.focus();
      }
    });
  }

  const handleMenuOpenedKeyDown = (event) => {
    if (event.key === "Escape" || (event.key === "Tab" && event.shiftKey)) {
      document.dispatchEvent(new Event('click')); // Closes menu
    }
    else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusVisibleMenuItem();
    }
  }

  const handleMenuClosedKeyDown = (event, element) => {
    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        element.click();
      }
      // Timeout needed as menu items are not in DOM immediately after click
      setTimeout(() => {
        focusVisibleMenuItem();
      }, 10);
    }
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      const element = document.activeElement;
      if (element?.id !== "nav-user-menu-button") {
        return;
      }
      if ((element.ariaExpanded === "true")) {
        handleMenuOpenedKeyDown(event);
      }
      else if (element.ariaExpanded === "false") {
        handleMenuClosedKeyDown(event, element);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

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

  const label = currentUser?.privilege_name
    ? `${user?.profile.name} (${currentUser.privilege_name})`
    : user?.profile.name

  const backgroundColor =
    (!currentEnv || currentEnv === 'production') ? 'transparent' : 'var(--color-brick-light)'

  const getTitle = ()  => {
    if ( currentEnv === 'production' ) {
      return t('title')
    }
    return currentEnv ? `${t('title')} (${currentEnv})` : t('title')
  }

  const pathToCheck = props.location.pathname

  if(pathToCheck.includes('edit')) {
    return (
      <EditPageHeader
        title={props.title}
        pollConnection={props.pollConnection}
        currentSectionKey={props.currentSection}
        location={props.location}
      />
    )
  }
  else if (pathToCheck.endsWith('/documents')) {
    return <DocumentsPageHeader/>
  }
  else{
    return (
      <Navigation
        label="navigation"
        logoLanguage="fi"
        menuToggleAriaLabel={t('header.choices-label')}
        title={getTitle()}
        skipTo="#main"
        skipToContentLabel={t('header.skip-to-content')}
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
            as="button"
            label={t('header.overview')}
            onClick={navigateToHome}
            className={(props.location.pathname === "/")
              ? "header-nav-item active"
              : "header-nav-item "
            }
            active={(props.location.pathname === "/")
            }
          />
          <Navigation.Item
            as="button"
            label={t('header.projects')}
            onClick={navigateToProjects}
            className={(props.location.pathname.startsWith("/projects"))
              ? "header-nav-item active"
              : "header-nav-item "
            }
            active={!!(props.location.pathname.startsWith("/projects"))
            }
          />
          <Navigation.Item
            as="button"
            label={t('header.reports')}
            onClick={navigateToReports}
            className={(props.location.pathname === "/reports")
              ? "header-nav-item active"
              : "header-nav-item "
            }
            active={props.location.pathname === "/reports"}
          />
        </Navigation.Row>
        <Navigation.Actions>
          <Navigation.User userName={label} authenticated={true} id="nav-user-menu">
            <Navigation.Item
              id="nav-user-menu-logout"
              className='test_nav_user_menu'
              tabIndex={0}
              icon={<IconSignout aria-hidden />}
              label={t('header.sign-out')}
              onClick={logout}
              variant="supplementary"
              onKeyDown={(event) => {
                // Manual accessibility implementations
                if (event.key === "Escape") {
                  document.dispatchEvent(new Event('click'));
                  document.getElementById("nav-user-menu-button").focus();
                }
                else if ((event.key === "Tab" && !event.shiftKey)) {
                  document.dispatchEvent(new Event('click'));
                }
                else if (["ArrowDown", "ArrowUp"].includes(event.key)) {
                  event.preventDefault();
                }
              }}
            />
          </Navigation.User>
        </Navigation.Actions>
      </Navigation>
    )
  }
  
}

Header.propTypes = {
  location:PropTypes.object,
  history:PropTypes.object,
  pollConnection:PropTypes.func,
  title:PropTypes.string,
  currentSection:PropTypes.number
}

export default withRouter(Header)
