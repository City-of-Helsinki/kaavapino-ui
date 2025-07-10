import React from 'react';
import { connect } from 'react-redux';
import { currentProjectSelector } from '../../selectors/projectSelector';
import { Dialog, Button, IconAlertCircle } from 'hds-react';
import { useTranslation } from 'react-i18next';

const ConfirmationModal = ({ open, callback }) => {
  const { t } = useTranslation();

  if (!open) return <></>;

  return (
    <Dialog
      id="reset-deadlines-dialog"
      isOpen
      close={() => callback(false)}
      closeButtonLabelText={t('common.cancel')}
      aria-labelledby="reset-deadlines-heading"
    >
      <Dialog.Header
        id="reset-deadlines-heading"
        title={t('deadlines.reset-confirm-dialog-title')}
        iconLeft={<IconAlertCircle aria-hidden="true" />}
      />
      <Dialog.Content style={{ maxWidth: '400px', margin: '0 auto', zIndex: 1300 }}>
        {t('deadlines.reset-confirm-dialog-question')}
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
  );
};

const mapStateToProps = (state) => ({
  currentProject: currentProjectSelector(state),
});

export default connect(mapStateToProps)(ConfirmationModal);
