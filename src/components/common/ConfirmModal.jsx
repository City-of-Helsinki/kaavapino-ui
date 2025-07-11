import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, Button, IconAlertCircle } from 'hds-react';

const ConfirmModal = ({
  openConfirmModal, headerText, contentText, button1Text, button2Text, onButtonPress1, onButtonPress2, style, buttonStyle1, buttonStyle2, onCancel
}) => {
  return openConfirmModal ? (
    <Dialog
      isOpen
      close={onCancel}
      closeButtonLabelText="Sulje"
      id="confirmation-dialog"
      aria-labelledby="dialog-title"
      className={style}
    >
      <Dialog.Header
        id="dialog-title"
        title={headerText}
        iconLeft={<IconAlertCircle aria-hidden="true" />}
      />
      <Dialog.Content className="dialog-content">
        <p>{contentText}</p>
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant={buttonStyle1} className={buttonStyle1} onClick={onButtonPress1}>{button1Text}</Button>
        <Button variant={buttonStyle2} className={buttonStyle2} onClick={onButtonPress2}>{button2Text}</Button>
      </Dialog.ActionButtons>
    </Dialog>
  ) : <></>;
};

ConfirmModal.propTypes = {
  openConfirmModal: PropTypes.bool.isRequired,
  headerText: PropTypes.string.isRequired,
  contentText: PropTypes.string.isRequired,
  button1Text: PropTypes.string.isRequired,
  button2Text: PropTypes.string.isRequired,
  onButtonPress1: PropTypes.func.isRequired,
  onButtonPress2: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  style: PropTypes.string,
  buttonStyle1: PropTypes.string,
  buttonStyle2: PropTypes.string,
};

export default ConfirmModal;