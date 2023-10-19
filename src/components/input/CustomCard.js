import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux';
import {Button,IconPenLine } from 'hds-react'
import {showFloorArea, showTimetable} from '../../actions/projectActions'
import { useTranslation } from 'react-i18next'

function CustomCard({type,startInfo,endInfo,startModifiedText,endModifiedText,living,office,general,other}) {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  let buttonText
  let heading
  let fields
  let editDataLink

  if(type === "Tarkasta esilläolopäivät"){
    buttonText = t('custom-card.modify-date')
    heading = t('custom-card.check-date')
    fields = <>  
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.when-starts')}</div>
      <div className='custom-card-date'><span>{startInfo}</span><span className='custom-card-mod'> {startModifiedText ? "- "+t('custom-card.modified') : "- "+t('custom-card.evaluation')}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.when-ends')}</div>
      <div className='custom-card-date'><span>{endInfo}</span><span className='custom-card-mod'> {endModifiedText ? "- "+t('custom-card.modified') : "- "+t('custom-card.evaluation')}</span></div>
    </div>
    </>
    editDataLink = <Button size='small' iconLeft={<IconPenLine />} onClick={() => dispatch(showTimetable(true))} variant="supplementary" theme="black" role="link">{buttonText}</Button>
  }
  else if(type === "Tarkasta kerrosalatiedot"){
    buttonText = t('custom-card.modify-floor-area')
    heading = t('custom-card.check-floor-area')
    fields = <>  
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.living')}</div>
      <div className='custom-card-floor-info'><span>{living}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.office')}</div>
      <div className='custom-card-floor-info'><span>{office}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.public')}</div>
      <div className='custom-card-floor-info'><span>{general}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.other')}</div>
      <div className='custom-card-floor-info'><span>{other}</span></div>
    </div>
    </>
    editDataLink = <Button size='small' iconLeft={<IconPenLine />} onClick={() => dispatch(showFloorArea(true))} variant="supplementary" theme="black" role="link">{buttonText}</Button>
  }

  return (
    <div className='custom-card' >
      <div className='heading'>{heading}</div>
      <div className='custom-card-container'>
        {fields}
      </div>
      {editDataLink}
    </div>
  )
}

CustomCard.propTypes = {
  type: PropTypes.string,
  startInfo: PropTypes.string,
  endInfo: PropTypes.string,
  startModifiedText: PropTypes.string,
  endModifiedText: PropTypes.string,
  living: PropTypes.string,
  office: PropTypes.string,
  general: PropTypes.string,
  other: PropTypes.string,
}

export default CustomCard