import React, { useState, useEffect, useRef } from 'react'
import {
  Navigation,
  Button,
  IconSignout,
  IconAngleLeft,
  IconCross,
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
import { lastSavedSelector,savingSelector,selectedPhaseSelector } from '../../selectors/projectSelector'
import { schemaSelector } from '../../selectors/schemaSelector'
import schemaUtils from '../../utils/schemaUtils'
import {useInterval} from '../../hooks/connectionPoller'
import { formatFieldValue } from '../../utils/fieldValueFormatter'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'
import PropTypes from 'prop-types'

const Header = props => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [showConfirm, setShowConfirm] = useState(false)
  const [updateTime, setUpdateTime] = useState({status: t('header.edit-menu-no-save'),time: ""})
  const [lastSuccessfulSaveTime, setLastSuccessfulSaveTime] = useState("") // Track last successful save time for tooltip
  const [count, setCount] = useState(1)
  const [latestErrorField,setLatestErrorField] = useState()
  const [errorFields,setErrorFields] = useState([])
  const [errorValues,setErrorValues] = useState([])
  const [errorCount,setErrorCount] = useState(1)
  const [phaseTitle,setPhaseTitle] = useState("")
  const [sectionTitle,setSectionTitle] = useState("")
  const [existingErrors,setExistingErrors] = useState([])
  const [isPollingConnection, setIsPollingConnection] = useState(false)

  const history = useHistory();
  const spinnerRef = useRef(null);

  const users = useSelector(state => usersSelector(state))
  const user = useSelector(state => authUserSelector(state))
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const saving =  useSelector(state => savingSelector(state))
  const schema = useSelector(state => schemaSelector(state))
  const selectedPhase = useSelector(state => selectedPhaseSelector(state))

  const currentUser = users.find(
    item => user && user.profile && item.id === user.profile.sub
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
    if(lastSaved?.status === "error" && !lastSaved?.lock){
      setCount(count + count)
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
  }, lastSaved?.status === "error" || lastSaved?.status === "field_error" && !lastSaved?.lock ? 1000 * count * 10 : 0);

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
    let newErrorField

    if(lastSaved !== undefined && lastSaved !== null){
        let elements = ""
        if(lastSaved?.fields){
          //Get the latest field and value from error fields and set the values for this toast
          newErrorField = lastSaved?.fields.filter(x => !errorFields.includes(x));
          if(newErrorField.length === 0){
            newErrorField=latestErrorField
          }
          let newErrorValue = lastSaved?.values.filter(x => !errorValues.includes(x));
          
          // For fieldset errors, the value is an array containing the fieldset data
          // Extract the actual fieldset data from the array wrapper
          const valueToFormat = newErrorValue.length > 0 ? newErrorValue[0] : newErrorValue;
          
          // Use utility function to format field value for display
          const { text: errorTextValue, copyText: copyFieldsetValues } = formatFieldValue(valueToFormat);
          
          // Check if the error value is a fieldset array (for UI display logic)
          const isFieldsetArray = Array.isArray(newErrorValue) && newErrorValue.length > 0 && typeof newErrorValue[0] === 'object';
          const fieldsetItemCount = isFieldsetArray ? newErrorValue.length : 0;
          
          const connectionOrLockErrorHeader = lastSaved.lock ? t('messages.could-not-lock-header') : t('messages.could-not-save-header')
          const connectionOrLockErrorText = lastSaved.lock ?       
            <p>
            {t('messages.could-not-lock-text')}
            </p>
            : 
            <>
            <p>
            {t('messages.could-not-save-fields-text')}
            </p>
            <p>
            {t('messages.could-not-save-fields-text2')}
            </p>
          </>
          const fieldErrorHeader = t('messages.field-error-prevent-save-header')
          const fieldErrorText = t('messages.field-error-prevent-save-text')
          const errorHeader = lastSaved?.status === "error" ? connectionOrLockErrorHeader : fieldErrorHeader
          const errorTexts = lastSaved?.status === "error" ? connectionOrLockErrorText : fieldErrorText
          //Errors that do not trigger error toastr right away(empty, too many chars etc)
          const visibleErrorFields = lastSaved?.fields ? lastSaved.fields : []
          const errorContent = lastSaved?.status === "error" && !lastSaved.lock ?
          <> 
            <p className='font-bold'>{t('messages.value')}:</p> 
            <p>{errorTextValue}</p>
          </>
          :
          <>
          </>
          elements =
          <div>
            <div>
              <h3>{errorHeader}
                <span className='icon-container'><IconCross size="s" /></span>
              </h3>
            </div>
            <div className='middle-container'>
              {errorTexts}

              <div className='error-fields-container'>
                <div className='error-field'>
                {lastSaved?.status === "error" ?
                  <>
                    <p className='font-bold'>{fieldsetItemCount > 0 ? t('messages.fieldset') :t('messages.field')}:</p> 
                    <a className='link-underlined' type="button" onKeyDown={(event) => {if (event.key == 'Enter' || event.key === "Space"){scrollToAnchor("id",newErrorField)}}} onClick={() => scrollToAnchor("id",newErrorField)}>{document.getElementById(newErrorField)?.textContent}</a>
                  </>
                  :
                  <>
                  <div className='visible-errors'>
                    <p className='font-bold'>{t('messages.fields-multiple')}:</p>
                    {visibleErrorFields.map((item,i) => (
                      <p key={item[i]} className='font-bold'>{item}</p>
                      ))
                    }
                  </div>
                  <a className='link-underlined' type="button" onKeyDown={(event) => {if (event.key == 'Enter' || event.key === "Space"){scrollToAnchor("class",".max-chars-error,.Virhe,.error-text")}}} onClick={() => scrollToAnchor("class",".max-chars-error,.Virhe,.error-text")}>{t('messages.show-errors')}</a>
                  </>
                }
                </div>
                <div className='error-value'>
                  {errorTextValue.includes("[object Object]") 
                  ? 
                    <p className='font-bold'>{t('messages.addfield')}</p>  
                  : 
                  <>
                  {fieldsetItemCount > 0 
                  ? 
                    <p className='fieldset-info'>{t('messages.total')} {fieldsetItemCount} {t('messages.fields')}</p>
                  :
                    errorContent
                  }
                  </>
                  }
                </div>
                <div className='error-button-container'>
                  {lastSaved?.status === "error" && !lastSaved.lock ? 
                  <Button size="small" onClick={() => {
                    const textToCopy = copyFieldsetValues || errorTextValue;
                    navigator.clipboard.writeText(textToCopy);
                  }}>{t('messages.copy-value')}</Button>
                  : 
                  <></>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        if(lastSaved?.status === "error" || lastSaved?.status === "field_error"){
          // Don't include time with error status - time will be shown in tooltip only if it exists
          latestUpdate = {status:t('header.edit-menu-save-fail'),time:""}
          
          const allErrorsAlreadyShown = lastSaved?.fields.every(r=> existingErrors.includes(r))
          
          // Skip toaster if all errors have already been shown to user
          if (allErrorsAlreadyShown) {
            // Continue to update latestUpdate below
          } else {
            // Determine if we should show a toaster notification
            const shouldShowToaster = shouldShowErrorToaster(lastSaved);
            
            if(shouldShowToaster){
              // show new toastr error
              const errors = errorCount
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
              //Add error toast count, used as an toastid needed to close correct toast
              setErrorCount(errors + 1)
              setErrorFields(lastSaved?.fields)
              setErrorValues(lastSaved?.values)
              setLatestErrorField(newErrorField)
              const newError = lastSaved?.fields[lastSaved?.fields.length - 1]
              //Push to state if not existing in it
              if(!existingErrors.includes(newError)){
                let errorList = existingErrors
                errorList.push(newError)
                //this state controls error toastr pop up
                setExistingErrors(errorList)
              }
            }
          }
        }
        else if(lastSaved?.status === "success"){
          // Connection restored or field validation error corrected
          // NetworkErrorState component handles "connection restored" inline notification
          // So we just update save time here, no toaster needed
          setCount(1)
          setExistingErrors([])
          latestUpdate = {status:t('header.latest-save'),time:lastSaved.time}
          setLastSuccessfulSaveTime(lastSaved.time) // Save for error tooltip
        }
        else if(lastSaved?.status === ""){
          // Error notification was closed and field reverted to saved value
          // Show "no unsaved data" message
          setCount(1)
          setExistingErrors([])
          latestUpdate = {status:t('header.edit-menu-no-save'),time:""}
        }
      if (latestUpdate) {
        setUpdateTime(latestUpdate)
      }
    }
  }, [lastSaved]);

  const scrollToAnchor = (type,anchor) => {
    const anchorElement = type === "id" ? document.getElementById(anchor) : document.querySelectorAll(anchor)[0]

    if(anchorElement){
      const isFieldSet = anchorElement.closest(".fieldset-container");
      let highlighContainer 
      if(isFieldSet){
        //Focus to fieldset main container
        isFieldSet.scrollIntoView({ block: "start" });
        highlighContainer = isFieldSet.closest(".input-container")
      }
      else{
        //Focus to normal field
        anchorElement.scrollIntoView({ block: "start" });
        highlighContainer = anchorElement.closest(".input-container")
      }
      //Set offset so field is not hidden under sticky filter menu
      window.scrollBy(0, -200);
      highlighContainer.classList.add("highligh-error");
      setTimeout(() => {
        highlighContainer.classList.remove("highligh-error");
      }, 2000)
    }
  }

  const dismiss = (toastId) =>  {
    toast.dismiss(toastId);
  }

  /**
   * Determines if an error toaster should be shown based on error type and field
   * 
   * Show toaster for:
   * 1. Network errors in fieldsets (status='error', not 'field_error')
   *    - because fieldset closes and user loses access to their data
   *    - "Copy value" button in toaster provides data recovery
   * 
   * Don't show toaster for:
   * - Lock errors - shown inline via NetworkErrorState
   * - Regular validation errors (status='field_error') - shown inline via NetworkErrorState
   */
  const shouldShowErrorToaster = (lastSaved) => {
    // For network errors (not validation errors or lock errors), check if it's a fieldset
    if (lastSaved?.status === "error" && !lastSaved?.lock && lastSaved?.fields) {
      const isFieldsetError = lastSaved.fields.some(field => 
        field.includes('[') || field.endsWith('_fieldset')
      );
      return isFieldsetError;
    }
    
    // All other cases: don't show toaster (inline notification handles it)
    return false;
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
              {!saving && !isPollingConnection && updateTime?.status === t('header.edit-menu-save-fail') ? (
                <> <IconErrorFill className='error-icon'/> <p className="error">{updateTime?.status}</p> </>
              ) : (
                !isPollingConnection && <p>{updateTime?.status}{updateTime?.time}</p>
              )}
              {!saving && !isPollingConnection && updateTime?.status === t('header.edit-menu-save-fail') && lastSuccessfulSaveTime ? <Tooltip placement="bottom" className='question-icon'>{t('header.latest-save')}{lastSuccessfulSaveTime}</Tooltip> : ""}
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
