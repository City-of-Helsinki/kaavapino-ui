import React from 'react'
import { Modal } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { currentProjectSelector } from '../../selectors/projectSelector'
import { Button } from 'hds-react'
import { useTranslation } from 'react-i18next'

const ConfirmModal = ({ open, callback, notLastPhase, currentProject }) => {
  const { t } = useTranslation()

  return (
    <Modal open={open} centered={false} size={'tiny'}>
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
          <Button variant="secondary" onClick={() => callback(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={() => callback(true)}>
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

export default connect(mapStateToProps, null)(ConfirmModal)
