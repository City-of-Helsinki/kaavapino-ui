import React from 'react';
import { Modal } from 'semantic-ui-react';
import { Button,IconInfoCircle } from 'hds-react';

function ConfirmCancelModal({ headerText, contentText, button1Text, button2Text, onContinue, onCancel }) {
  return (
    <Modal open={true} className="timetable-confirm-modal">
      <Modal.Header><IconInfoCircle className='header-icon' size="s" aria-hidden="true"/>{headerText}</Modal.Header>
      <Modal.Content>
        {contentText}
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onContinue} className='button-primary' variant="primary">{button1Text}</Button>
        <Button onClick={onCancel} variant="secondary">{button2Text}</Button>
      </Modal.Actions>
    </Modal>
  );
}

export default ConfirmCancelModal;