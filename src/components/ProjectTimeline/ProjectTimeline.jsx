import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Notification } from 'hds-react'
import './ProjectTimeline.scss'
import { createMonths } from './helpers/createMonths'
import { createDeadlines } from './helpers/createDeadlines'
import { connect } from 'react-redux'
import { getProject, getProjectSuccessful } from '../../actions/projectActions'
import { findWeek } from './helpers/helpers'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import timeUtil from '../../utils/timeUtil'
import { shouldDeadlineBeVisible } from '../../utils/projectVisibilityUtils';

function ProjectTimeline(props) {
  const { deadlines, projectView, onhold, attribute_data } = props
  const { t } = useTranslation()
  const [showError, setShowError] = useState(false)
  const [drawMonths, setDrawMonths] = useState([])
  const [drawItems, setDrawItems] = useState([])
  const [columnCount, setColumnCount] = useState(65)
  const monthNames = {
    0: t('deadlines.months.jan'),
    1: t('deadlines.months.feb'),
    2: t('deadlines.months.mar'),
    3: t('deadlines.months.apr'),
    4: t('deadlines.months.may'),
    5: t('deadlines.months.jun'),
    6: t('deadlines.months.jul'),
    7: t('deadlines.months.aug'),
    8: t('deadlines.months.sep'),
    9: t('deadlines.months.oct'),
    10: t('deadlines.months.nov'),
    11: t('deadlines.months.dec')
  }
  useEffect(() => {
    if (!deadlines || !deadlines.length) {
      setDrawItems([])
      setDrawMonths([])
      setColumnCount(0)
      return
    }
    const mergedDeadlines = mergeDeadlinesWithAttributes(deadlines, attribute_data)
    // Check for errors on ALL deadlines before filtering (errors may be on invisible deadlines)
    const hasDeadlineErrors = mergedDeadlines.some(deadline => 
      deadline?.is_under_min_distance_next ||
      deadline?.is_under_min_distance_previous ||
      deadline?.out_of_sync
    )
    const filteredDeadlines = filterVisibleDeadlines(mergedDeadlines, attribute_data)
    if (!filteredDeadlines || !filteredDeadlines.length) {
      setDrawItems([])
      setDrawMonths([])
      setColumnCount(0)
      // Keep error state if we found errors above
      setShowError(hasDeadlineErrors)
      return
    }
    if (!projectView) {
      const months = createMonths(filteredDeadlines)
      const columns = createDrawMonths(months.months)
      setColumnCount(columns)
    }
    createTimelineItems(filteredDeadlines, hasDeadlineErrors)
  }, [deadlines, attribute_data, projectView]);

  function filterVisibleDeadlines(deadlineArray = [], attributeData) {
    const data = attributeData || {};
    const filtered = deadlineArray.filter(deadline =>
      shouldDeadlineBeVisible(
        deadline?.deadline?.attribute || deadline?.deadline?.name,
        deadline?.deadline?.deadlinegroup,
        data
      )
    );
    return filtered;
  }

  function mergeDeadlinesWithAttributes(deadlineArray = [], attributeData = {}) {
    const sourceAttributes = attributeData || {}
    if (!deadlineArray.length || !Object.keys(sourceAttributes).length) {
      return deadlineArray
    }
    const overrides = []
    const merged = deadlineArray.map((deadline, index) => {
      const attributeKey = deadline?.deadline?.attribute || deadline?.deadline?.name
      if (!attributeKey) {
        return deadline
      }
      const attributeValue = sourceAttributes[attributeKey]
      if (!attributeValue || typeof attributeValue !== 'string') {
        return deadline
      }
      const normalizedValue = attributeValue.trim()
      if (!timeUtil.isDate(normalizedValue) || normalizedValue === deadline?.date) {
        return deadline
      }
      const updatedDeadline = {
        ...deadline,
        date: normalizedValue
      }
      overrides.push({
        attribute: attributeKey,
        newDate: normalizedValue,
        originalDate: deadlineArray[index]?.date
      })
      return updatedDeadline
    })
    return merged
  }

  function createNowMarker(week, weeksInMonth) {
    const totalWeeks = weeksInMonth || 5
    const normalizedWeek = Math.min(Math.max(week, 1), totalWeeks)
    let nowMarker = []
    for (let i = 1; i <= totalWeeks; i++) {
      if (i === normalizedWeek) {
        nowMarker.push(
          <div key={i} className="now-marker">
            <span>{t('deadlines.now')}</span>
          </div>
        )
      } else {
        nowMarker.push(<div key={i} className="now-marker-filler" />)
      }
    }
    return nowMarker
  }
  
  function createDrawMonths(months) {
    if (!months || !months.length) {
      setDrawMonths([])
      return 0
    }
    const drawableMonths = []
    const nowDate = dayjs()
    const nowKey = `${nowDate.year()}-${nowDate.month()}`
    let totalColumns = 0
    for (let i = 0; i < months.length; i++) {
      const monthData = months[i]
      const weeks = monthData?.weeks || 5
      const date = dayjs()
        .year(monthData.year)
        .month(monthData.month)
        .date(1)
      totalColumns += weeks
      const showNowMarker = monthData.date === nowKey
      drawableMonths.push(
        <div
          key={`${monthData.date}-${i}`}
          className="timeline-month"
          style={{ gridColumn: `span ${weeks}` }}
        >
          {showNowMarker ? (
            <div
              className="timeline-now-month"
              style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
            >
              {createNowMarker(findWeek(nowDate), weeks)}
            </div>
          ) : null}
          <span>{`${monthNames[date.month()]} ${date.year()}`}</span>
        </div>
      )
    }
    setDrawMonths([...drawableMonths])
    return totalColumns
  }
  function checkDeadlineType(monthDates, property, propI, loopIndex) {
    switch (monthDates[loopIndex][property].deadline_type[0]) {
      case 'phase_start': {
        const startItem = monthDates[loopIndex][property]
        let startClass = 'timeline-item'
        if (startItem.is_first && startItem.is_last) {
          startClass = 'timeline-item first last'
        } else if (startItem.is_first) {
          startClass = 'timeline-item first'
        } else if (startItem.is_last) {
          startClass = 'timeline-item last'
        } else {
          // Fallback for phase_start (legacy behavior)
          startClass = 'timeline-item first'
        }
        return (
          <div
            key={`${startItem.abbreviation}-${loopIndex}`}
            style={{
              background: startItem.color_code
            }}
            className={startClass}
          >
            <span
              className={`deadline-name-${
                startItem.deadline_length > 4 ? 'over' : 'inside'
              }`}
            >
              {startItem.phase_name}
            </span>
            {monthDates[loopIndex].milestone
              ? createMilestoneItem(loopIndex, propI, monthDates)
              : ''}
          </div>
        )
      }
      case 'mid_point': {
        const item = monthDates[loopIndex][property]
        let midClass = 'timeline-item'
        if (item.is_first && item.is_last) {
          midClass = 'timeline-item first last'
        } else if (item.is_first) {
          midClass = 'timeline-item first'
        } else if (item.is_last) {
          midClass = 'timeline-item last'
        }
        return (
          <div
            key={`${item.abbreviation}-${loopIndex}`}
            style={{
              background: item.color_code
            }}
            className={midClass}
          >
            {item.is_first && item.phase_name ? (
              <span className="deadline-name-over">{item.phase_name}</span>
            ) : null}
            {monthDates[loopIndex].milestone
              ? createMilestoneItem(loopIndex, propI, monthDates)
              : ''}
          </div>
        )
      }
      case 'phase_end': {
        const endItem = monthDates[loopIndex][property]
        let endClass = 'timeline-item'
        if (endItem.is_first && endItem.is_last) {
          endClass = 'timeline-item first last'
        } else if (endItem.is_first) {
          endClass = 'timeline-item first'
        } else if (endItem.is_last) {
          endClass = 'timeline-item last'
        } else if (!endItem.not_last_end_point) {
          // Fallback for phase_end that should have last (legacy behavior)
          endClass = 'timeline-item last'
        }
        return (
          <div
            key={`${endItem.abbreviation}-${loopIndex}`}
            style={{
              background: endItem.color_code
            }}
            className={endClass}
          >
            {monthDates[loopIndex].milestone
              ? createMilestoneItem(loopIndex, propI, monthDates)
              : ''}
          </div>
        )
      }
      case 'start_end_point':
        return (
          <div
            key={`${monthDates[loopIndex][property].abbreviation}-${loopIndex}`}
            style={{
              background: monthDates[loopIndex][property].color_code
            }}
            className="timeline-item first last"
          >
            <span
              className={`deadline-name-${
                monthDates[loopIndex][property].deadline_length > 4 ? 'inside' : 'over'
              }`}
            >
              {monthDates[loopIndex][property].phase_name}
            </span>
            {monthDates[loopIndex].milestone ? createMilestoneItem(loopIndex, propI) : ''}
          </div>
        )
      case 'past_start_point': {
        const pastItem = monthDates[loopIndex][property]
        let pastClass = 'timeline-item'
        if (pastItem.is_first && pastItem.is_last) {
          pastClass = 'timeline-item first last'
        } else if (pastItem.is_first) {
          pastClass = 'timeline-item first'
        } else if (pastItem.is_last) {
          pastClass = 'timeline-item last'
        }
        return (
          <div
            key={`${pastItem.abbreviation}-${loopIndex}`}
            style={{
              background: pastItem.color_code
            }}
            className={pastClass}
          >
            <span
              className={`deadline-name-${
                pastItem.deadline_length > 4 ? 'over' : 'inside'
              }`}
            >
              {pastItem.phase_name}
            </span>
            {monthDates[loopIndex].milestone
              ? createMilestoneItem(loopIndex, propI, monthDates)
              : ''}
          </div>
        )
      }
      default:
        return null
    }
  }
  function createDrawItems(monthDates) {
    const drawableItems = []
    const has = Object.prototype.hasOwnProperty
    if (monthDates) {
      for (let i = 0; i < monthDates.length; i++) {
        // object has 2 keys by default (date, week), check if any additional keys have been added
        if (Object.keys(monthDates[i]).length > 2) {
          let propI = 0
          let rendered = false
          for (const property in monthDates[i]) {
            if (has.call(monthDates[i], property)) {
              if (typeof monthDates[i][property] === 'object') {
                if (Array.isArray(monthDates[i][property].deadline_type)) {
                  propI++
                  drawableItems.push(checkDeadlineType(monthDates, property, propI, i))
                  rendered = true
                  break
                }
              }
            }
          }
          if (!rendered) {
            drawableItems.push(
              <div className="timeline-item" key={`space-${i}`} />
            )
          }
        } else {
          drawableItems.push(
            <div className="timeline-item" key={`${monthDates[i].abbreviation}-${i}`} /> // space
          )
        }
      }
      setDrawItems([...drawableItems])
    }
  }
  function createMilestoneItem(index, propertyIndex, monthDates) {
    const date = dayjs(monthDates[index].milestoneDate)
    let showMessage = null
    let milestoneType = []
    let listKey = 0
    if (monthDates) {
      if (propertyIndex <= 1) {
        if (monthDates[index]) {
          monthDates[index].milestone_types.forEach(milestone_type => {
            switch (milestone_type) {
              case 'dashed_start':
                if (monthDates[index].milestone_types.includes('milestone')) {
                  showMessage = (
                    <span className="milestone-message">
                      {t('deadlines.deadline-label', {
                        date: date.date(),
                        month: date.month() + 1
                      })}
                    </span>
                  )
                }
                milestoneType.push(
                  <div key={listKey++} className="milestone-icon square white" />,
                  <div key={listKey++} className="milestone-icon square second white" />
                )
                break
              case 'dashed_mid':
                milestoneType.push(
                  <div key={listKey++} className="milestone-icon square white" />,
                  <div key={listKey++} className="milestone-icon square second white" />
                )
                break
              case 'dashed_end':
                if (monthDates[index].milestone_types.includes('milestone')) {
                  showMessage = (
                    <span
                      className={`milestone-message ${
                        monthDates[index].milestone_space < 6 ? 'under' : ''
                      }`}
                    >
                      {t('deadlines.kylk-message', {
                        date: date.date(),
                        month: date.month() + 1
                      })}
                    </span>
                  )
                  milestoneType.push(
                    <div key={listKey++} className="milestone-icon sphere black" />
                  )
                } else {
                  showMessage = (
                    <span
                      className={`milestone-message ${
                        monthDates[index].milestone_space < 6 ? 'under' : ''
                      }`}
                    >
                      {t('deadlines.shown')}
                    </span>
                  )
                  milestoneType.push(
                    <div key={listKey++} className="milestone-icon square white" />
                  )
                }
                break
              case 'inner_start':
                milestoneType.push(
                  <div key={listKey++} className="milestone-icon inner start white" />
                )
                break
              case 'inner_mid':
                milestoneType.push(
                  <div key={listKey++} className="milestone-icon inner white" />
                )
                break
              case 'inner_end':
                milestoneType.push(
                  <div key={listKey++} className="milestone-icon inner end white" />
                )
                break
              case 'milestone':
                milestoneType.push(
                  <div key={listKey++} className="milestone-icon sphere white" />
                )
                break
              default:
                break
            }
          })
          return (
            <span className="deadline-milestone">
              {milestoneType}
              {showMessage}
            </span>
          )
        } else {
          return null
        }
      } else {
        return null
      }
    } else {
      return null
    }
  }

  function createTimelineItems(timelineDeadlines, hasPreCheckErrors = false) {
    const months = createMonths(timelineDeadlines)
    const deadlineArray = createDeadlines(timelineDeadlines, months.months)
    if (months.error || deadlineArray.error || hasPreCheckErrors) {
      setShowError(true)
    } else {
      setShowError(false)
    }
    const columnsFromMonths = createDrawMonths(months.months)
    const columns = columnsFromMonths || months.totalWeeks
    const resolvedColumns = columns || (deadlineArray.deadlines ? deadlineArray.deadlines.length : 0)
    setColumnCount(resolvedColumns)
    createDrawItems(deadlineArray.deadlines)
  }
  const containerClass =
    onhold || showError
      ? 'timeline-graph-container hide-background'
      : 'timeline-graph-container';
    return (
    <div className={containerClass}>
      {onhold ? (
        <Notification className='timeline-onhold-message' type='alert' label={t('deadlines.project-stopped')}>
          <p>{t('deadlines.project-stopped-text')}</p>
        </Notification>
      ) : null}
      {showError && !onhold ? (
        <Notification className='timeline-error-message' type='error' label={t('deadlines.timeline-error')}>
          <p>{t('deadlines.timeline-error-text')}</p>
        </Notification>
      ) : null}
      <div
        className={`timeline-item-container ${showError ? 'timeline-error' : ''}`}
        style={{ gridTemplateColumns: `repeat(${Math.max(columnCount, 1)}, 1fr)` }}
      >
        {drawItems}
      </div>
      <div
        className={`timeline-months ${showError ? 'timeline-error' : ''}`}
        style={{ gridTemplateColumns: `repeat(${Math.max(columnCount, 1)}, 1fr)` }}
      >
        {drawMonths}
      </div>
    </div>
  )
}

const mapDispatchToProps = {
  getProject,
  getProjectSuccessful
}


ProjectTimeline.propTypes= {
  deadlines: PropTypes.array,
  projectView: PropTypes.bool,
  onhold: PropTypes.bool,
  attribute_data: PropTypes.object,
}

export default connect(null, mapDispatchToProps)(ProjectTimeline)
