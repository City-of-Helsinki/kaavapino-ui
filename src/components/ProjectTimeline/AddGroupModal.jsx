import React, { useEffect, useState }  from 'react';
import { change } from 'redux-form'
import { useDispatch } from 'react-redux';
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import { IconPlus,Button } from 'hds-react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

const AddGroupModal = ({toggleOpenAddDialog,addDialogStyle,addDialogData,closeAddDialog, allowedToEdit, timelineAddButton, phaseIsClosed}) => {
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
    <div className={toggleOpenAddDialog ? "vis-add-dialog" : "vis-hide-dialog"} style={addDialogStyle}>
      {!addDialogData.hidePresence && (
        <>
          <Button
            size="small"
            disabled={!(addDialogData.showPresence && allowedToEdit)}
            className={addDialogData.showPresence && allowedToEdit ? '' : 'disabled'}
            variant="supplementary"
            onClick={() => addNew(addDialogData.nextEsillaolo)}
            iconLeft={<IconPlus />}
          >
            {addDialogData.group.id === "Ehdotus"
              ? t('project.add-new-review')
              : t('project.add-new-presence')}
          </Button>
          {addDialogData.esillaoloReason && (
            <span className='add-button-info'>
              {addDialogData.group.id === "Ehdotus"
                ? (addDialogData.esillaoloReason === "noconfirmation"
                    ? "Kaavoitussihteerin tulee vahvistaa aikaisempi nähtävilläolo, ennen uuden nähtävilläolon lisäämistä."
                    : "Nähtävilläolojen enimmäismäärä on saavutettu.")
                : (addDialogData.esillaoloReason === "noconfirmation"
                    ? "Kaavoitussihteerin tulee vahvistaa aikaisempi esilläolo, ennen uuden esilläolon lisäämistä."
                    : "Esilläolojen enimmäismäärä on saavutettu.")}
            </span>
          )}
        </>
      )}

      {!addDialogData.hideBoard && (
        <>
          <Button
            size="small"
            disabled={!(addDialogData.showBoard && allowedToEdit)}
            className={addDialogData.showBoard && allowedToEdit ? '' : 'disabled'}
            variant="supplementary"
            onClick={() => addNew(addDialogData.nextLautakunta)}
            iconLeft={<IconPlus />}
          >
            {t('project.add-new-board')}
          </Button>
          {addDialogData.lautakuntaReason && !addDialogData.showBoard && (
            <span className='add-button-info'>
              {addDialogData.lautakuntaReason === "noconfirmation"
                ? "Kaavoitussihteerin tulee vahvistaa aikaisempi lautakunta, ennen uuden lautakunnan lisäämistä."
                : addDialogData.lautakuntaReason === "palautettu_tai_jai_poydalle"
                  ? "Voit lisätä uuden lautakunnan vain, jos asia jäi pöydälle tai se palautettiin uudelleen valmisteltavaksi."
                  : "Lautakuntien maksimimäärä on saavutettu."
              }
            </span>
          )}
        </>
      )}
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