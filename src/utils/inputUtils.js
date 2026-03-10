import React from 'react'
import { Tooltip, LoadingSpinner } from 'hds-react'
import projectUtils from './projectUtils'
import timeUtil from './timeUtil'

const hasError = error => {
  if (!error) {
    return false
  } else if (error.length > 0) {
    return true
  }

  return false
}

const renderUpdatedFieldInfo = ({ savingField, fieldName, updated, t, isFieldset, fieldsetFields, testingConnection }) => {
	let shouldShowSpinner = false;

	// Check if testing connection for this specific field
	const isTestingThisField = testingConnection?.isActive && testingConnection?.fieldName === fieldName;

	if (isFieldset && fieldsetFields && savingField) {
		// For fieldset components: show spinner if savingField matches any field within this fieldset
		shouldShowSpinner = fieldsetFields.some(field => field.name === savingField);
	} else if (fieldName && fieldName.endsWith('_fieldset') && savingField) {
		// For fieldset containers: show spinner if savingField could belong to this fieldset
		const fieldsetPrefix = fieldName.replace('_fieldset', '');
		shouldShowSpinner = savingField.includes(fieldsetPrefix);
	} else {
		// For individual fields: show spinner for exact match OR when testing connection for this field
		shouldShowSpinner = savingField === fieldName || isTestingThisField;
	}
	
	return (
		<div className='popup-container'>
			{shouldShowSpinner ? (
				<div className='spinner-container'>
					<LoadingSpinner 
						className='loading-spinner' 
						small 
						theme={{
							'--spinner-color': '#0000BF',
							'--spinner-thickness': '2px'
						}}
					/>
				</div>
			) : (
				updated && updated.timestamp && (
					<Tooltip placement="top">
						<div className="input-history-tooltip">
							<div className="input-history-title">
								Viimeisin muokkaus
							</div>
							<div className="input-history-details">
								{`${projectUtils.formatDate(updated.timestamp)}, ${projectUtils.formatTime(updated.timestamp)} - ${updated.user_name}`}
							</div>
						</div>
					</Tooltip>
				)
			)}
		</div>
	)
}

const renderTimeContainer = ({ updated, t }) => {
	if (!updated?.timestamp) return null
	
	const relativeDate = timeUtil.formatRelativeDate(updated.timestamp, t)
	const isToday = relativeDate === t('relativeDates.today')
	const timeString = isToday ? ` ${projectUtils.formatTime(updated.timestamp)}` : ''
	
	return (
		<div className='time-container'>{`${relativeDate}${timeString}`}</div>
	)
}

export default {
  hasError,
  renderUpdatedFieldInfo,
  renderTimeContainer
}
