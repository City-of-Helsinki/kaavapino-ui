import React, {useEffect,useState} from 'react'
import PropTypes from 'prop-types'
import { useDispatch,useSelector } from 'react-redux';
import {Button,IconPenLine } from 'hds-react'
import {showFloorArea, showTimetable} from '../../actions/projectActions'
import {attributeDataSelector} from '../../selectors/projectSelector'
import { useTranslation } from 'react-i18next'
import infoFieldUtil from '../../utils/infoFieldUtil'

function CustomCard({type, props, name, data, deadlines}) {
  const [cardValues, setCardValues] = useState(["","","","",true,0,0,0,0]);
  const attributeData = useSelector(state => attributeDataSelector(state))

  useEffect(() => {
    setCardValues(infoFieldUtil.getInfoFieldData(type,name,data,deadlines))
  }, [])

   useEffect(() => {
    setCardValues(infoFieldUtil.getInfoFieldData(props.placeholder,props.input?.name,attributeData,deadlines))
  }, [attributeData])

  const dispatch = useDispatch()
  const { t } = useTranslation()

  let buttonText
  let heading
  let fields
  let editDataLink
  const unit = "k-m²"

  if(type === "Tarkasta esilläolopäivät"){
    buttonText = t('custom-card.modify-date')
    heading = t('custom-card.check-date')
    fields = <>  
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.when-starts')}</div>
      <div className='custom-card-date'><span>{cardValues[0]}</span><span className='custom-card-mod'> {cardValues[2] ? "- "+t('custom-card.modified') : "- "+t('custom-card.evaluation')}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.when-ends')}</div>
      <div className='custom-card-date'><span>{cardValues[1]}</span><span className='custom-card-mod'> {cardValues[3] ? "- "+t('custom-card.modified') : "- "+t('custom-card.evaluation')}</span></div>
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
      <div className='custom-card-floor-info'><span>{cardValues[5]} {unit}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.office')}</div>
      <div className='custom-card-floor-info'><span>{cardValues[6]} {unit}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.public')}</div>
      <div className='custom-card-floor-info'><span>{cardValues[7]} {unit}</span></div>
    </div>
    <div className='custom-card-info-container'>
      <div className='custom-card-info'>{t('custom-card.other')}</div>
      <div className='custom-card-floor-info'><span>{cardValues[8]} {unit}</span></div>
    </div>
    </>
    editDataLink = <Button size='small' iconLeft={<IconPenLine />} onClick={() => dispatch(showFloorArea(true))} variant="supplementary" theme="black" role="link">{buttonText}</Button>
  }

  return (
    !cardValues[4] ?
    <div className='custom-card' >
      <div className='heading'>{heading}</div>
      <div className='custom-card-container'>
        {fields}
      </div>
      {editDataLink}
    </div>
    :
    ""
  )
}

CustomCard.propTypes = {
  type: PropTypes.string,
  props: PropTypes.object,
  name: PropTypes.string,
  data: PropTypes.object,
  deadlines: PropTypes.object,
  placeholder: PropTypes.string,
  input: PropTypes.object
}

export default CustomCard
