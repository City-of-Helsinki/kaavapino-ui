import React  from 'react';
import { change } from 'redux-form'
import { useDispatch } from 'react-redux';
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { IconPlus,Button } from 'hds-react'
import { useTranslation } from 'react-i18next'

const AddGroupModal = ({toggleOpenAddDialog,addDialogStyle,addDialogData,closeAddDialog, allowedToEdit, isAdmin}) => {
  const {t} = useTranslation()
  const dispatch = useDispatch();

  const addNew = (addedKey) => {
    if(addedKey){
        dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, addedKey, true));
        closeAddDialog()
    }
    else{
      closeAddDialog()
    }
  }

  return (
    <div className={toggleOpenAddDialog === true ? "vis-add-dialog" : "vis-hide-dialog"} style={addDialogStyle}>
        <Button size="small" disabled={addDialogData.showPresence === true && allowedToEdit ? false : true} className={addDialogData.showPresence === true && allowedToEdit ? '' : 'disabled'} variant="supplementary" onClick={() => addNew(addDialogData.nextEsillaolo)} iconLeft={<IconPlus />}>
            {t('project.add-new-presence')}
        </Button>
        <Button size="small" disabled={addDialogData.showBoard === true && isAdmin ? false : true} className={addDialogData.showBoard === true && isAdmin ? '' : 'disabled'} variant="supplementary" onClick={() => addNew(addDialogData.nextLautakunta)} iconLeft={<IconPlus />}>
            {t('project.add-new-board')}
        </Button>
    </div>
  );
}

export default AddGroupModal;