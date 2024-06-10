import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'semantic-ui-react';
import { Button,IconInfoCircle } from 'hds-react';

function ConfirmModal({ headerText, contentText, button1Text, button2Text, onContinue, onCancel }) {
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

ConfirmModal.propTypes = {
  headerText: PropTypes.string,
  contentText: PropTypes.string,
  button1Text: PropTypes.string,
  button2Text: PropTypes.string,
  onContinue: PropTypes.func,
  onCancel: PropTypes.func
};

export default ConfirmModal;