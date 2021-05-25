import React from 'react'
import { useTranslation } from 'react-i18next'
import Geometry from '../input/Geometry'

function GeometryInformation(props) {
  const { t } = useTranslation()

 const inputProps = {
   ...props,
   input: {
     value: props.field && props.field.value
   }
 }
 

  return (
    <div>
      <h3>{t('project.planning-area-constraints')}</h3>
      <div className="geometry-input-container">
        <Geometry {...inputProps} />
      </div>
    </div>
  )
}
export default GeometryInformation
