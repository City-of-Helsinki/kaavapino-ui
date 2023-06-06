import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Select } from 'hds-react'
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
  unlockAllFields
}) {
  const [endPhaseError, setEndPhaseError] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [checkButtonPressed, setCheckButtonPressed] = useState(false)
  const [activePhase, setActivePhase] = useState(phase)
  const [selected, setSelected] = useState(0)
  const [currentTimeout, setCurrentTimeout] = useState(null)
  const [hasErrors, setHasErrors] = useState(false)
  const [validationOk, setValidationOk] = useState(false)
  const [options,setOptions] = useState({optionsArray:[],curPhase:{}})
  const [selectedPhase,setSelectedPhase] = useState({currentPhase:[],phaseId:0})

  const { t } = useTranslation()

  const onCheckPressed = () => {
    setCheckButtonPressed(true)
    handleCheck()
  }

  useEffect(() => {
    const optionsArray = [];
    let curPhase = ""
    if(phases){
      phases.map(phase => {
        if(phase.id === activePhase){
          curPhase = phase
        }
        optionsArray.push({label:phase.title})
    })
    }
    setOptions({optionsArray,curPhase})
  }, [phases])

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
      setSelected(title)
    }
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
    let i;
    if(phases){
      phases.map((phase,index) => {
        if(phase.title === item.label){
          currentPhase = phase.sections
          phaseId = phase.id
          i = index
        }
      });
    } 
    setSelectedPhase({currentPhase,phaseId});
    handleSectionTitleClick(item.label, i, phaseId)
  }

  return (
    <div className="quicknav-container">
      <div className="quicknav-navigation-section">
      <Select label="Vaiheet" helper="Vaihda vaiheita" placeholder="Vaiheet" options={options.optionsArray} onChange={switchPhase} />
        {/* <h2 tabIndex="0" id='quicknav-main-title' className="quicknav-title"> {t('quick-nav.title')}</h2> */}
        <div className="quicknav-content">
        {selectedPhase.currentPhase &&
          selectedPhase.currentPhase.map((section, index) => {
            return (
              <Button
                key={index}
                variant="supplementary"
                className={`quicknav-item ${
                  section.title === selected && selectedPhase.phaseId === activePhase
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleSectionTitleClick(section.title, index, selectedPhase.phaseId)
                }
              >
                <div> {section.title}</div>
              </Button>
            )
            })}
           {/* {phases &&
            phases.map(phase => (
              <Accordion
                initiallyOpen={activePhase === phase.id}
                className="phase-accordion"
                heading={
                  <Button
                    variant="supplementary"
                    className={
                      activePhase === phase.id
                        ? 'accordion-button active'
                        : 'accordion-button'
                    }
                    onClick={() => handleAccordionTitleClick(phase.id)}
                  >{`${phase.list_prefix}. ${phase.title}`}</Button>
                }
                key={phase.id}
              >
                {phase.sections &&
                  phase.sections.map((section, index) => {
                    return (
                      <Button
                        key={index}
                        variant="supplementary"
                        className={`quicknav-item ${
                          section.title === selected && phase.id === activePhase
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          handleSectionTitleClick(section.title, index, phase.id)
                        }
                      >
                        <div> {section.title}</div>
                      </Button>
                    )
                  })}
              </Accordion>
            ))} */}
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
