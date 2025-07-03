import React from 'react'
import { Modal } from 'semantic-ui-react'
import { Button } from 'hds-react'
import { useTranslation } from 'react-i18next'

const DocumentConfirmationModal = ({ open, callback }) => {
  const { t } = useTranslation()
 
  return (
    <Modal open={open} centered={false} size={'tiny'}>
      <Modal.Header>{t('project.download_confirmation_header')}</Modal.Header>
      <Modal.Content>
        <div>{t('project.download_confirmation_content')}</div>
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

export default DocumentConfirmationModal