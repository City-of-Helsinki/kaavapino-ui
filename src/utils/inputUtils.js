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

const renderUpdatedFieldInfo = ({ savingField, fieldName, updated, t }) => {
	return (
		<div className='popup-container'>
			{savingField === fieldName ? (
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
