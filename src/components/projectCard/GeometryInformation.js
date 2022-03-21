import React from 'react'
import { useTranslation } from 'react-i18next'
import Geometry from '../input/Geometry'

function GeometryInformation(props) {
  const { t } = useTranslation()

 const inputProps = {
   input: {
     value: props.field && props.field.value
   }
 }
 

  return (
    <div>
      {!props.hideTitle && <h3>{t('project.planning-area-constraints')}</h3>}
      <div className="geometry-input-container">
        <Geometry {...inputProps} />
      </div>
    </div>
  )
}
export default GeometryInformation
