import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Tag, IconArrowRight, IconArrowLeft } from 'hds-react'
import OnHoldCheckbox from '../../input/OnholdCheckbox'
import ConfirmModal from '../ConfirmModal'
import './styles.scss'
import Status from '../../common/Status'
import PropTypes from 'prop-types'

export default function QuickNav({
  currentProject,
  saveProjectBase,
  handleCheck,
  saving,
  isCurrentPhase,
  changePhase,
  notLastPhase,
  phases,
  switchDisplayedPhase,
  saveProjectBasePayload,
  setChecking,
  hasMissingFields,
  isResponsible,
  isAdmin,
  phase,
  unlockAllFields,
  changeSection,
  filterFieldsArray,
  highlightedTag,
  phasePrefix,
  phaseTitle,
  phaseStatus,
  phaseColor,
  showSections,
  documents,
  currentSchema
}) {
  const [verifying, setVerifying] = useState(false)
  const [checkButtonPressed, setCheckButtonPressed] = useState(false)
  const [allowPhaseClose, setAllowPhaseClose] = useState(false)
  const [activePhase, setActivePhase] = useState(phase)
  const [selected, setSelected] = useState(0)
  const [hasErrors, setHasErrors] = useState(false)
  const [validationOk, setValidationOk] = useState(false)
  const [options,setOptions] = useState({optionsArray:[],curPhase:{label:"",color:"",phaseID:0}})
  const [selectedPhase,setSelectedPhase] = useState({currentPhase:[],phaseID:0})
  const [currentSection,setCurrentSection] = useState(0)
  const prevSelectedRef = useRef(false);

  const { t } = useTranslation()

  const onCheckPressed = () => {
    setAllowPhaseClose(false)
    setCheckButtonPressed(true)
    const value = hasMissingFields()
    setHasErrors(value)
    setValidationOk(true)
    handleCheck(true,"checkphase")
  }

  useEffect(() => {
    const optionsArray = [];
    let curPhase = ""
  //  let phaseID = 0
  //  let title = ""

    if(phases){
      phases.map(phase => {
        let option = {label:phase.title,color:phase.color_code,phaseID:phase.id,status:phase.status};
        if(phase.id === activePhase){
          curPhase = {label:phase.title}
   //       title = phase.sections[0].title
   //       phaseID = phase.id
          prevSelectedRef.current = option
        }
        optionsArray.push(option)
    })
    }

    if(curPhase && selectedPhase.currentPhase.length === 0){
     // switchPhase(curPhase)
     // handleSectionTitleClick(title, 0, phaseID)
    }
    setOptions({optionsArray,curPhase})

  }, [phases])

  useEffect(() => {
   const curPhase = currentSchema.title
   const optionsArray = [];
   const sections = currentSchema.sections
   const id = currentSchema.id
   if(currentSchema){
    optionsArray.push({label:currentSchema.title,color:phaseColor,phaseID:currentSchema.id,status:currentSchema.status})
    setOptions({optionsArray,curPhase})
    setSelectedPhase({currentPhase:sections,phaseID:id});
    //Get last section pressed from navigation when pressing back button and returning from project card
    setCurrentSection(0)
    handleSectionTitleClick(curPhase, 0, id,sections)
    showSections(true)
   }
  }, [currentSchema])

  useEffect(() => {
    const c = document.getElementById(`title-${selected}`)
    c?.scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
  }, [selected])

  useEffect(() => {
    if (!validationOk) {
      return
    }
    if (!hasErrors) {
      setChecking(false)
      setVerifying(true)
      setValidationOk(false)
    } else {
      setChecking(true)
      setValidationOk(false)
    }
  }, [validationOk])

  useEffect(() => {
    const optionsArray = [];
    let curPhase = ""

    if(phases){
      phases.map(phase => {
        if(phase.id === activePhase){
          curPhase = {label:phase.title}
        }
        optionsArray.push({label:phase.title,color:phase.color_code,phaseID:phase.id,status:phase.status})
    })
    }

    setOptions({optionsArray,curPhase})
  }, [])


  const renderButtons = () => {
    return (
      <>
        <Button
          size="small"
          fullWidth={true}
          onClick={onCheckPressed}
          help={t('quick-nav.check-help-text')}
          disabled={currentProject.archived}
          className={checkButtonPressed ? 'check-pressed' : ''}
          variant="secondary"
        >
          {t('quick-nav.check-required')}
        </Button>

        {isResponsible && (
          <Button
            size="small"
            onClick={changeCurrentPhase}
            fullWidth={true}
            loadingText={`${
              notLastPhase ? t('quick-nav.end-phase') : t('quick-nav.archive')
            }`}
            help={`${
              notLastPhase ? t('quick-nav.end-phase-help') : t('quick-nav.archive-help')
            }`}
            disabled={!isCurrentPhase || currentProject.archived}
            variant="secondary"
          >
            {`${notLastPhase ? t('quick-nav.end-phase') : t('quick-nav.archive')}`}
          </Button>
        )}
      </>
    )
  }

  const onSaveProjectPhase = onHold => {
    saveProjectBasePayload({
      onhold: onHold,
      public: currentProject.public,
      user: currentProject.user,
      subtype: currentProject.subtype,
      create_draft: currentProject.create_draft,
      create_principles: currentProject.create_principles,
      name: currentProject.name
    })
  }

  const renderCheckBox = () => (
    <OnHoldCheckbox
      projectOnhold={currentProject.onhold}
      saveProjectBase={onSaveProjectPhase}
      name="onhold"
      disabled={saving || currentProject.archived}
      label={
        currentProject.onhold
          ? t('quick-nav.onhold-lable')
          : t('quick-nav.set-onhold-lable')
      }
    />
  )

  const changeCurrentPhase = () => {
    let prefix

    if(isNaN(phasePrefix)){
      if(phasePrefix + phaseTitle === "XLPeriaatteet"){
        prefix = 2
      }
      else if(phasePrefix + phaseTitle === "XLLuonnos"){
        prefix = 4
      }
    }
    else{
      prefix = parseInt(phasePrefix)
      //5 = XL projects
      if(currentProject.subtype === 5){

        if(prefix === 2){
          prefix = 3
        }
        else if(prefix === 3){
          prefix = 5
        }
        else if(prefix === 4){
          prefix = 6
        }
      }
    }

    let documentsDownloaded = false
    if(documents){
      for (let i = 0; i < documents.length; i++) {
        //Check if document has not been downloaded
        const documentPhases = documents[i].phases
        //Check if it is ongoing phase
        if (documentPhases.some(e => e.phase_index === prefix && e.last_downloaded === null)) {
          //Prevent phase ending because documents have not been downloaded
          documentsDownloaded = false
          break;
        }
        else{
          documentsDownloaded = true
        }
      }
    }

    setAllowPhaseClose(documentsDownloaded)
    const value = hasMissingFields()
    setHasErrors(value)
    setValidationOk(true)
    handleCheck(documentsDownloaded,"closephase")
  }

  const phaseCallback = currentChange => {
    if (currentChange) {
      if (notLastPhase) {
        changePhase()
      } else {
        saveProjectBase({ archived: true })
      }
    }
    setVerifying(false)
    setValidationOk(false)
  }

  const handleSectionTitleClick = (title, index, phaseID, fields) => {
    if (phaseID !== activePhase) {
      setActivePhase(phaseID)
      switchDisplayedPhase(phaseID)
    }
    if(title){
      setSelected(index)
    }
    //Set last navigation menu phase section selection to memory
    setCurrentSection(index)
    changeSection(index,phaseID,fields)
    unlockAllFields()
  }

  const switchPhase = (item) => {
    let currentPhase;
    let phaseID;
    prevSelectedRef.current = item

    if(phases){
      phases.map((phase) => {
        if(phase.title === item.label){
          currentPhase = phase.sections
          phaseID = phase.id
        }
      });
    }

    setSelectedPhase({currentPhase,phaseID});
    handleSectionTitleClick(item.label, currentSection, phaseID,currentPhase)
    showSections(true)
    unlockAllFields()
  }

  const calculateFilterNumber = (fields,highlighted) => {
    let filterNumber = 0
    let highlightNumber = 0
    let highlight = false

    for (let x = 0; x < fields.length; x++) {
      if(fields[x].field_subroles === highlighted){
        highlight = true
        if(filterFieldsArray.includes(fields[x].field_subroles)){
          highlightNumber = highlightNumber + 1
        }
      }
      else{
        if(filterFieldsArray.includes(fields[x].field_subroles)){
          filterNumber = filterNumber + 1
        }
      }
    }
    return [filterNumber,highlightNumber,highlight]
  }

  const hideSections = () => {
    setSelectedPhase({currentPhase:[],phaseID:0})
    showSections(false)
  } 

  return (
    <div className="quicknav-container">
      <div className="quicknav-navigation-section">

        {selectedPhase?.phaseID === 0 ? (
          <div className='quicknav-header-container'>
            <div className='quicknav-header'>
              <Button variant="supplementary" className='quicknav-allphases' aria-label="Kaikki vaiheet. Valitse vaihe alla olevasta navigaatiosta tai palaa takaisin aikaisempaan vaiheeseen" disabled={!prevSelectedRef.current} onClick={() => switchPhase(prevSelectedRef.current)} iconRight={<IconArrowRight className='right-icon' />}>
                Kaikki vaiheet
              </Button>
            </div>
            <span className='quicknav-header-info main-info'>Valitse vaihe tai palaa takaisin nuolen avulla</span>
          </div>
        ) : (
          <div className='quicknav-header-container'>
            <div className='quicknav-header'>
                <Button variant="supplementary" aria-label='Palaa takaisin vaiheiden etusivulle' onClick={() => hideSections()} iconLeft={<IconArrowLeft className='left-icon' />}>
                  {phaseTitle}
                </Button>
            </div>
          <span className='quicknav-header-info'><span className='project-status-container'><span className='project-status-text'>{phaseStatus}</span><Status color={phaseColor} /></span></span>
          </div>
        )
        }

        <nav className="quicknav-content">
        {selectedPhase?.phaseID === 0 && options?.optionsArray.map((option,index) =>{
          return (
            <Button
              id={option.label}
              aria-label={'Avaa ' + option.label + " lomakkeen sisältö"}
              key={option + index}
              variant="supplementary"
              className={`${"phase"+option.phaseID} quicknav-item ${
                option.phaseID === activePhase
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                switchPhase(option)
              }
              >
              {option.label}
              {option.status === "Vaihe käynnissä" ? <span className='project-status-container'><span>Vaihe käynnissä</span><Status color={"#FFC61E"} /></span> : ""}
            </Button>
          )
        })}
        {selectedPhase?.currentPhase.map((section, index) => {
            let fields = section.fields
            let [filterNumber,highlightNumber,highlight] = calculateFilterNumber(fields,highlightedTag)
            return (
              <Button
                id={section.title}
                tabIndex="0"
                aria-label={'Avaa ' + section.title + " lomakkeen sisältö. " + filterNumber + " suodatettua kenttää esillä. " + highlightNumber + " korostettua kenttää esillä."} 
                key={section.title}
                variant="supplementary"
                className={`quicknav-item ${"phase"+selectedPhase.phaseID} ${
                  index === selected && selectedPhase.phaseID === activePhase
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleSectionTitleClick(section.title, index, selectedPhase.phaseID,selectedPhase.currentPhase)
                }
              >
              <div className='quicknav-item-title'>{section.title} </div>
              <div className='quicknav-item-tags'>
              {filterNumber > 0 ? 
                <Tag
                  tabIndex="0"
                  className={`filter-tag`}
                  role="button"
                  key={`checkbox-${section.title}`}
                  id={`checkbox-${section.title}`}
                >
                {filterNumber}
                </Tag> 
                : 
                ''}
                {highlightNumber > 0 ? 
                <Tag
                  tabIndex="0"
                  className={`filter-tag ${highlight ? "yellow" : ""}`}
                  role="button"
                  key={`checkbox-${section.title}-highlighted`}
                  id={`checkbox-${section.title}`}
                >
                {highlightNumber}
                </Tag> 
                : 
                ''}
                </div>
              </Button>
            )
            })}
        </nav>
      </div>

      <div className="quicknav-buttons">{renderButtons()}</div>
      {isResponsible && <div className="quicknav-onhold">{renderCheckBox()}</div>}
      {isResponsible && notLastPhase && allowPhaseClose && (
        <ConfirmModal
          callback={phaseCallback}
          open={verifying}
          notLastPhase={notLastPhase}
        />
      )}
      {isAdmin && !notLastPhase && allowPhaseClose && (
        <ConfirmModal
          callback={phaseCallback}
          open={verifying}
          notLastPhase={notLastPhase}
        />
      )}
    </div>
  )
}

QuickNav.propTypes = {
  label: PropTypes.string,
  color: PropTypes.string,
  phaseID: PropTypes.string,
  status: PropTypes.string
}
