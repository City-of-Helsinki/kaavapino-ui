import React, { useState, useEffect } from 'react'
import {
  Navigation,
  IconSignout,
  IconPlus,
  IconPen,
  IconDownload,
  IconRefresh
} from 'hds-react'
import { withRouter, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from './ConfirmationModal'
import 'hds-core'
import { Button,IconAngleLeft,IconCross } from 'hds-react';
import { useSelector } from 'react-redux'
import { usersSelector } from '../../selectors/userSelector'
import authUtils from '../../utils/authUtils'
import { authUserSelector } from '../../selectors/authSelector'
import { lastSavedSelector } from '../../selectors/projectSelector'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

const Header = props => {
  const { t } = useTranslation()
  const [showConfirm, setShowConfirm] = useState(false)
  const [updateTime, setUpdateTime] = useState({status: t('header.edit-menu-no-save'),time: ""})
  const history = useHistory();

  const users = useSelector(state => usersSelector(state))
  const user = useSelector(state => authUserSelector(state))
  const lastSaved = useSelector(state => lastSavedSelector(state))

  const currentUser = users.find(
    item => user && user.profile && item.id === user.profile.sub
  )

  const userIsResponsible = currentUser
    ? authUtils.isResponsible(currentUser.id, users)
    : false

  const currentEnv = process.env.REACT_APP_ENVIRONMENT
  
  useEffect(() => {
    let latestUpdate
    if(lastSaved?.time){
      if(lastSaved?.status){
        latestUpdate = {status:t('header.edit-menu-saved'),time:lastSaved.time}
        let elements = ""
        if(lastSaved?.fields){
          elements =
          <div>
            <div>
              <h3>{t('messages.could-not-save-header')}
                <span className='icon-container'><IconCross size="s" /></span>
              </h3>
            </div>
            <div className='middle-container'>
              <p>
                {t('messages.could-not-save-fields-text')}
              </p>
              <p>
                - {lastSaved?.fields[0]}
              </p>
              {lastSaved?.fields.length > 1 ?
                <p>
                  + {lastSaved?.fields.length -1 + " " + t('messages.other-fields')}
                </p>
                :
                ""
              }
            </div>
            <div className='bottom-container'>
              <p>{t('messages.could-not-save-text')}</p>
            </div>
            <div className='button-container'>
              <span className='last-saved-info'>{t('messages.tried-to-save')} {lastSaved.time}</span>
              <Button size="small">{t('messages.tryagain')}</Button>
            </div>
          </div>
        }
        if(toast.isActive("saveFailToastr") && lastSaved?.status === "error"){
          latestUpdate = {status:t('header.edit-menu-save-fail'),time:lastSaved.time}
        // update a toast if already visible
          toast.update("saveFailToastr", {
            type:toast.error,
            render:elements
          });
        }
        else if(toast.isActive("saveFailToastr") && lastSaved?.status === "success"){
          latestUpdate = {status:t('header.edit-menu-saved'),time:lastSaved.time}
          // dismiss a toast if already visible and not failing any more
          toast.dismiss("saveFailToastr")
          elements = <div>
          <div>
            <h3>{t('messages.save-success-header')}
              <span className='icon-container'><IconCross size="s" /></span>
            </h3>
          </div>
          <div>
            <p>{t('messages.save-success-text')}
            </p>
          </div>
        </div>
        //show toastr message
        toast.success(elements, {
          toastId:"noErrorsToastr",
          position: "top-right",
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          progress: undefined,
          theme: "light"
          });
        }
        else{
        //show toastr message
        if(lastSaved?.fields){
          latestUpdate = {status:t('header.edit-menu-save-fail'),time:lastSaved.time}
          toast.error(elements, {
            toastId:"saveFailToastr",
            position: "top-right",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
            progress: undefined,
            theme: "light"
            });
          } 
        }
      }
      setUpdateTime(latestUpdate)
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

  const navigateBack = () => {
    history.goBack()
  }

  const pathToCheck = props.location.pathname

  if(pathToCheck.endsWith('/edit')){
    return (
      <div className='edit-page-header'>
      <Navigation 
        label="navigation"
      >
        <Navigation.Row variant="inline">
          <Button onClick={() => navigateBack()} role="link" variant="supplementary" size="small" iconLeft={<IconAngleLeft />}>{t('header.edit-menu-back')}</Button>
          <div className='edit-page-title'><p>{props?.title}</p></div>
          <div className={'edit-page-save ' + lastSaved?.status}><p>{updateTime?.status}{updateTime?.time}</p></div>
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
            <Navigation.User userName={label} authenticated={true}>
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
  
}

export default withRouter(Header)
