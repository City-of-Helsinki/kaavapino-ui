import React  from 'react';
import { change } from 'redux-form'
import { useDispatch } from 'react-redux';
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { IconPlus,Button } from 'hds-react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

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
        <Button size="small" disabled={!(addDialogData.showPresence && allowedToEdit)} className={addDialogData.showPresence && allowedToEdit ? '' : 'disabled'} variant="supplementary" onClick={() => addNew(addDialogData.nextEsillaolo)} iconLeft={<IconPlus />}>
            {t('project.add-new-presence')}
        </Button>
        {addDialogData.esillaoloReason && <span className='add-button-info'>{addDialogData.esillaoloReason === "noconfirmation" ? "Kaavoitussihteerin tulee vahvistaa aikaisempi esilläolo, jonka jälkeen voidaan lisätä uusi." : "Esilläolojen maksimimäärä on saavutettu."}</span>}
        <Button size="small" disabled={!(addDialogData.showBoard && isAdmin)} className={addDialogData.showBoard && isAdmin ? '' : 'disabled'} variant="supplementary" onClick={() => addNew(addDialogData.nextLautakunta)} iconLeft={<IconPlus />}>
            {t('project.add-new-board')}
        </Button>
        {addDialogData.esillaoloReason && <span className='add-button-info'>{addDialogData.esillaoloReason === "noconfirmation" ? "Kaavoitussihteerin tulee vahvistaa aikaisempi lautakunta, jonka jälkeen voidaan lisätä uusi." : "Lautakuntien maksimimäärä on saavutettu."}</span>}
    </div>
  );
}

AddGroupModal.propTypes = {
  toggleOpenAddDialog: PropTypes.func,
  addDialogStyle: PropTypes.object,
  addDialogData: PropTypes.object,
  closeAddDialog: PropTypes.func,
  allowedToEdit: PropTypes.bool,
  isAdmin: PropTypes.bool
};

export default AddGroupModal;