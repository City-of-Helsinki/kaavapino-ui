import React, { useEffect } from 'react'
import { Modal } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { currentProjectSelector } from '../../selectors/projectSelector'
import { Button } from 'hds-react'
import { useTranslation } from 'react-i18next'
import { focusTrapOnTabPressed } from '../project/projectModalUtils';
import PropTypes from 'prop-types'

const PhaseChangeConfirmModal = ({ open, callback, notLastPhase, currentProject }) => {
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (event) => focusTrapOnTabPressed(event, 'confirm-phase-end-modal');
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Modal 
      open={open}
      centered={false}
      size={'tiny'} 
      id="confirm-phase-end-modal" 
      onMount={() => document.getElementById('confirm-phase-end-modal-cancel')?.focus()}
      onUnmount={() => document.getElementById('quicknav-end-phase-button')?.focus()}
      >
      <Modal.Header>{`${
        notLastPhase
          ? t('quick-nav.confirm-dialog.end-phase')
          : t('quick-nav.confirm-dialog.archive-phase')
      }`}</Modal.Header>
      <Modal.Content>
        <div>{`${
          notLastPhase
            ? t('quick-nav.confirm-dialog.question-phase')
            : t('quick-nav.confirm-dialog.question-archive')
        }`}</div>
        {currentProject && !currentProject.public && (
          <div>
            <br />
            {t('quick-nav.confirm-dialog.info')}
          </div>
        )}
      </Modal.Content>
      <Modal.Actions>
        <div className="form-buttons">
          <Button id="confirm-phase-end-modal-cancel" variant="secondary" onClick={() => callback(false)}>
            {t('common.cancel')}
          </Button>
          <Button id="confirm-phase-end-modal-continue" variant="primary" onClick={() => callback(true)}>
          {t('common.continue')}
          </Button>
        </div>
      </Modal.Actions>
    </Modal>
  )
}

const mapStateToProps = state => ({
  currentProject: currentProjectSelector(state)
})

PhaseChangeConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  callback: PropTypes.func.isRequired,
  notLastPhase: PropTypes.bool.isRequired,
  currentProject: PropTypes.object
}

export default connect(mapStateToProps, null)(PhaseChangeConfirmModal)
