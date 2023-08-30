import React, { useState, useEffect, useRef } from 'react'
import {
  Navigation,
  IconSignout,
  IconPlus,
  IconPen,
  IconDownload,
  IconRefresh,
  Button,
  IconAngleLeft,
  IconCross,
  LoadingSpinner,
  Accordion
} from 'hds-react'
import { withRouter, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from './ConfirmationModal'
import 'hds-core'
import { useSelector } from 'react-redux'
import { usersSelector } from '../../selectors/userSelector'
import authUtils from '../../utils/authUtils'
import { authUserSelector } from '../../selectors/authSelector'
import { lastSavedSelector,pollSelector } from '../../selectors/projectSelector'
import {useInterval} from '../../hooks/connectionPoller';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

const Header = props => {
  const { t } = useTranslation()
  const [showConfirm, setShowConfirm] = useState(false)
  const [updateTime, setUpdateTime] = useState({status: t('header.edit-menu-no-save'),time: ""})
  const [count, setCount] = useState(1)
  const [errorFields,setErrorFields] = useState([])
  const [errorValues,setErrorValues] = useState([])
  const [errorCount,setErrorCount] = useState(1)

  const history = useHistory();
  const spinnerRef = useRef(null);

  const users = useSelector(state => usersSelector(state))
  const user = useSelector(state => authUserSelector(state))
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const connection = useSelector(state => pollSelector(state))

  const currentUser = users.find(
    item => user && user.profile && item.id === user.profile.sub
  )

  const userIsResponsible = currentUser
    ? authUtils.isResponsible(currentUser.id, users)
    : false

  const currentEnv = process.env.REACT_APP_ENVIRONMENT
  
  useInterval(() => {
    //polls connection to backend if there is error
    //doubles the time after each try
    if(lastSaved?.status === "error"){
      setCount(count + count)
      if(spinnerRef?.current?.style){
        spinnerRef.current.style.visibility = "visible"
        setTimeout(() => {
          spinnerRef.current.style.visibility = "hidden"
        }, 5000)
      }
    }
    props.pollConnection()
  }, lastSaved?.status === "error" ? 1000 * count * 10 : 0);

  useEffect(() => {
    let latestUpdate
    if(lastSaved?.time && lastSaved?.status){
        latestUpdate = {status:t('header.edit-menu-saved'),time:lastSaved.time}
        let elements = ""
        if(lastSaved?.fields){
          //Get the latest field and value from error fields and set the values for this toast
          let newErrorField = lastSaved?.fields.filter(x => !errorFields.includes(x));
          let newErrorValue = lastSaved?.values.filter(x => !errorValues.includes(x));
          //Rirchtext and selects can be array values so get copy pastable values from them
          const arrayValues = [];
          if(Array.isArray(newErrorValue)){
            if(newErrorValue[0]?.ops){
              const opsArray = newErrorValue[0].ops
              for (let i = 0; i < opsArray.length; i++) {
                arrayValues.push(opsArray[i].insert);
              }
            }
          }
          //Get normal or array value and make sure it is formated as string
          let errorTextValue = arrayValues.length > 0 ? arrayValues.toString() : newErrorValue.toString()

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
              <Accordion className='error-info-accordian' size="s" closeButton={false} closeButtonClassName="error-info-close" card border heading="Näytä tiedot" language="fi" style={{ maxWidth: '312px' }}>
                <div className='error-field'>
                {t('messages.field')}: {newErrorField}
                </div>
                <div className='error-value'>
                {t('messages.value')}: {errorTextValue}
                </div>
                <div className='error-button-container'>
                <Button size="small" onClick={() => {navigator.clipboard.writeText(errorTextValue)}}>{t('messages.copy-value')}</Button>
                </div>
              </Accordion>
            </div>
            <div className='bottom-container'>
              <p>{t('messages.could-not-save-text')}</p>
            </div>
            <div className='button-container'>
              <span className='last-saved-info'>{t('messages.tried-to-save')} {lastSaved.time}</span>
              <div className='spinner-container' ref={spinnerRef}>
                <LoadingSpinner className="loading-spinner" small></LoadingSpinner>
                <span className="loading-spinner">{t('messages.connect-again')}</span>
              </div>
            </div>
          </div>
        }

        if(lastSaved?.status === "error"){
          latestUpdate = {status:t('header.edit-menu-save-fail'),time:lastSaved.time}
          let errors = errorCount
          // show new toastr error
          toast.error(elements, {
            toastId:errorCount,
            className: "saveFailToastr",
            position: "top-right",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: false,
            draggable: false,
            progress: undefined,
            theme: "light",
            closeButton: <Button className='close-button' size="small" variant='supplementary' onClick={() => dismiss(errorCount)}><IconCross size="s" /></Button>
          });
          setErrorFields(lastSaved?.fields)
          setErrorValues(lastSaved?.values)
          //Add error toast count, used as an toastid needed to close correct toast
          setErrorCount(errors + 1)
        }
        else if(lastSaved?.status === "success" && connection.connection){
          //set polling time to default
          setCount(1)
          latestUpdate = {status:t('header.edit-menu-saved'),time:lastSaved.time}
          elements = <div>
          <div>
            <h3>{t('messages.connection-info-header')}
              <span className='icon-container'><IconCross size="s" /></span>
            </h3>
          </div>
          <div>
            <p>{t('messages.connection-info-text')}
            </p>
          </div>
        </div>
        //show toastr info when connection ok
        toast.info(elements, {
          toastId:"saveOk",
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
      
      setUpdateTime(latestUpdate)
    }
  }, [lastSaved]);

  const dismiss = (toastId) =>  {
    toast.dismiss(toastId);
  }

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
