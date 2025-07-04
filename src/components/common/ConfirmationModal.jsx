import React from 'react'
import { Modal } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { currentProjectSelector } from '../../selectors/projectSelector'
import { Button } from 'hds-react'
import { useTranslation } from 'react-i18next'

const ConfirmationModal = ({ open, callback }) => {
  const { t } = useTranslation()

  return (
    <Modal open={open} centered={false} size={'tiny'}>
      <Modal.Header>{t('deadlines.reset-confirm-dialog-title')}</Modal.Header>
      <Modal.Content>
        <div>{t('deadlines.reset-confirm-dialog-question')}</div>
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

export default connect(mapStateToProps, null)(ConfirmationModal)
