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

const renderUpdatedFieldInfo = ({ savingField, fieldName, updated, t, isFieldset, fieldsetFields }) => {
	let shouldShowSpinner = false;

	if (isFieldset && fieldsetFields && savingField) {
		// For fieldset components: show spinner if savingField matches any field within this fieldset
		shouldShowSpinner = fieldsetFields.some(field => field.name === savingField);
	} else if (fieldName && fieldName.endsWith('_fieldset') && savingField) {
		// For fieldset containers: show spinner if savingField could belong to this fieldset
		const fieldsetPrefix = fieldName.replace('_fieldset', '');
		shouldShowSpinner = savingField.includes(fieldsetPrefix);
	} else {
		// For individual fields: show spinner only for exact match
		shouldShowSpinner = savingField === fieldName;
	}
	
	return (
		<div className='popup-container'>
			{shouldShowSpinner ? (
				<div className='spinner-container'>
					<LoadingSpinner className='loading-spinner' small />
				</div>
			) : (
				updated && (
					<Tooltip
						placement="top"
					>
						<span className="input-history">
							<span>{`${projectUtils.formatDate(
								updated.timestamp
							)} ${projectUtils.formatTime(updated.timestamp)} ${
								updated.user_name
							}`}</span>
						</span>
					</Tooltip>
				)
			)}
		</div>
	)
}

const renderTimeContainer = ({ updated, t }) => {
	return updated ? (
		<div className='time-container'>{`${timeUtil.formatRelativeDate(updated.timestamp, t)} ${projectUtils.formatTime(updated.timestamp)}`}</div>
	) : null
}

export default {
  hasError,
  renderUpdatedFieldInfo,
  renderTimeContainer
}
