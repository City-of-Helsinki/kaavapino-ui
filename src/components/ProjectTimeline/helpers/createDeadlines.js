import { findInMonths, findWeek, cleanDeadlines, checkDeadlines } from './helpers'
import dayjs from 'dayjs'


/**
 * @desc creates array of deadlines with milestones that should be rendered, from deadline
 * @param deadlines - deadlines from api
 * @return function
 */
export function createDeadlines(deadlines) {
  // check deadline errors
  if (checkDeadlines(deadlines)) {
    return { deadlines: null, error: true }
  }
  // Start from the current date to match createMonths
  let date = dayjs()
  let monthDatesArray = []
  let week = 1

  console.log('createDeadlines start with date:', date.format('YYYY-MM-DD'))

  for (let i = 0; i < 65; i++) {
    console.log(`Adding month date: ${date.format('YYYY-MM')} (month=${date.month() + 1}, year=${date.year()}), week: ${week}`)
    monthDatesArray.push({
      date: date.format('YYYY-MM'),
      week: week
    })

    week++

    if (week > 5) {
      date = date.date(1).add(1, 'month')
      week = 1
    }
  }

  const withMilestones = createMilestones(monthDatesArray, deadlines) // inject milestone info
  return createStartAndEndPoints(withMilestones.deadlines, cleanDeadlines(deadlines))
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

  const monthDates = inputMonths
  let firstDeadline = false
  let hasRealStart = false

  // Step 1: Pre-scan milestone weeks for dashed_start or inner_start
  const milestoneStarts = new Map()
  for (let i = 0; i < monthDates.length; i++) {
    const week = monthDates[i]
    if (week.milestone_types?.includes('dashed_start') || week.milestone_types?.includes('inner_start')) {
      for (const key in week) {
        const item = week[key]
        if (
          typeof item === 'object' &&
          item.abbreviation?.match(/[A-Z]1$/) &&
          !milestoneStarts.has(item.abbreviation)
        ) {
          milestoneStarts.set(item.abbreviation, i)
          console.log(`[MILESTONE] Will shift ${item.abbreviation} to start at milestone index ${i}`)
        }
      }
    }
  }

  // Step 2: Go through all deadlines
  deadlines.forEach(deadline => {
    if (!deadline.deadline || !deadline.date) return

    const types = deadline.deadline.deadline_types
    const abbreviation = deadline.deadline.abbreviation
    const color = deadline.deadline.phase_color_code
    const phaseName = deadline.deadline.phase_name
    const phaseId = deadline.deadline.phase_id

    if (!types || !types.length) return

    const day = dayjs(deadline.date)
    const week = findWeek(day.date())
    const monthIndex = findInMonths(deadline.date, week, monthDates)
    if (monthIndex == null) return

    const existing = monthDates[monthIndex][abbreviation]

    // If both start and end fall on the same slot
    if (existing) {
      if (
        (existing.deadline_type.includes('phase_start') && types.includes('phase_end')) ||
        (existing.deadline_type.includes('phase_end') && types.includes('phase_start'))
      ) {
        monthDates[monthIndex][abbreviation] = {
          abbreviation,
          deadline_type: ['start_end_point'],
          phase_id: phaseId,
          color_code: color,
          phase_name: phaseName,
          deadline_length: 1
        }
        return
      }
    }

    // Fallback first phase_end
    if (!firstDeadline && types[0] === 'phase_end' && !hasRealStart) {
      monthDates[0][abbreviation] = {
        abbreviation,
        deadline_type: ['past_start_point'],
        phase_id: phaseId,
        color_code: color,
        phase_name: phaseName,
        deadline_length: 2
      }
      firstDeadline = true
    }

    // If both types in same object
    if (types.length > 1 && types.includes('phase_start') && types.includes('phase_end')) {
      const targetIndex = milestoneStarts.get(abbreviation) ?? monthIndex
      monthDates[targetIndex][abbreviation] = {
        abbreviation,
        deadline_type: ['start_end_point'],
        phase_id: phaseId,
        color_code: color,
        phase_name: phaseName,
        deadline_length: 1
      }
      if (targetIndex !== monthIndex) {
        console.log(`[MOVE] Moved ${abbreviation} start_end_point from ${monthIndex} to ${targetIndex}`)
      }
      hasRealStart = true
    }

    // Standard case: place phase_start or phase_end
    else {
      const isStart = types[0] === 'phase_start'
      const targetIndex = isStart ? (milestoneStarts.get(abbreviation) ?? monthIndex) : monthIndex
      monthDates[targetIndex][abbreviation] = {
        abbreviation,
        deadline_type: [types[0]],
        phase_id: phaseId,
        color_code: color,
        phase_name: phaseName,
        not_last_end_point: deadline.not_last_end_point,
        deadline_length: 2
      }
      if (isStart && targetIndex !== monthIndex) {
        console.log(`[MOVE] Moved ${abbreviation} phase_start from ${monthIndex} to ${targetIndex}`)
      }
      if (isStart) hasRealStart = true
    }
  })

  return fillGaps(monthDates, deadlines)
}


function adjustPhaseStartToMilestones(monthDates) {
  const has = Object.prototype.hasOwnProperty

  for (let i = 0; i < monthDates.length; i++) {
    const week = monthDates[i]

    if (week.milestone && week.milestone_types?.includes('dashed_start')) {
      // Find the abbreviation that ends with 1 (O1, E1, etc.)
      const milestoneAbbr = Object.keys(week).find(k =>
        has.call(week, k) &&
        typeof week[k] === 'object' &&
        k !== 'milestone' &&
        k !== 'milestone_types' &&
        k !== 'milestoneDate' &&
        k !== 'date' &&
        k !== 'week' &&
        week[k].abbreviation &&
        week[k].abbreviation.match(/[A-Z]1$/)
      )

      if (!milestoneAbbr) continue

      // Search backwards to remove old phase_start
      for (let j = 0; j < monthDates.length; j++) {
        const w = monthDates[j]
        if (w[milestoneAbbr]?.deadline_type?.includes('phase_start')) {
          const old = w[milestoneAbbr]
          delete w[milestoneAbbr]

          // Now place it at week i (current milestone)
          week[milestoneAbbr] = {
            abbreviation: old.abbreviation,
            deadline_type: ['phase_start'],
            phase_name: old.phase_name,
            phase_id: old.phase_id,
            color_code: old.color_code,
            deadline_length: 1
          }

          break
        }
      }
    }
  }

  return monthDates
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

  const monthDates = inputMonths
  const has = Object.prototype.hasOwnProperty

  let currentAbbr = null
  let currentColor = null
  let currentStartIndex = null
  let currentStartProp = null
  let deadlineLength = 2
  let has_endpoint_in_range = false

  for (let i = 0; i < monthDates.length; i++) {
    const month = monthDates[i]

    for (const prop in month) {
      if (!has.call(month, prop)) continue

      const item = month[prop]
      if (!item || !Array.isArray(item.deadline_type)) continue

      const type = item.deadline_type[0]

      // --- START ---
      if (type === 'phase_start' || type === 'past_start_point') {
        currentAbbr = item.abbreviation
        currentColor = item.color_code
        currentStartIndex = i
        currentStartProp = prop
        deadlineLength = 2
        has_endpoint_in_range = true
      }

      // --- END ---
      if (type === 'phase_end') {
        if (currentStartIndex !== null && currentStartProp !== null) {
          const startItem = monthDates[currentStartIndex][currentStartProp]
          if (
            startItem &&
            Array.isArray(startItem.deadline_type) &&
            (startItem.deadline_type[0] === 'phase_start' || startItem.deadline_type[0] === 'past_start_point')
          ) {
            startItem.deadline_length = deadlineLength
          }
        }

        // Reset for next block
        currentAbbr = null
        currentColor = null
        currentStartIndex = null
        currentStartProp = null
        deadlineLength = 2
      }
    }

    // --- MIDPOINT ---
    if (
      currentAbbr &&
      Object.keys(month).length <= 2 // only 'date' and 'week'
    ) {
      month.midpoint = {
        abbreviation: currentAbbr,
        deadline_type: ['mid_point'],
        color_code: currentColor
      }

      deadlineLength++

      if (deadlineLength > 15) {
        if (currentStartIndex !== null && currentStartProp !== null) {
          const startItem = monthDates[currentStartIndex][currentStartProp]
          if (startItem) {
            startItem.deadline_length = deadlineLength
          }
        }

        // Stop filling
        currentAbbr = null
        currentColor = null
        currentStartIndex = null
        currentStartProp = null
        deadlineLength = 2
      }
    }

    // Final fallback length if at end
    if (i === monthDates.length - 1 && currentStartIndex !== null && currentStartProp !== null) {
      const startItem = monthDates[currentStartIndex][currentStartProp]
      if (startItem && startItem.deadline_length < deadlineLength) {
        startItem.deadline_length = deadlineLength
      }
    }
  }

  if (!has_endpoint_in_range) {
    let [min_year, min_month] = monthDates[0].date.split('-')
    min_month = min_month.length === 1 ? '0' + min_month : min_month
    let min_day = (((monthDates[0].week - 1) * 7) + 1).toString()
    min_day = min_day.length === 1 ? '0' + min_day : min_day
    const min_date = Date.parse(`${min_year}-${min_month}-${min_day}`)

    let fallbackAbbr = null
    let fallbackColor = null

    for (const dl of deadlines) {
      if (dl.deadline?.deadline_types?.includes('phase_start')) {
        fallbackAbbr = dl.deadline.abbreviation
        fallbackColor = dl.deadline.phase_color_code
      }
      if (dl.date && Date.parse(dl.date) > min_date) break
    }

    for (let i = 0; i < monthDates.length; i++) {
      monthDates[i].midpoint = {
        abbreviation: fallbackAbbr,
        deadline_type: ['mid_point'],
        color_code: fallbackColor
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
  console.log('createMilestones called')
  if (!inputMonths || !deadlines) {
    console.log('  No input months or deadlines')
    return { deadlines: null, error: true }
  }

  const monthDates = inputMonths

  deadlines.forEach(deadline => {
    if (!deadline.deadline?.deadline_types || !deadline.date) return

    for (let type of deadline.deadline.deadline_types) {
      if (
        type === 'milestone' ||
        type === 'dashed_start' ||
        type === 'dashed_end' ||
        type === 'inner_start' ||
        type === 'inner_end'
      ) {
        const date = dayjs(deadline.date)
        console.log(`  Processing milestone: ${type}, date=${deadline.date}, formatted=${date.format('YYYY-MM-DD')}`)
        const week = findWeek(date.date())
        if (type === 'dashed_end') {
        console.log(`[DEBUG] dashed_end for ${deadline.deadline.abbreviation} → ${deadline.date} → week ${week} → index ${monthIndex}`)
          if (monthIndex != null) {
            console.log(`[DEBUG] => slot =`, monthDates[monthIndex])
          }
        }
        const monthIndex = findInMonths(deadline.date, week, monthDates)

        if (monthIndex != null) {
          console.log(`  Adding milestone at month index ${monthIndex}`)
          monthDates[monthIndex].milestone = true
          monthDates[monthIndex].milestoneDate = date.format('YYYY-MM-DD')
          monthDates[monthIndex].milestone_types = deadline.deadline.deadline_types
        } else {
          console.log(`  Could not find month index for milestone ${type} at ${date.format('YYYY-MM-DD')}`)
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

  const monthDates = inputMonths
  let milestoneType = null
  let milestoneDate = null
  let milestoneSpace = 0

  for (let i = 0; i < monthDates.length; i++) {
    if (monthDates[i].milestone) {
      for (let type of monthDates[i].milestone_types) {
        switch (type) {
          case 'dashed_start':
            milestoneType = 'dashed_mid'
            milestoneDate = monthDates[i].milestoneDate
            milestoneSpace = 1
            break
          case 'dashed_end':
          case 'inner_end':
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

  // ✅ Final: robust deadline growth tracking
  const has = Object.prototype.hasOwnProperty
  let openBar = null

  for (let i = 0; i < monthDates.length; i++) {
    const month = monthDates[i]

    // First, check if this week starts a bar
    for (const prop in month) {
      if (!has.call(month, prop)) continue
      const item = month[prop]
      if (!item || !Array.isArray(item.deadline_type)) continue
      const type = item.deadline_type[0]

      if (type === 'phase_start' || type === 'past_start_point') {
        openBar = {
          index: i,
          key: prop,
          abbreviation: item.abbreviation,
        }
      }

      if (type === 'phase_end' && openBar && item.abbreviation === openBar.abbreviation) {
        // phase ends, lock length now
        const bar = monthDates[openBar.index][openBar.key]
        bar.deadline_length = i - openBar.index + 1
        openBar = null
      }
    }

    // If we are inside a bar, extend it if this week has:
    if (openBar) {
      const bar = monthDates[openBar.index][openBar.key]
      if (month.milestone || Object.values(month).some(val => val?.deadline_type?.includes('mid_point'))) {
        bar.deadline_length = i - openBar.index + 1
      }
    }
  }

  for (let i = 0; i < monthDates.length; i++) {
    const month = monthDates[i]

    for (const prop in month) {
      const item = month[prop]
      if (
        item &&
        Array.isArray(item.deadline_type) &&
        (item.deadline_type[0] === 'phase_start' || item.deadline_type[0] === 'past_start_point')
      ) {
        const { deadline_length, abbreviation, color_code } = item
        console.log(`[GROWTH] ${abbreviation} start at week ${openBar.index} extended to week ${i}`)
        for (let j = 1; j < deadline_length; j++) {
          const target = monthDates[i + j]
          if (target && !target[abbreviation]) {
            target[abbreviation] = {
              abbreviation,
              deadline_type: ['mid_point'],
              color_code
            }
            console.log(`[DEBUG] Injected mid_point for ${abbreviation} at week index ${i + j}`)
          }
        }
      }
    }
  }

  return { deadlines: monthDates, error: false }
}