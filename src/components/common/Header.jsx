import React, { useState, useEffect, useRef } from 'react'
import {
  Navigation,
  Button,
  IconSignout,
  IconAngleLeft,
  IconCheck,
  IconErrorFill,
  LoadingSpinner,
  Tooltip
} from 'hds-react'
import { withRouter, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from './ConfirmationModal.jsx'
import 'hds-core'
import { useSelector, useDispatch } from 'react-redux'
import { usersSelector } from '../../selectors/userSelector'
import { setTestingConnection } from '../../actions/projectActions'
import { authUserSelector } from '../../selectors/authSelector'
import { lastSavedSelector,savingSelector,selectedPhaseSelector,projectNetworkSelector } from '../../selectors/projectSelector'
import { schemaSelector } from '../../selectors/schemaSelector'
import schemaUtils from '../../utils/schemaUtils'
import {useInterval} from '../../hooks/connectionPoller'
import PropTypes from 'prop-types'

const Header = props => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [showConfirm, setShowConfirm] = useState(false)
  const [updateTime, setUpdateTime] = useState({status: t('header.edit-menu-no-save'),time: ""})
  const [lastSuccessfulSaveTime, setLastSuccessfulSaveTime] = useState("")
  const [count, setCount] = useState(1)
  const [phaseTitle,setPhaseTitle] = useState("")
  const [sectionTitle,setSectionTitle] = useState("")
  const [isPollingConnection, setIsPollingConnection] = useState(false)

  const history = useHistory();
  const spinnerRef = useRef(null);

  const users = useSelector(state => usersSelector(state))
  const user = useSelector(state => authUserSelector(state))
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const saving =  useSelector(state => savingSelector(state))
  const schema = useSelector(state => schemaSelector(state))
  const selectedPhase = useSelector(state => selectedPhaseSelector(state))
  const projectNetwork = useSelector(state => projectNetworkSelector(state))
  const isConnectionRestored = projectNetwork?.status === 'success' || lastSaved?.status === 'connection_restored'

  const currentUser = users.find(
    item => user?.profile && item.id === user.profile.sub
  )

  const currentEnv = process.env.REACT_APP_ENVIRONMENT

  useEffect(() => {
    // Manual accessibility implementations for user menu, reconsider when HDS is updated
    const handleKeyDown = (event) => {
      const element = document.activeElement;
      if ((element.id === "nav-user-menu-button" && element.ariaExpanded === "true")) {
        if (event.key === "Escape" || (event.key === "Tab" && event.shiftKey)) {
          document.dispatchEvent(new Event('click')); // Closes menu
        }
        else if (event.key === "ArrowDown") {
          event.preventDefault();
          document.querySelectorAll("#nav-user-menu-logout").forEach(item => {
            // HDS creates multiple elements with the same id (mobile and desktop), focus only the visible one
            if (item.offsetParent !== null) {
              item.focus();
            }
          });
        }
      }
      else if (element.id === "nav-user-menu-button" && element.ariaExpanded === "false") {
        if (["Enter", " ", "ArrowDown"].includes(event.key)) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            element.click();
          }
          // Timeout needed as menu items are not in DOM immediately after click
          setTimeout(() => {
          document.querySelectorAll("#nav-user-menu-logout").forEach(item => {
            if (item.offsetParent !== null) {
              item.focus(); // Focus the first item in the menu after opening it
            }
          });
          }, 10);
        }
      }

    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  useInterval(() => {
    //polls connection to backend if there is error
    //doubles the time after each try
    if(lastSaved?.status === "error"){
      setCount(Math.min(count + count, 6))
      setIsPollingConnection(true)
      // Dispatch testingConnection state with the failed field name
      const failedFieldName = lastSaved?.fields?.[0]
      dispatch(setTestingConnection(true, failedFieldName))
      if(spinnerRef?.current?.style){
        spinnerRef.current.style.visibility = "visible"
        setTimeout(() => {
          spinnerRef.current.style.visibility = "hidden"
          setIsPollingConnection(false)
          dispatch(setTestingConnection(false, null))
        }, 5000)
      }
    }
    props.pollConnection()
  }, lastSaved?.status === "error" ? 1000 * count * 10 : 0);

  useEffect(() => {
    if(schema?.phases){
      const currentSchemaIndex = schema?.phases.findIndex(s => s.id === schemaUtils.getSelectedPhase(props.location.search,selectedPhase))
      const currentSchema = schema?.phases[currentSchemaIndex]
      const currentSection = currentSchema?.sections[props.currentSection]
      setPhaseTitle(currentSchema?.title)
      setSectionTitle(currentSection?.title)
    }
  },[schema,selectedPhase,props.currentSection])

  // Reset save status when project changes
  useEffect(() => {
    setUpdateTime({status: t('header.edit-menu-no-save'), time: ""})
  }, [props.title])

  useEffect(() => {
    if(spinnerRef?.current?.style){
      if(saving){
        spinnerRef.current.style.visibility = "visible"
      }
      else{
        spinnerRef.current.style.visibility = "hidden"
      }
    }
  }, [saving])

  useEffect(() => {
    let latestUpdate

    if(lastSaved !== undefined && lastSaved !== null){
        if(lastSaved?.status === "error" || lastSaved?.status === "field_error"){
          // Don't include time with error status - time will be shown in tooltip only if it exists
          latestUpdate = {status:t('header.edit-menu-save-fail'),time:""}
        }
        else if(lastSaved?.status === "success"){
          // Connection restored or field validation error corrected
          // NetworkErrorState component handles "connection restored" inline notification
          // So we just update save time here, no toaster needed
          setCount(1)
          latestUpdate = {status:t('header.latest-save'),time:lastSaved.time}
          setLastSuccessfulSaveTime(lastSaved.time)
        }
        else if(lastSaved?.status === "connection_restored"){
          // Connection was restored - clear error state from header
          setCount(1)
          if (lastSaved.time) {
            setLastSuccessfulSaveTime(lastSaved.time)
            latestUpdate = {status:t('header.latest-save'),time:lastSaved.time}
          } else if (lastSuccessfulSaveTime) {
            latestUpdate = {status:t('header.latest-save'),time:lastSuccessfulSaveTime}
          } else {
            latestUpdate = {status:t('header.edit-menu-no-save'),time:""}
          }
        }
        else if(lastSaved?.status === ""){
          // Error notification was closed and field reverted to saved value
          // If something was saved this session, show last save time; otherwise show "no unsaved data"
          setCount(1)
          if (lastSuccessfulSaveTime) {
            latestUpdate = {status:t('header.latest-save'),time:lastSuccessfulSaveTime}
          } else {
            latestUpdate = {status:t('header.edit-menu-no-save'),time:""}
          }
        }
      if (latestUpdate) {
        setUpdateTime(latestUpdate)
      }
    }
  }, [lastSaved]);

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
    (!currentEnv || currentEnv === 'production') ? 'transparent' : 'var(--color-brick-light)'

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

  const navigateBack = () => {
    let path = history.location.pathname
    path = path.replace('/edit','');
    history.push(path)
  }

  const navigateBackToEdit = () => {
    let path = history.location.pathname
    path = path.replace('documents','edit');
    history.push(path)
  }

  const pathToCheck = props.location.pathname

  const saveStatusText = isConnectionRestored && updateTime?.status === t('header.edit-menu-save-fail')
    ? ''
    : `${updateTime?.status}${updateTime?.time}`

  if(pathToCheck.includes('edit')) {
    return (
      <div className={'edit-page-header' + ((!currentEnv || currentEnv === 'production') ? '' : ' edit-header-dev')}>
      <Navigation 
        label="navigation"
      >
        <Navigation.Row variant="inline">
          <Button onClick={() => navigateBack()} role="link" variant="supplementary" size="small" iconLeft={<IconAngleLeft />}>{t('header.edit-menu-back')}</Button>
          <div className='edit-page-title'>
            <div><p>{props?.title}</p></div>
            <div className='phase-section'>
              <span>{phaseTitle}</span>
              <span className='divider'>/</span>
              <span>{sectionTitle}</span>
            </div>
          </div>
          <div className={'edit-page-save ' + lastSaved?.status}>
            <div className='spinner-container' ref={spinnerRef}>
              <LoadingSpinner className="loading-spinner" small theme={{ '--spinner-color': '#0000BF' }}></LoadingSpinner>
              <span className="loading-spinner">{lastSaved?.status === "error" ? t('messages.connect-again') : ""}</span>
            </div>
            <div className='icons-container-flex'>
              {!saving && !isPollingConnection && updateTime?.status === t('header.latest-save') ? <IconCheck className='check-icon'/> : ""}
              {!saving && !isPollingConnection && updateTime?.status === t('header.edit-menu-save-fail') && !isConnectionRestored ? (
                <> <IconErrorFill className='error-icon'/> <p className="error">{updateTime?.status}</p> </>
              ) : (
                !isPollingConnection && <p>{saveStatusText}</p>
              )}
              {!saving && !isPollingConnection && updateTime?.status === t('header.edit-menu-save-fail') && lastSuccessfulSaveTime ? 
                <Tooltip placement="bottom" className='question-icon'>{t('header.latest-save')}{lastSuccessfulSaveTime}</Tooltip> : ""
              }
            </div>
          </div>
        </Navigation.Row>
      </Navigation>
      </div>
    )
  }
  else if (pathToCheck.endsWith('/documents')) {
    return (
        <div className='document-page-header'>
          <Navigation
              label="navigation"
          >
            <Navigation.Row variant="inline">
              <Button onClick={() => navigateBackToEdit()} role="link" variant="supplementary" size="small" iconLeft={<IconAngleLeft />}>{t('header.documents-menu-back')}</Button>
            </Navigation.Row>
          </Navigation>
        </div>
    )
  }
  else{
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
              as="button"
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
              as="button"
              label={t('header.projects')}
              onClick={navigateToProjects}
              className={(props.location.pathname.startsWith("/projects"))
              ? "header-nav-item active"
              : "header-nav-item " 
            }
              active={(props.location.pathname.startsWith("/projects"))
              ? true
              : false 
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
              active={(props.location.pathname === "/reports")
                ? true
                : false 
              }
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
                  else if((event.key === "Tab" && !event.shiftKey)){
                    document.dispatchEvent(new Event('click'));
                  }
                  else if (["ArrowDown","ArrowUp"].includes(event.key)) {
                    event.preventDefault();
                  }
                }}
              />
            </Navigation.User>
          </Navigation.Actions>
        </Navigation>
      </>
    )
  }
  
}

Header.propTypes = {
  location:PropTypes.object
}

export default withRouter(Header)
