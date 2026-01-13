import { findInMonths, findWeek, cleanDeadlines, checkDeadlines } from './helpers'
import dayjs from 'dayjs'


/**
 * @desc creates array of deadlines with milestones that should be rendered, from deadline
 * @param deadlines - deadlines from api
 * @param monthsMeta - optional metadata describing month ordering and week counts
 * @return function
 */
export function createDeadlines(deadlines, monthsMeta = []) {
  // check deadline errors
  if (checkDeadlines(deadlines)) {
    return { deadlines: null, error: true }
  }
  const monthDatesArray = buildMonthDatesArray(monthsMeta)
  return createStartAndEndPoints(monthDatesArray, cleanDeadlines(deadlines))
}

const buildMonthDatesArray = monthsMeta => {
  if (!monthsMeta || !monthsMeta.length) {
    return buildDefaultMonthDatesArray()
  }
  const monthDatesArray = []
  monthsMeta.forEach(month => {
    const weekCount = month.weeks || 5
    for (let week = 1; week <= weekCount; week++) {
      monthDatesArray.push({
        date: month.date,
        week
      })
    }
  })
  return monthDatesArray
}

const buildDefaultMonthDatesArray = () => {
  let date = dayjs()
  let week = 1
  const monthDatesArray = []

  date = date.subtract(1, 'month')
  for (let i = 0; i < 65; i++) {
    if (i > 0 && Number.isInteger(i / 5)) {
      date = date.date(1)
      date = date.add(1, 'month')
    }

    const tempMonth = date.add(1, 'month')
    monthDatesArray.push({
      date: `${tempMonth.year()}-${tempMonth.month()}`,
      week
    })

    week++

    if (week > 5) {
      week = 1
    }
  }

  return monthDatesArray
}

/**
 * @desc Computes the actual start date for a month slot
 * @param slot - slot object with date and week properties
 * @return dayjs date
 */
function getSlotDate(slot) {
  const [yearStr, monthStr] = slot.date.split('-')
  const year = Number(yearStr) || 0
  const month = Number(monthStr) || 0
  const baseDate = dayjs(new Date(year, month, 1))
  const weekIndex = (Number(slot.week) || 1) - 1
  return baseDate.add(weekIndex * 7, 'day')
}

/**
 * @desc Build phase timeline from deadlines: maps phase_id -> { start, end, ... }
 * @param deadlines - deadlines from api
 * @return object with phase timelines
 */
function buildPhaseTimeline(deadlines) {
  const phases = {}
  deadlines.forEach(dl => {
    if (!dl.deadline || !dl.date) return
    const phaseId = dl.deadline.phase_id
    if (!phases[phaseId]) {
      phases[phaseId] = {
        phase_id: phaseId,
        phase_name: dl.deadline.phase_name,
        color_code: dl.deadline.phase_color_code,
        starts: [],
        ends: []
      }
    }
    if (dl.deadline.deadline_types?.includes('phase_start')) {
      phases[phaseId].starts.push({ date: dayjs(dl.date), deadline: dl })
    }
    if (dl.deadline.deadline_types?.includes('phase_end')) {
      phases[phaseId].ends.push({ date: dayjs(dl.date), deadline: dl })
    }
  })
  // Determine effective start/end for each phase (earliest start, latest end)
  for (const phaseId in phases) {
    const p = phases[phaseId]
    if (p.starts.length) {
      p.starts.sort((a, b) => a.date.valueOf() - b.date.valueOf())
      p.effectiveStart = p.starts[0].date
      p.startDeadline = p.starts[0].deadline
    }
    if (p.ends.length) {
      p.ends.sort((a, b) => a.date.valueOf() - b.date.valueOf())
      p.effectiveEnd = p.ends[p.ends.length - 1].date
      p.endDeadline = p.ends[p.ends.length - 1].deadline
    }
  }
  return phases
}

/**
 * @desc Find which phase is active at a given date
 * @param phases - phase timeline object
 * @param date - dayjs date to check
 * @return phase object or null
 */
function findActivePhaseAtDate(phases, date) {
  let activePhase = null
  for (const phaseId in phases) {
    const p = phases[phaseId]
    // Phase is active if: effectiveStart <= date AND (no end OR effectiveEnd >= date)
    const startOk = p.effectiveStart && !p.effectiveStart.isAfter(date, 'day')
    const endOk = !p.effectiveEnd?.isBefore(date, 'day')
    if (startOk && endOk) {
      // If multiple phases qualify, prefer the one with latest start (most recent phase)
      if (!activePhase || p.effectiveStart.isAfter(activePhase.effectiveStart)) {
        activePhase = p
      }
    }
  }
  return activePhase
}

/**
 * @desc checks deadlines for start and end points and adds them to the month object
 * @param inputMonths - array that contains months
 * @param deadlines - deadlines returned from api
 * @return function
 */
function createStartAndEndPoints(inputMonths, deadlines) {
  if (!inputMonths || !deadlines) {
    return { deadlines: null, error: true }
  }

  // Compute visible date range
  const visibleStart = getSlotDate(inputMonths[0])
  const visibleEnd = getSlotDate(inputMonths[inputMonths.length - 1]).add(6, 'day')

  // Build phase timeline
  const phases = buildPhaseTimeline(deadlines)

  // Find which phases actually overlap with the visible range
  const overlappingPhases = {}
  for (const phaseId in phases) {
    const p = phases[phaseId]
    // Phase overlaps if: effectiveStart <= visibleEnd AND effectiveEnd >= visibleStart
    const startsBeforeEnd = p.effectiveStart && !p.effectiveStart.isAfter(visibleEnd, 'day')
    const endsAfterStart = p.effectiveEnd && !p.effectiveEnd.isBefore(visibleStart, 'day')
    // Also check that start is before end (valid phase)
    const validPhase = p.effectiveStart && p.effectiveEnd && !p.effectiveStart.isAfter(p.effectiveEnd, 'day')
    if (startsBeforeEnd && endsAfterStart && validPhase) {
      overlappingPhases[phaseId] = p
    }
  }

  let monthDates = inputMonths
  let firstDeadline = false

  // Only process deadlines for phases that actually overlap with visible range
  deadlines.forEach(deadline => {
    if (deadline.deadline) {
      const phaseId = deadline.deadline.phase_id
      // Skip if this phase doesn't overlap with visible range
      if (!overlappingPhases[phaseId]) {
        return
      }

      if (
        deadline.deadline.deadline_types[0] === 'phase_start' ||
        deadline.deadline.deadline_types[0] === 'phase_end'
      ) {
        const date = dayjs(deadline.date)
        
        // Skip if this specific date is outside visible range
        if (date.isBefore(visibleStart, 'day') || date.isAfter(visibleEnd, 'day')) {
          return
        }

        const week = findWeek(date)
        const monthIndex = findInMonths(date, week, monthDates)
        if (monthIndex !== null && monthIndex !== undefined) {
          if (monthDates[monthIndex][deadline.deadline.abbreviation]) {
            if (
              monthDates[monthIndex][deadline.deadline.abbreviation].deadline_type[0] ===
              'phase_start'
            ) {
              if (deadline.deadline.deadline_types[0] === 'phase_end') {
                if (!firstDeadline) {
                  if (deadline.deadline.deadline_types[0] === 'phase_end') {
                    monthDates[0][deadline.deadline.abbreviation] = {
                      abbreviation: deadline.deadline.abbreviation,
                      deadline_type: ['past_start_point'],
                      phase_id: deadline.deadline.phase_id,
                      color_code: deadline.deadline.phase_color_code,
                      phase_name: deadline.deadline.phase_name,
                      deadline_length: 2
                    }
                  }
                  firstDeadline = true
                }
                monthDates[monthIndex][deadline.deadline.abbreviation] = {
                  abbreviation: deadline.deadline.abbreviation,
                  deadline_type: ['start_end_point'],
                  phase_id: deadline.deadline.phase_id,
                  color_code: deadline.deadline.phase_color_code,
                  phase_name: deadline.deadline.phase_name,
                  deadline_length: 2
                }
              }
            }
          } else {
            if (!firstDeadline) {
              if (deadline.deadline.deadline_types[0] === 'phase_end') {
                monthDates[0][deadline.deadline.abbreviation] = {
                  abbreviation: deadline.deadline.abbreviation,
                  deadline_type: ['past_start_point'],
                  phase_id: deadline.deadline.phase_id,
                  color_code: deadline.deadline.phase_color_code,
                  phase_name: deadline.deadline.phase_name,
                  deadline_length: 2
                }
              }
              firstDeadline = true
            }
            if (deadline.deadline.deadline_types.length > 1) {
              if (deadline.deadline.deadline_types[0] === 'phase_start' && deadline.deadline.deadline_types[1] === 'phase_end') {
                monthDates[monthIndex][deadline.deadline.abbreviation] = {
                  abbreviation: deadline.deadline.abbreviation,
                  deadline_type: ['start_end_point'],
                  phase_id: deadline.deadline.phase_id,
                  color_code: deadline.deadline.phase_color_code,
                  phase_name: deadline.deadline.phase_name,
                  deadline_length: 1
                }
              }
            } else {
            monthDates[monthIndex][deadline.deadline.abbreviation] = {
              abbreviation: deadline.deadline.abbreviation,
              deadline_type: deadline.deadline.deadline_types,
              phase_id: deadline.deadline.phase_id,
              color_code: deadline.deadline.phase_color_code,
              phase_name: deadline.deadline.phase_name,
              not_last_end_point: deadline.not_last_end_point,
              deadline_length: 2
            }
            }
          }
        }
      }
    }
  })
  return fillGaps(monthDates, deadlines)
}
/**
 * @desc fills gaps between start and end points with mid points with the same key
 * @param inputMonths - array that contains months
 * @param deadlines - deadlines returned from api
 * @return function
 */
function fillGaps(inputMonths, deadlines) {
  if (!inputMonths || !deadlines) {
    return { deadlines: null, error: true }
  }
  let monthDates = inputMonths
  let deadlineAbbreviation = null
  let color_code = null
  let phase_name = null
  let deadlineLength = 2
  let deadlinePropAbbreviation = null
  let monthDateIndex = null
  const has = Object.prototype.hasOwnProperty
  let has_endpoint_in_range = false;
  for (let i = 0; i < monthDates.length; i++) {
    for (const prop in monthDates[i]) {
      if (has.call(monthDates[i], prop)) {
        if (Object.keys(monthDates[i]).length < 4) {
          if (Array.isArray(monthDates[i][prop].deadline_type)) {
            has_endpoint_in_range = true;
            if (monthDates[i][prop].deadline_type[0] === 'phase_start' || monthDates[i][prop].deadline_type[0] === 'past_start_point') {
              deadlineAbbreviation = monthDates[i][prop].abbreviation
              color_code = monthDates[i][prop].color_code
              phase_name = monthDates[i][prop].phase_name
              deadlinePropAbbreviation = prop
              monthDateIndex = i
            } else if (monthDates[i][prop].deadline_type[0] === 'phase_end') {
              if (monthDates[monthDateIndex]) {
                monthDates[monthDateIndex][
                  deadlinePropAbbreviation
                ].deadline_length = deadlineLength
              }
              deadlineAbbreviation = null
              color_code = null
              phase_name = null
              deadlineLength = 2
              monthDateIndex = null
            }
          } else if (deadlineAbbreviation && Object.keys(monthDates[i]).length < 3) {
            deadlineLength++
            monthDates[i].midpoint = {
              abbreviation: deadlineAbbreviation,
              deadline_type: ['mid_point'],
              color_code: color_code,
              phase_name: phase_name
            }
          }
        } else {
          if (Array.isArray(monthDates[i][prop].deadline_type)) {
            has_endpoint_in_range = true;
            if (monthDates[i][prop].deadline_type[0] === 'phase_start' || monthDates[i][prop].deadline_type[0] === 'past_start_point') {
              deadlineAbbreviation = monthDates[i][prop].abbreviation
              color_code = monthDates[i][prop].color_code
              phase_name = monthDates[i][prop].phase_name
              deadlinePropAbbreviation = prop
              monthDateIndex = i
            } else {
              if (monthDates[monthDateIndex]) {
                monthDates[monthDateIndex][
                  deadlinePropAbbreviation
                ].deadline_length = deadlineLength
              }
              deadlineAbbreviation = null
              color_code = null
              phase_name = null
              monthDateIndex = null
              deadlineLength = 2
            }
          }
        }
        // Dont round out last milestone item
        if (i === monthDates.length - 1) {
          if (monthDates[monthDateIndex]) {
            monthDates[monthDateIndex][
              deadlinePropAbbreviation
            ].deadline_length = deadlineLength
          }
        }
      }
    }
  }

  // Special case: no phase start/endpoints are in visible range
  if (!has_endpoint_in_range) {
    // Use buildPhaseTimeline and findActivePhaseAtDate to get the correct active phase
    const phases = buildPhaseTimeline(deadlines)
    const visibleStart = getSlotDate(monthDates[0])
    const activePhase = findActivePhaseAtDate(phases, visibleStart)
    
    if (activePhase) {
      for (let i = 0; i < monthDates.length; i++) {
        monthDates[i].midpoint = {
          abbreviation: activePhase.startDeadline?.deadline?.abbreviation,
          deadline_type: ['mid_point'],
          color_code: activePhase.color_code,
          phase_name: activePhase.phase_name
        }
      }
    }
  }

  return createMilestones(monthDates, deadlines)
}
/**
 * @desc checks for milestones in deadlines adds them to the month object
 * @param inputMonths - array that contains months
 * @param deadlines - deadlines returned from api
 * @return function
 */
function createMilestones(inputMonths, deadlines) {
  if (!inputMonths || !deadlines) {
    return { deadlines: null, error: true }
  }
  let monthDates = inputMonths
  deadlines.forEach(deadline => {
    for (let deadlineTypeIndex in deadline.deadline.deadline_types) {
      const deadlineTypes = deadline.deadline.deadline_types[deadlineTypeIndex]
      if (
        deadlineTypes === 'milestone' ||
        deadlineTypes === 'dashed_start' ||
        deadlineTypes === 'dashed_end' ||
        deadlineTypes === 'inner_start' ||
        deadlineTypes === 'inner_end'
      ) {
        let date = dayjs(deadline.date)
        const week = findWeek(date)
        const monthIndex = findInMonths(date, week, monthDates)
        if (monthIndex !== null && monthIndex !== undefined) {
          monthDates[monthIndex].milestone = true
          monthDates[monthIndex].milestoneDate = date.format('YYYY-MM-DD')
          monthDates[monthIndex].milestone_types = deadline.deadline.deadline_types
        }
      }
    }
  })
  return fillMilestoneGaps(monthDates)
}
/**
 * @desc fills gaps between different types of milestones
 * @param inputMonths - array that contains months
 * @return array
 */
function fillMilestoneGaps(inputMonths) {
  if (!inputMonths) {
    return { deadlines: null, error: true }
  }
  let monthDates = inputMonths
  let milestoneType = null
  let milestoneDate = null
  let milestoneSpace = 0
  for (let i = 0; i < monthDates.length; i++) {
    if (monthDates[i].milestone) {
      for (let milestone_type in monthDates[i].milestone_types) {
        switch (monthDates[i].milestone_types[milestone_type]) {
          case 'dashed_start':
            milestoneType = 'dashed_mid'
            milestoneDate = monthDates[i].milestoneDate
            milestoneSpace = 1
            break
          case 'dashed_end':
            monthDates[i].milestone_space = milestoneSpace
            milestoneType = null
            milestoneDate = null
            milestoneSpace = 0
            break
          case 'inner_start':
            milestoneType = 'inner_mid'
            milestoneDate = monthDates[i].milestoneDate
            milestoneSpace = 1
            break
          case 'inner_end':
            monthDates[i].milestone_space = milestoneSpace
            milestoneType = null
            milestoneDate = null
            milestoneSpace = 0
            break
          default:
            break
        }
      }
    } else if (milestoneType !== null) {
      monthDates[i].milestone = true
      monthDates[i].milestoneDate = milestoneDate
      monthDates[i].milestone_types = [milestoneType]
    }
    if (milestoneSpace > 0) {
      milestoneSpace++
    }
  }
  return markColorTransitions(monthDates)
}

/**
 * @desc Marks items with is_first/is_last based on color transitions
 * @param inputMonths - array that contains months with deadline items
 * @return object with deadlines array and error flag
 */
function markColorTransitions(inputMonths) {
  if (!inputMonths) {
    return { deadlines: null, error: true }
  }
  const has = Object.prototype.hasOwnProperty
  
  // Helper to get the color_code from a slot
  const getSlotColor = (slot) => {
    if (!slot) return null
    for (const prop in slot) {
      if (has.call(slot, prop) && typeof slot[prop] === 'object' && slot[prop]?.color_code) {
        return slot[prop].color_code
      }
    }
    return null
  }
  
  // Helper to get the deadline item from a slot
  const getSlotItem = (slot) => {
    if (!slot) return null
    for (const prop in slot) {
      if (has.call(slot, prop) && typeof slot[prop] === 'object' && slot[prop]?.deadline_type) {
        return slot[prop]
      }
    }
    return null
  }
  
  for (let i = 0; i < inputMonths.length; i++) {
    const currentItem = getSlotItem(inputMonths[i])
    if (!currentItem) continue
    
    const currentColor = currentItem.color_code
    const prevColor = i > 0 ? getSlotColor(inputMonths[i - 1]) : null
    const nextColor = i < inputMonths.length - 1 ? getSlotColor(inputMonths[i + 1]) : null
    const deadlineType = currentItem.deadline_type?.[0]
    
    // Mark as first if:
    // - It's a phase_start (actual start of phase)
    // - OR there's a real color transition (prevColor exists AND is different)
    // But NOT for past_start_point (continuation from before visible range)
    if (deadlineType === 'phase_start' || deadlineType === 'start_end_point') {
      currentItem.is_first = true
    } else if (deadlineType !== 'past_start_point' && currentColor && prevColor && currentColor !== prevColor) {
      // Real color transition: previous slot had different color
      currentItem.is_first = true
    }
    
    // Mark as last if:
    // - It's a phase_end or start_end_point (actual end of phase)
    // - OR there's a real color transition (nextColor exists AND is different)
    // But NOT when phase continues beyond visible range (nextColor is null)
    if (deadlineType === 'phase_end' || deadlineType === 'start_end_point') {
      currentItem.is_last = true
    } else if (currentColor && nextColor && currentColor !== nextColor) {
      // Real color transition: next slot has different color (not just empty/null)
      currentItem.is_last = true
    }
  }
  
  return { deadlines: inputMonths, error: false }
}