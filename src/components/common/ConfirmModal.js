import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'semantic-ui-react';
import { Button,IconInfoCircle } from 'hds-react';

function ConfirmModal({ openConfirmModal,headerText, contentText, button1Text, button2Text, onButtonPress1, onButtonPress2, style, buttonStyle1, buttonStyle2 }) {
  return (
    <Modal open={openConfirmModal} className={style}>
      <Modal.Header><IconInfoCircle className='header-icon' size="s" aria-hidden="true"/>{headerText}</Modal.Header>
      <Modal.Content>
        {contentText}
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onButtonPress1} className={`button-${buttonStyle1}`} variant={buttonStyle1}>{button1Text}</Button>
        <Button onClick={onButtonPress2} variant={buttonStyle2}>{button2Text}</Button>
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