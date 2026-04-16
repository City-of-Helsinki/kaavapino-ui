import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'semantic-ui-react';
import { Button,IconAlertCircle } from 'hds-react';
import { focusTrapOnTabPressed } from '../project/projectModalUtils';
function ConfirmModal({ openConfirmModal,headerText, contentText, button1Text, button2Text, onButtonPress1, onButtonPress2, style, buttonStyle1, buttonStyle2 }) {
  
  useEffect(() => {
    const handleKeyDown = (event) => focusTrapOnTabPressed(event, 'confirm-modal');
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Modal
      id="confirm-modal"
      open={openConfirmModal}
      className={style}
      onMount={() => {
          const firstElement = document.querySelector('#confirm-modal-cancel-button')
          if (firstElement) {
            firstElement.focus();
          }
      }}
      >
      <Modal.Header><IconAlertCircle className='header-icon' size="s" aria-hidden="true"/><span className='header-text'>{headerText}</span></Modal.Header>
      <Modal.Content>
        {contentText}
      </Modal.Content>
      <Modal.Actions>
        <Button id="confirm-modal-cancel-button" onClick={onButtonPress1} className={`button-${buttonStyle1}`} variant={buttonStyle1}>{button1Text}</Button>
        <Button id="confirm-modal-confirm-button" onClick={onButtonPress2} variant={buttonStyle2}>{button2Text}</Button>
      </Modal.Actions>
    </Modal>
  );
}

ConfirmModal.propTypes = {
  openConfirmModal: PropTypes.bool,
  headerText: PropTypes.string,
  contentText: PropTypes.string,
  button1Text: PropTypes.string,
  button2Text: PropTypes.string,
  onButtonPress1: PropTypes.func,
  onButtonPress2: PropTypes.func,
  style: PropTypes.string,
  buttonStyle1: PropTypes.string,
  buttonStyle2: PropTypes.string
};

export default ConfirmModal;