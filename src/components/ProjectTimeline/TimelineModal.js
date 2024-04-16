import React from 'react'
//import { useSelector } from 'react-redux'
import { Modal } from 'semantic-ui-react'
import { Button, DateInput, Notification } from 'hds-react'
import { useTranslation } from 'react-i18next'
//import { deadlineSectionsSelector } from '../../selectors/schemaSelector'
import './VisTimeline.css'

const TimelineModal = ({ open,id,group,content,abbreviation,deadlines,openDialog }) => {
    const { t } = useTranslation()
    //const deadlineSections = useSelector(state => deadlineSectionsSelector(state))

    console.log(id,group,content,abbreviation,deadlines)
    return (
      <Modal open={open} size={'large'} className='modal-center-big'>
        <Modal.Header>{group}</Modal.Header>
        <Modal.Content>
          <div className='date-content'>
            {deadlines.map((deadline) => {
              if (group === deadline.deadline.phase_name && deadline.deadline.attribute) {
                return (
                  <DateInput
                    className='date-content-item'
                    key={deadline.deadline.index + "date-input-example"}
                    value={new Date(deadline.date).toLocaleDateString('fi-FI')}
                    id={`date-input-example-${deadline.deadline.index}`}
                    label={deadline.deadline.attribute}
                    onChange={function noRefCheck() {}}
                    required
                  />
                );
              }
              return null;
            })}
          </div>
          <div className='other-content'>
            <Notification size="small" label="Päivämäärä info">Ilmoitukset määräajoista/päivämääristä näkyy tässä 12.03.2024.</Notification>
            <Notification size="small" label="Päivämäärä vahvistettu" type="success" >Vahvistukset näkyy tässä</Notification>
            <Button size='small' variant="danger">
              Peru vahvistus
            </Button>
          </div>
        </Modal.Content>
        <Modal.Actions>
          <div className="form-buttons">
            <Button size='default' variant="secondary" onClick={openDialog}>
              {t('common.cancel')}
            </Button>
            <Button size='default' variant="primary">
              {t('common.save')}
            </Button>
          </div>
        </Modal.Actions>
      </Modal>
    )
  }
  
  export default TimelineModal