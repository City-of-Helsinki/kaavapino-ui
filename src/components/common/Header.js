import React, { useState, useEffect, useRef } from 'react'
import {
  Navigation,
  Button,
  IconSignout,
  IconAngleLeft,
  IconCross,
  IconCheck,
  LoadingSpinner
} from 'hds-react'
import { withRouter, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from './ConfirmationModal'
import 'hds-core'
import { useSelector } from 'react-redux'
import { usersSelector } from '../../selectors/userSelector'
import { authUserSelector } from '../../selectors/authSelector'
import { lastSavedSelector,pollSelector,savingSelector,selectedPhaseSelector } from '../../selectors/projectSelector'
import { schemaSelector } from '../../selectors/schemaSelector'
import schemaUtils from '../../utils/schemaUtils'
import {useInterval} from '../../hooks/connectionPoller';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

const Header = props => {
  const { t } = useTranslation()
  const [showConfirm, setShowConfirm] = useState(false)
  const [updateTime, setUpdateTime] = useState({status: t('header.edit-menu-no-save'),time: ""})
  const [count, setCount] = useState(1)
  const [latestErrorField,setLatestErrorField] = useState()
  const [errorFields,setErrorFields] = useState([])
  const [errorValues,setErrorValues] = useState([])
  const [errorCount,setErrorCount] = useState(1)
  const [phaseTitle,setPhaseTitle] = useState("")
  const [sectionTitle,setSectionTitle] = useState("")

  const history = useHistory();
  const spinnerRef = useRef(null);

  const users = useSelector(state => usersSelector(state))
  const user = useSelector(state => authUserSelector(state))
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const connection = useSelector(state => pollSelector(state))
  const saving =  useSelector(state => savingSelector(state))
  const schema = useSelector(state => schemaSelector(state))
  const selectedPhase = useSelector(state => selectedPhaseSelector(state))

  const currentUser = users.find(
    item => user && user.profile && item.id === user.profile.sub
  )

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

  const getFieldSetValues = (object) => {
    const arrayValues = []
    let index = 1;
    for (let i = 0; i < object.length; i++) {
      let fieldsetObject = object[i];
      for (var data in fieldsetObject) {
        if (Object.prototype.hasOwnProperty.call(fieldsetObject, data)) {
          if(fieldsetObject[data]?.ops){
            const opsArray = fieldsetObject[data].ops
            for (let i = 0; i < opsArray.length; i++) {
              arrayValues.push("fieldset-"+index)
              arrayValues.push(data+": "+opsArray[i].insert);
              index = index + 1
            }
          }
        }
      } 
    }
    return arrayValues
  }

  useEffect(() => {
    if(schema?.phases){
      const currentSchemaIndex = schema?.phases.findIndex(s => s.id === schemaUtils.getSelectedPhase(props.location.search,selectedPhase))
      const currentSchema = schema?.phases[currentSchemaIndex]
      const currentSection = currentSchema?.sections[props.currentSection]
      setPhaseTitle(currentSchema?.title)
      setSectionTitle(currentSection?.title)
    }
  },[schema,selectedPhase,props.currentSection])

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
    if(lastSaved?.time && lastSaved?.status){
        latestUpdate = {status:t('header.edit-menu-saved'),time:lastSaved.time}
        let elements = ""
        if(lastSaved?.fields){
          //Get the latest field and value from error fields and set the values for this toast
          newErrorField = lastSaved?.fields.filter(x => !errorFields.includes(x));
          if(newErrorField.length === 0){
            newErrorField=latestErrorField
          }
          let newErrorValue = lastSaved?.values.filter(x => !errorValues.includes(x));
          //Rirchtext and selects can be array values so get copy pastable values from them
          let arrayValues = [];

          if(Array.isArray(newErrorValue)){
            if(newErrorValue[0]?.ops){
              const opsArray = newErrorValue[0].ops
              for (let i = 0; i < opsArray.length; i++) {
                arrayValues.push(opsArray[i].insert);
              }
              newErrorValue = arrayValues.toString()
              arrayValues = []
            }
            else if(typeof newErrorValue[0] === 'object' && newErrorValue[0] !== null){
              //Fieldset values to copy pasteble format
              let object = newErrorValue[0]
              arrayValues = getFieldSetValues(object)
            }
          }
          //Get normal or array value and make sure it is formated as string
          let errorTextValue = arrayValues.length > 0 ? arrayValues : newErrorValue.toString()
          let copyFieldsetValues = arrayValues.map(a => a).join("\n")
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
                    <p className='font-bold'>{arrayValues.length > 0 ? t('messages.fieldset') :t('messages.field')}:</p> 
                    <a className='link-underlined' type="button" onKeyDown={(event) => {if (event.key == 'Enter' || event.key === "Space"){scrollToAnchor("id",newErrorField)}}} onClick={() => scrollToAnchor("id",newErrorField)}>{newErrorField}</a>
                  </>
                  :
                  <a className='link-underlined' type="button" onKeyDown={(event) => {if (event.key == 'Enter' || event.key === "Space"){scrollToAnchor("class",".max-chars-error,.Virhe,.error-text")}}} onClick={() => scrollToAnchor("class",".max-chars-error,.Virhe,.error-text")}>{t('messages.show-errors')}</a>
                }
                </div>
                <div className='error-value'>
                  {errorTextValue.includes("[object Object]") 
                  ? 
                    <p className='font-bold'>{t('messages.addfield')}</p>  
                  : 
                  <>
                  {arrayValues.length > 0 
                  ? 
                    <p className='fieldset-info'>{t('messages.total')} {arrayValues.length} {t('messages.fields')}</p>
                  :
                    errorContent
                  }
                  </>
                  }
                </div>
                <div className='error-button-container'>
                  {lastSaved?.status === "error" && !lastSaved.lock ? 
                  <Button size="small" onClick={() => {navigator.clipboard.writeText(arrayValues.length > 0 ? 
                    copyFieldsetValues : errorTextValue)}}>{t('messages.copy-value')}</Button>
                  : 
                  <></>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        if(lastSaved?.status === "error" || lastSaved?.status === "field_error"){
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
          setLatestErrorField(newErrorField)
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

  const scrollToAnchor = (type,anchor) => {
    const anchorElement = type === "id" ? document.getElementById(anchor) : document.querySelectorAll(anchor)[0]
    //Set offset so field is not hidden under sticky filter menu
    if(anchorElement){
      anchorElement.scrollIntoView({ block: "start" });
      window.scrollBy(0, -200);
      let highlighContainer = anchorElement.closest(".input-container")
      highlighContainer.classList.add("highligh-error");
      setTimeout(() => {
        highlighContainer.classList.remove("highligh-error");
      }, 2000)
    }
  }

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
    let path = history.location.pathname
    path = path.replace('edit','');
    history.push(path)
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
          <div className='edit-page-title'>
            <div><p>{props?.title}</p></div>
            <div><span>{phaseTitle} / {sectionTitle}</span></div>
          </div>
          <div className={'edit-page-save ' + lastSaved?.status}>
            <div className='spinner-container' ref={spinnerRef}>
              <LoadingSpinner className="loading-spinner" small></LoadingSpinner>
              <span className="loading-spinner">{lastSaved?.status === "error" ? t('messages.connect-again') : ""}</span>
            </div>
            {updateTime?.status === t('header.edit-menu-saved') ? <IconCheck className='check-icon'/> : ""}
            <p className={updateTime?.status === t('header.edit-menu-save-fail') ? "error" : ""}>{updateTime?.status}{updateTime?.time}</p>
          </div>
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
