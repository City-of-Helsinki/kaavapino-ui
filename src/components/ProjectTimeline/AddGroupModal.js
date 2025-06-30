import React, { useEffect }  from 'react';
import { change } from 'redux-form'
import { useDispatch } from 'react-redux';
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { IconPlus,Button } from 'hds-react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

const AddGroupModal = ({toggleOpenAddDialog,addDialogStyle,addDialogData,closeAddDialog, allowedToEdit, timelineAddButton}) => {
  const {t} = useTranslation()
  const dispatch = useDispatch();

  const addNew = (addedKey) => {
    if(addedKey) {
      dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, addedKey, true));
      closeAddDialog()
    }
    else {
      closeAddDialog()
    }
  }

  const getReasonMessage = (reason, groupId, t) => {
    if (reason === "Lukitus päällä") {
      return t('project.locking-enabled');
    }
    
    if (reason === "noconfirmation") {
      return groupId === "Ehdotus" 
        ? t('project.confirm-previous-presence-first')
        : t('project.confirm-previous-display-first');
    }
    
    return groupId === "Ehdotus"
      ? t('project.max-presences-reached')
      : t('project.max-displays-reached');
  };

  const getBoardReasonMessage = (reason, t) => {
    if (reason === "Lukitus päällä") {
      return t('project.locking-enabled');
    }
    
    return reason === "noconfirmation"
      ? t('project.confirm-previous-board-first')
      : t('project.max-boards-reached');
  };

  useEffect(() => {
    if (timelineAddButton) {
      if (toggleOpenAddDialog) {
        timelineAddButton.classList.add("menu-open");
      } else {
        const timelineAddButtons = document.getElementsByClassName('timeline-add-button');
        Array.from(timelineAddButtons).forEach(button => {
          button.classList.remove("menu-open");
        });
      }
    }
  }, [toggleOpenAddDialog])

  return (
    <div className={toggleOpenAddDialog === true ? "vis-add-dialog" : "vis-hide-dialog"} style={addDialogStyle}>
        {!addDialogData.hidePresence && 
          <>
            <Button size="small" disabled={!(addDialogData.showPresence && allowedToEdit)} className={addDialogData.showPresence && allowedToEdit ? '' : 'disabled'} variant="supplementary" onClick={() => addNew(addDialogData.nextEsillaolo)} iconLeft={<IconPlus />}>
              {addDialogData.group.id === "Ehdotus" ? t('project.add-new-review') : t('project.add-new-presence')}
            </Button>
            {addDialogData.esillaoloReason && (
              <span className='add-button-info'>
                {getReasonMessage(addDialogData.esillaoloReason, addDialogData.group.id, t)}
              </span>
            )}
          </>
        }
        {!addDialogData.hideBoard &&
          <>
            <Button size="small" disabled={!(addDialogData.showBoard && allowedToEdit)} className={addDialogData.showBoard && allowedToEdit ? '' : 'disabled'} variant="supplementary" onClick={() => addNew(addDialogData.nextLautakunta)} iconLeft={<IconPlus />}>
              {t('project.add-new-board')}
            </Button>
            {addDialogData.lautakuntaReason && (
              <span className='add-button-info'>
                {getBoardReasonMessage(addDialogData.lautakuntaReason, t)}
              </span>
            )}
          </>
        }
    </div>
  );
}

AddGroupModal.propTypes = {
  toggleOpenAddDialog: PropTypes.bool,
  addDialogStyle: PropTypes.object,
  addDialogData: PropTypes.object,
  closeAddDialog: PropTypes.func,
  allowedToEdit: PropTypes.bool,
  isAdmin: PropTypes.bool,
  timelineAddButton: PropTypes.instanceOf(HTMLElement)
};

export default AddGroupModal;