import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Select, Tag } from 'hds-react'
import OnHoldCheckbox from '../../input/OnholdCheckbox'
import ConfirmModal from '../ConfirmModal'
import { Message } from 'semantic-ui-react'
import './styles.scss'
import RoleHighlightPicker from './roleHighlightPicker/index'

export default function QuickNav({
  currentProject,
  saveProjectBase,
  handleCheck,
  handleSave,
  saving,
  errors,
  isCurrentPhase,
  changePhase,
  notLastPhase,
  phases,
  switchDisplayedPhase,
  setHighlightRole,
  saveProjectBasePayload,
  setChecking,
  hasMissingFields,
  isResponsible,
  isAdmin,
  phase,
  unlockAllFields,
  changeSection,
  filterFieldsArray
}) {
  const [endPhaseError, setEndPhaseError] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [checkButtonPressed, setCheckButtonPressed] = useState(false)
  const [activePhase, setActivePhase] = useState(phase)
  const [selected, setSelected] = useState(0)
  const [currentTimeout, setCurrentTimeout] = useState(null)
  const [hasErrors, setHasErrors] = useState(false)
  const [validationOk, setValidationOk] = useState(false)
  const [options,setOptions] = useState({optionsArray:[],curPhase:{label:""}})
  const [selectedPhase,setSelectedPhase] = useState({currentPhase:[],phaseId:0})

  const { t } = useTranslation()

  const onCheckPressed = () => {
    setCheckButtonPressed(true)
    handleCheck()
  }

/*   let curDate = new Date().toJSON().slice(0,10);
  let startDate = project.attribute_data.projektin_kaynnistys_pvm
  let endDate = project.attribute_data.kaynnistys_paattyy_pvm
  let from = new Date(startDate[2], parseInt(startDate[1])-1, startDate[0]);
  let to   = new Date(endDate[2], parseInt(endDate[1])-1, endDate[0]);
  let check = new Date(curDate[2], parseInt(curDate[1])-1, curDate[0]);
  console.log(curDate)
  console.log(project.attribute_data.projektin_kaynnistys_pvm)
  console.log(project.attribute_data.kaynnistys_paattyy_pvm)

  if((check <= from && check >= to)) {
    console.log("käynnissä")
  }
  else if(from < check){
    console.log("Aloittamatta")
  }
  else if(to > check){
    console.log("suoritettu")
  } */

  useEffect(() => {
    const optionsArray = [];
    let curPhase = ""
    let phaseId = 0
    let title = ""

    if(phases){
      phases.map(phase => {
        if(phase.id === activePhase){
          curPhase = {label:phase.title}
          title = phase.sections[0].title
          phaseId = phase.id
        }
        optionsArray.push({label:phase.title})
    })
    }

    if(curPhase && selectedPhase.currentPhase.length === 0){
      switchPhase(curPhase)
      handleSectionTitleClick(title, 0, phaseId)
    }
    setOptions({optionsArray,curPhase})
  }, [phases])

  useEffect(() => {
    const optionsArray = [];
    let curPhase = ""

    if(phases){
      phases.map(phase => {
        if(phase.id === activePhase){
          curPhase = {label:phase.title}
        }
        optionsArray.push({label:phase.title})
    })
    }

    setOptions({optionsArray,curPhase})
  }, [])

  useEffect(() => {
    const c = document.getElementById(`title-${selected}`)
    c && c.scrollIntoView()
  }, [selected])

  useEffect(() => {
    if (!validationOk) {
      return
    }
    if (!hasErrors) {
      setEndPhaseError(false)
      setChecking(false)
      setVerifying(true)
      setValidationOk(false)
    } else {
      setEndPhaseError(true)
      clearTimeout(currentTimeout)
      setCurrentTimeout(setTimeout(() => setEndPhaseError(false), 5000))
      setChecking(true)
      setValidationOk(false)
    }
  }, [validationOk])

  const renderButtons = () => {
    return (
      <>
        <Button
          onClick={onCheckPressed}
          help={t('quick-nav.check-help-text')}
          disabled={currentProject.archived}
          className={checkButtonPressed ? 'check-pressed' : ''}
          variant="secondary"
        >
          {t('quick-nav.check')}
        </Button>
        <Button
          onClick={handleSave}
          isLoading={saving || errors}
          loadingText={t('common.save')}
          help={t('quick-nav.save-help')}
          disabled={currentProject.archived}
          variant="secondary"
        >
          {t('common.save')}
        </Button>

        {isResponsible && (
          <Button
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
    const value = hasMissingFields()
    setHasErrors(value)
    setValidationOk(true)
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
    setEndPhaseError(false)
  }

  const handleSectionTitleClick = (title, index, phaseId) => {
    if (phaseId !== activePhase) {
      setActivePhase(phaseId)
      switchDisplayedPhase(phaseId)
    }
    if(title){
      setSelected(index)
    }

    changeSection(index,phaseId)
    unlockAllFields()
  }

/*   const handleAccordionTitleClick = titleIndex => {
    const shouldChangePhase = activePhase !== titleIndex

    if (shouldChangePhase) {
      setActivePhase(activePhase === titleIndex ? null : titleIndex)

      switchDisplayedPhase(titleIndex)

      const accordionTitle = document.getElementById('accordion-title')
      if (accordionTitle) {
        accordionTitle.scrollIntoView()
      }
    }
    unlockAllFields()
  } */

  const switchPhase = (item) => {
    let currentPhase;
    let phaseId;

    if(phases){
      phases.map((phase) => {
        if(phase.title === item.label){
          currentPhase = phase.sections
          phaseId = phase.id
        }
      });
    }

    setSelectedPhase({currentPhase,phaseId});
    handleSectionTitleClick(item.label, 0, phaseId)
  }

  const calculateFilterNumber = (fields) => {
    let filterNumber = 0
    for (let x = 0; x < fields.length; x++) {
      if(filterFieldsArray.includes(fields[x].field_subroles)){
        filterNumber = filterNumber + 1
      }
    }
    return filterNumber
  }

  return (
    <div className="quicknav-container">
      <div className="quicknav-navigation-section">
      <Select placeholder={options.curPhase.label} options={options.optionsArray} onChange={switchPhase} />
        {/* <h2 tabIndex="0" id='quicknav-main-title' className="quicknav-title"> {t('quick-nav.title')}</h2> */}
        <div className="quicknav-content">
        {selectedPhase.currentPhase &&
          selectedPhase.currentPhase.map((section, index) => {
            let fields = section.fields
            let filterNumber = calculateFilterNumber(fields)
            return (
              <Button
                key={index}
                variant="supplementary"
                className={`quicknav-item ${
                  index === selected && selectedPhase.phaseId === activePhase
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleSectionTitleClick(section.title, index, selectedPhase.phaseId)
                }
              >
                <div> {section.title} 
                {filterNumber > 0 ? 
                  <Tag
                    className='filter-tag'
                    role="link"
                    key={`checkbox-${section.title}`}
                    id={`checkbox-${section.title}`}
                    aria-label={section.title}
                  >
                  {filterNumber}
                  </Tag> 
                  : 
                  ''}
                  </div>
              </Button>
            )
            })}
        </div>
      </div>
      <RoleHighlightPicker onRoleUpdate={setHighlightRole} />

      <div className="quicknav-buttons">{renderButtons()}</div>
      {isResponsible && <div className="quicknav-onhold">{renderCheckBox()}</div>}
      {isResponsible && notLastPhase && (
        <ConfirmModal
          callback={phaseCallback}
          open={verifying}
          notLastPhase={notLastPhase}
        />
      )}
      {isAdmin && !notLastPhase && (
        <ConfirmModal
          callback={phaseCallback}
          open={verifying}
          notLastPhase={notLastPhase}
        />
      )}
      {endPhaseError && (
        <Message
          header={t('quick-nav.change-phase-error')}
          content={t('quick-nav.change-phase-error-message')}
          color="yellow"
        />
      )}
    </div>
  )
}
