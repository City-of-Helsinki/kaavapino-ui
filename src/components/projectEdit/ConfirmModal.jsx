import React from 'react'
import { connect } from 'react-redux'
import { currentProjectSelector } from '../../selectors/projectSelector'
import { Dialog, Button } from 'hds-react'
import { useTranslation } from 'react-i18next'

const ConfirmModal = ({ open, callback, notLastPhase, currentProject }) => {
  const { t } = useTranslation()

  return open ? (
    <Dialog
      isOpen={true}
      close={() => callback(false)}
      closeButtonLabelText={t('common.close')}
      id="confirmation-dialog"
      aria-labelledby="dialog-title"
    >
      <Dialog.Header
        id="dialog-title"
        title={`${
          notLastPhase
            ? t('quick-nav.confirm-dialog.end-phase')
            : t('quick-nav.confirm-dialog.archive-phase')
        }`}
      />
      <Dialog.Content>
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
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant="secondary" onClick={() => callback(false)}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={() => callback(true)}>
          {t('common.continue')}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  ) : <></>
}

const mapStateToProps = state => ({
  currentProject: currentProjectSelector(state)
})

export default connect(mapStateToProps, null)(ConfirmModal)
