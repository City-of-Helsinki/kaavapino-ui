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
  filterFieldsArray,
  highlightedTag,
  visibleFields
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

  useEffect(() => {
    let numberOfFields = calculateFields()
    if (typeof visibleFields === 'function'){
      visibleFields(numberOfFields)
    }

  }, [selectedPhase])

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
    const c = document.getElementById(`title-${selected}`)
    c?.scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
    let numberOfFields = calculateFields()

    if (typeof visibleFields === 'function'){
      visibleFields(numberOfFields)
    }
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

  const calculateFields = () => {
    let numberOfFields = document.querySelectorAll(':not(.fieldset-container) > .input-container').length
    return numberOfFields
  }

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
    unlockAllFields()
  }

  const calculateFilterNumber = (fields,highlighted) => {
    let filterNumber = 0
    let highlight = false

    for (let x = 0; x < fields.length; x++) {
      if(filterFieldsArray.includes(fields[x].field_subroles)){
        filterNumber = filterNumber + 1
      }
      if(fields[x].field_subroles === highlighted){
        highlight = true
      }
    }
    return [filterNumber,highlight]
  }

  return (
    <div className="quicknav-container">
      <div className="quicknav-navigation-section">
      <span id='ext-label' className='visually-hidden'>Vaihda sivun vaihe</span>
      <Select aria-labelledby="ext-label" placeholder={options.curPhase.label} options={options.optionsArray} onChange={switchPhase} />
        <nav className="quicknav-content">
        {selectedPhase?.currentPhase.map((section, index) => {
            let fields = section.fields
            let [filterNumber,highlight] = calculateFilterNumber(fields,highlightedTag)
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
                    tabIndex="0"
                    className={`filter-tag ${highlight ? "yellow" : ""}`}
                    role="button"
                    key={`checkbox-${section.title}`}
                    id={`checkbox-${section.title}`}
                    aria-label={filterNumber + " suodatettu kenttä esillä"}
                  >
                  {filterNumber}
                  </Tag> 
                  : 
                  ''}
                  </div>
              </Button>
            )
            })}
        </nav>
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
