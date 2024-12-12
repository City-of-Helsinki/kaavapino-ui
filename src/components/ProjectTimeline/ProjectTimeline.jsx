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
  }, []);

  useEffect(() => {
    const filteredDeadlines = filterVisibleDeadlines(deadlines, attribute_data)
    if (filteredDeadlines) {
      createTimelineItems(filteredDeadlines)
    }
  }, [deadlines]);

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
      // Special cases where bool is missing from attributeData
      if (['oas_esillaolokerta_1','ehdotus_nahtavillaolokerta_1','tarkistettu_ehdotus_lautakuntakerta_1'].includes(group)){
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
     for (let i = 0; i < months.length; i++) {
      const date = dayjs(months[i].date)
      if (i === 1) {
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
    switch (monthDates[loopIndex][property].deadline_type[0]) {
      case 'phase_start':
        return (
          <div
            key={`${monthDates[loopIndex][property].abbreviation}-${loopIndex}`}
            style={{
              background: monthDates[loopIndex][property].color_code
            }}
            className="timeline-item first"
          >
            <span
              className={`deadline-name-${
                monthDates[loopIndex][property].deadline_length > 4 ? 'over' : 'inside'
              }`}
            >
              {monthDates[loopIndex][property].phase_name}
            </span>
            {monthDates[loopIndex].milestone
              ? createMilestoneItem(loopIndex, propI, monthDates)
              : ''}
          </div>
        )
      case 'mid_point':
        return (
          <div
            key={`${monthDates[loopIndex][property].abbreviation}-${loopIndex}`}
            style={{
              background: monthDates[loopIndex][property].color_code
            }}
            className="timeline-item"
          >
            {monthDates[loopIndex].milestone
              ? createMilestoneItem(loopIndex, propI, monthDates)
              : ''}
          </div>
        )
      case 'phase_end':
        if (monthDates[loopIndex][property].not_last_end_point) {
          return (
            <div
              key={`${monthDates[loopIndex][property].abbreviation}-${loopIndex}`}
              style={{
                background: monthDates[loopIndex][property].color_code
              }}
              className="timeline-item"
            >
              {monthDates[loopIndex].milestone
                ? createMilestoneItem(loopIndex, propI, monthDates)
                : ''}
            </div>
          )
        } else {
          return (
            <div
              key={`${monthDates[loopIndex][property].abbreviation}-${loopIndex}`}
              style={{
                background: monthDates[loopIndex][property].color_code
              }}
              className="timeline-item last"
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
      case 'past_start_point':
        return (
          <div
            key={`${monthDates[loopIndex][property].abbreviation}-${loopIndex}`}
            style={{
              background: monthDates[loopIndex][property].color_code
            }}
            className="timeline-item"
          >
            <span
              className={`deadline-name-${
                monthDates[loopIndex][property].deadline_length > 4 ? 'over' : 'inside'
              }`}
            >
              {monthDates[loopIndex][property].phase_name}
            </span>
            {monthDates[loopIndex].milestone
              ? createMilestoneItem(loopIndex, propI, monthDates)
              : ''}
          </div>
        )
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
          for (const property in monthDates[i]) {
            if (has.call(monthDates[i], property)) {
              if (typeof monthDates[i][property] === 'object') {
                if (Array.isArray(monthDates[i][property].deadline_type)) {
                  propI++
                  drawableItems.push(checkDeadlineType(monthDates, property, propI, i))
                }
              }
            }
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

                  const tempDate = date.add(1, 'month')
                  showMessage = (
                    <span className="milestone-message">
                      {t('deadlines.deadline-label', {
                        date: tempDate.date(),
                        month:tempDate.month()
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

                  const tempDate = date.add(1, 'month')
                  showMessage = (
                    <span
                      className={`milestone-message ${
                        monthDates[index].milestone_space < 6 ? 'under' : ''
                      }`}
                    >
                      {t('deadlines.kylk-message', {
                        date: tempDate.date(),
                        month: tempDate.month() === 0 ? 12 : tempDate.month()
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

  function createTimelineItems(timelineDeadlines) {
    const months = createMonths(timelineDeadlines)
    const deadlineArray = createDeadlines(timelineDeadlines)
    if (months.error || deadlineArray.error) {
      setShowError(true)
    }
    createDrawMonths(months.months)
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
