import React, { useEffect, useState } from 'react'
import { isEqual } from 'lodash'
import { change, getFormValues, Field, autofill } from 'redux-form'
import { useDispatch, useSelector } from 'react-redux'
import { handleAutofillCalculations } from './autofillCalculationsUtils'
import { getFieldAutofillValue } from '../../../utils/projectAutofillUtils'
import { EDIT_PROJECT_FORM, EDIT_FLOOR_AREA_FORM } from '../../../constants'
import {updateFloorValuesSelector } from '../../../selectors/projectSelector'
/* This component should calculate and update it's value in redux form whenever
 * the related fields change.
 *
 * It attempts to not do needless redux form changes. However, it can be rather
 * performance-heavy. If performance becomes a problem, I recommend either
 * 1) throttling these changes: only after the user has stopped typing make all these
 * calls
 * 2) reverse the logic: currently the field knows which fields it listens to (in related_fields).
 * If instead the field would know which fields to update, all of those could be do at once e.g. on blur
 * instead of change listeners
 */

const AutofillInputCalculations = ({
  field: { name, autofill_readonly, related_fields, calculations, unit, autofill_rule },
  fieldProps,
  formName
}) => {
  const dispatch = useDispatch()
  const [previousRelatedFieldValues, setPreviousRelatedFieldValues] = useState([])
  const formValues = useSelector(getFormValues(formName))
  const editFormValues = useSelector(getFormValues(EDIT_PROJECT_FORM))
  const updateFloorValue = useSelector(state => updateFloorValuesSelector(state))
  const value = (formValues && formValues[name]) || (editFormValues && editFormValues[name]) || null
  const values = formValues ? formValues : editFormValues
  let calculatedTotal = 0

  const autoFillValue = getFieldAutofillValue(autofill_rule, editFormValues, name)
  
  const autoFillNumber = autoFillValue ? parseInt(autoFillValue) : null

  useEffect(() => {
    //Set values on first load from saved/new data
    setPreviousRelatedFieldValues(
      related_fields.map(relatedField => editFormValues[relatedField])
    )

    if (autoFillNumber && !calculations) {
      dispatch(autofill(EDIT_FLOOR_AREA_FORM, name, autoFillNumber))
    }
  }, [])

  useEffect(() => {
    if (!formValues) {
      return
    }

    /* Optimization: don't recalculate if related form values have not changed */
    let shouldRecalculate = false
    for (let i = 0; i < related_fields.length; i += 1) {
      if (!isEqual(formValues[related_fields[i]], previousRelatedFieldValues[i])) {
        shouldRecalculate = true
        break
      }
    }
    if (!shouldRecalculate) {
      return
    }
    setPreviousRelatedFieldValues(
      related_fields.map(relatedField => formValues[relatedField])
    )
    /* end of optimization */

    calculatedTotal = handleAutofillCalculations(calculations, formValues)

    dispatch(change(formName, name, calculatedTotal))

    //Dispatch change to FloorAreaTotals component that is child component to EditFloorAreaForm
    //values are always identical to if statements fields values and are not working reliably without this
    if(name === "asuminen_yhteensa"){
      //Changes value on FloorAreaTotals component
      let relatedName = "kerrosalan_lisays_yhteensa_asuminen"
      dispatch(change(formName, relatedName, calculatedTotal))
    }
    else if(name === "toimitila_yhteensa"){
      let relatedName = "kerrosalan_lisays_yhteensa_toimitila"
      dispatch(change(formName, relatedName, calculatedTotal))
    }
    else if(name === "julkiset_yhteensa"){
      let relatedName = "kerrosalan_lisays_yhteensa_julkinen"
      dispatch(change(formName, relatedName, calculatedTotal))
    }
    else if(name === "muut_yhteensa"){
      let relatedName = "kerrosalan_lisays_yhteensa_muut"
      dispatch(change(formName, relatedName, calculatedTotal))
    }
    
    //updateFloorValue updates only when user is actually editing inputs
  }, [related_fields,JSON.stringify(updateFloorValue)])

  const renderKm2UnitComponent = () => (
    <div className="autofill-input">
      {autofill_readonly && calculations ? (
        <div className="autofill-readonly-input">
          <div className="autofill-readonly-input-value">
            {`${value ? value : 0}`} k-m&sup2;
          </div>
        </div>
      ) : (
        <Field {...fieldProps} isFloorAreaForm={true} floorValue={values}/>
      )}
    </div>
  )
  const renderOriginalComponent = () => (
    <div className="autofill-input">
      {autofill_readonly ? (
        <div className="autofill-readonly-input">
          <div className="autofill-readonly-input-value">
            {`${value ? value : 0}${value && unit ? ` ${unit}` : ''}`}
          </div>
        </div>
      ) : (
        <Field {...fieldProps} disabled={fieldProps.disabled} isFloorAreaForm={true} floorValue={values}/>
      )}
    </div>
  )
  const km2UnitComponent = renderKm2UnitComponent()
  const originalComponent = renderOriginalComponent()

  return unit === 'k-m2' ? km2UnitComponent : originalComponent
}

export default AutofillInputCalculations
