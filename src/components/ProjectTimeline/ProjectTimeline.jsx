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
import { getVisibilityBoolName } from '../../utils/projectVisibilityUtils';
import { attributeDataSelector } from '../../selectors/projectSelector';

function ProjectTimeline(props) {
  const { deadlines, projectView, onhold, attribute_data } = props
  const { t } = useTranslation()
  const [showError, setShowError] = useState(false)
  const [drawMonths, setDrawMonths] = useState([])
  const [drawItems, setDrawItems] = useState([])
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
    const filteredDeadlines = filterVisibleDeadlines(deadlines, attribute_data)
    if (!projectView) {
      const months = createMonths(filteredDeadlines)
      createDrawMonths(months.months)
    } else {
      createTimelineItems(filteredDeadlines)
    }
  }, [])

  useEffect(() => {
    const filteredDeadlines = filterVisibleDeadlines(deadlines, attribute_data)
    if (filteredDeadlines) {
      createTimelineItems(filteredDeadlines)
    }
  }, [deadlines])

  function filterVisibleDeadlines(deadlineArray, attributeData) {
    return deadlineArray.filter((deadline) => {
      const group = deadline?.deadline?.deadlinegroup;
      if (!group) {
        // Phase start/end dates have no group; this is ok.
        return true;
      }
      const visBool = getVisibilityBoolName(group);
      if (!visBool) {
        // deadlines with no visibility bool should be shown by default
        return true;
      }
      return attributeData ? attributeData[visBool] : false;
    });
  }

  function createNowMarker(week) {
    let nowMarker = []
    for (let i = 1; i <= 5; i++) {
      if (i === week) {
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
    const drawableMonths = []
    const nowDate = dayjs()
    
    // Find which month index corresponds to the current month
    let currentMonthIndex = 0; // Default to first month
    for (let i = 0; i < months.length; i++) {
      const monthDate = dayjs(months[i].date);
      if (monthDate.month() === nowDate.month() && monthDate.year() === nowDate.year()) {
        currentMonthIndex = i;
        break;
      }
    }
    
    for (let i = 0; i < months.length; i++) {
      const date = dayjs(months[i].date)
      if (i === currentMonthIndex) { // Use the found current month index instead of hardcoding to 1
        drawableMonths.push(
          <div key={i} className="timeline-month">
            <div className="timeline-now-month">
              {createNowMarker(findWeek(nowDate.date()))}
            </div>
            <span>{`${monthNames[date.month()]} ${date.year()}`}</span>
          </div>
        )
      } else {
        drawableMonths.push(
          <div key={i} className="timeline-month">
            <span>{`${monthNames[date.month()]} ${date.year()}`}</span>
          </div>
        )
      }
    }
    setDrawMonths([...drawableMonths])
  }

  function checkDeadlineType(monthDates, property, propI, loopIndex) {
    const slot = monthDates[loopIndex][property]
    if (!slot || !Array.isArray(slot.deadline_type)) return null

    const type = slot.deadline_type[0]
    console.log(type, slot)
    switch (type) {
      case 'phase_start':
        return (
          <div
            key={`${slot.abbreviation}-${loopIndex}`}
            style={{ background: slot.color_code }}
            className="timeline-item first"
          >
            <span className={`deadline-name-${slot.deadline_length > 4 ? 'over' : 'inside'}`}>
              {slot.phase_name}
            </span>
            {monthDates[loopIndex].milestone ? createMilestoneItem(loopIndex, propI, monthDates) : null}
          </div>
        )

      case 'mid_point': {
        // Check if next week has a phase_start
        let isNextPhaseStart = false;
        console.log(slot.abbreviation)
        // Only add the 'last' class if the current phase is "Tarkistettu ehdotus"
        if (slot.abbreviation === "T1" && loopIndex < monthDates.length - 1) {
          const nextWeek = monthDates[loopIndex + 1];
          for (const key in nextWeek) {
            const item = nextWeek[key];
            if (
              Object.prototype.hasOwnProperty.call(nextWeek, key) &&
              typeof item === 'object' &&
              Array.isArray(item.deadline_type) &&
              item.deadline_type.includes('phase_start')
            ) {
              isNextPhaseStart = true;
              break;
            }
          }
        }

        return (
          <div
            key={`${slot.abbreviation}-${loopIndex}`}
            style={{ background: slot.color_code }}
            className={`timeline-item${isNextPhaseStart ? ' last' : ''}`}
          >
            {slot.phase_name && (
              <span className={`deadline-name-${slot.deadline_length > 4 ? 'over' : 'over'}`}>
                {slot.phase_name}
              </span>
            )}
            {monthDates[loopIndex].milestone ? createMilestoneItem(loopIndex, propI, monthDates) : null}
          </div>
        )
      }

      case 'phase_end':
        return (
          <div
            key={`${slot.abbreviation}-${loopIndex}`}
            style={{ background: slot.color_code }}
            className={`timeline-item ${slot.not_last_end_point ? '' : 'last'}`}
          >
            {monthDates[loopIndex].milestone ? createMilestoneItem(loopIndex, propI, monthDates) : null}
          </div>
        )

      case 'start_end_point':
        return (
          <div
            key={`${slot.abbreviation}-${loopIndex}`}
            style={{ background: slot.color_code }}
            className="timeline-item first last"
          >
            <span className={`deadline-name-${slot.deadline_length > 4 ? 'over' : 'inside'}`}>
              {slot.phase_name}
            </span>
            {monthDates[loopIndex].milestone ? createMilestoneItem(loopIndex, propI, monthDates) : null}
          </div>
        )

      case 'past_start_point':
        return (
          <div
            key={`${slot.abbreviation}-${loopIndex}`}
            style={{ background: slot.color_code }}
            className="timeline-item"
          >
            <span className={`deadline-name-${slot.deadline_length > 4 ? 'over' : 'inside'}`}>
              {slot.phase_name}
            </span>
            {monthDates[loopIndex].milestone ? createMilestoneItem(loopIndex, propI, monthDates) : null}
          </div>
        )

      default:
        return null
    }
  }

  function createDrawItems(monthDates) {
    const drawableItems = []
    const has = Object.prototype.hasOwnProperty

    if (!monthDates) return

    for (let i = 0; i < monthDates.length; i++) {
      const week = monthDates[i]
      let renderedItem = null
      let propertyIndex = 0

      // Try to find a real phase box for this week
      for (const key in week) {
        const item = week[key]
        if (
          has.call(week, key) &&
          typeof item === 'object' &&
          Array.isArray(item.deadline_type)
        ) {
          renderedItem = checkDeadlineType(monthDates, key, propertyIndex, i)
          break
        }
      }

      // If no phase box, but a milestone exists
      if (!renderedItem && week.milestone) {
        let milestoneColor = null

        // Try to extract color from any real phase item in this week
        for (const key in week) {
          const item = week[key]
          if (
            has.call(week, key) &&
            typeof item === 'object' &&
            Array.isArray(item.deadline_type) &&
            item.color_code
          ) {
            milestoneColor = item.color_code
            break
          }
        }

        // Check if next week has a phase_start
        let isNextPhaseStart = false;
        if (i < monthDates.length - 1) {
          const nextWeek = monthDates[i + 1];
          for (const key in nextWeek) {
            const item = nextWeek[key];
            if (
              has.call(nextWeek, key) &&
              typeof item === 'object' &&
              Array.isArray(item.deadline_type) &&
              item.deadline_type.includes('phase_start')
            ) {
              isNextPhaseStart = true;
              break;
            }
          }
        }

        renderedItem = (
          <div
            className={`timeline-item milestone-only${isNextPhaseStart ? ' last' : ''}`}
            key={`milestone-only-${i}`}
            style={milestoneColor ? { background: milestoneColor } : {}}
          >
            {createMilestoneItem(i, 0, monthDates)}
          </div>
        )
      }

      // Still nothing? Render empty week
      if (!renderedItem) {
        renderedItem = <div className="timeline-item" key={`empty-${i}`} />
      }

      drawableItems.push(renderedItem)
    }

    setDrawItems([...drawableItems])
  }

  function createMilestoneItem(index, propertyIndex, monthDates) {
    const date = dayjs(monthDates[index].milestoneDate)
    let showMessage = null
    let milestoneType = []
    let listKey = 0

    if (!monthDates[index] || propertyIndex > 1) return null

    monthDates[index].milestone_types.forEach(type => {
      console.log(type)
      switch (type) {
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
          showMessage = (
            <span
              className={`milestone-message ${
                monthDates[index].milestone_space < 6 ? 'under' : ''
              }`}
            >
              {monthDates[index].milestone_types.includes('milestone')
                ? t('deadlines.kylk-message', {
                    date: date.date(),
                    month: date.month() + 1
                  })
                : t('deadlines.shown')}
            </span>
          )
          milestoneType.push(
            <div key={listKey++} className={`milestone-icon ${monthDates[index].milestone_types.includes('milestone') ? 'sphere black' : 'square white'}`} />
          )
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
        case 'inner_end': {
          milestoneType.push(
            <div key={listKey++} className="milestone-icon inner end white" />
          )
          break
        }

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
  }

  function createTimelineItems(timelineDeadlines) {
    const deadlineArray = createDeadlines(timelineDeadlines)
    const { months, error: monthError } = createMonths(timelineDeadlines)

    if (monthError || deadlineArray.error) {
      setShowError(true)
    }

    createDrawMonths(months) //draws grid of 13 months
    console.log(deadlineArray.deadlines)
    createDrawItems(deadlineArray.deadlines) //draws the actual phases and dates
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
        style={{ gridTemplateColumns: `repeat(${drawItems.length}, 1fr)` }}
      >
        {drawItems}
      </div>
      <div className={`timeline-months ${showError ? 'timeline-error' : ''}`}>
        {drawMonths}
      </div>
    </div>
  )
}

const mapDispatchToProps = {
  getProject,
  getProjectSuccessful
}

const mapStateToProps = state => {
  return {
    attribute_data: attributeDataSelector(state)
  }
}

ProjectTimeline.propTypes= {
  deadlines: PropTypes.array,
  projectView: PropTypes.bool,
  onhold: PropTypes.bool,
  attribute_data: PropTypes.object,

}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectTimeline)
