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


  for (let i = 0; i < 65; i++) {
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
  let voimaantuloData = null
  let voimaantuloInserted = false

  // ✅ Hyväksyminen phase H1 + H2/H3
  const hyväksyminenStart = deadlines.find(dl => dl.deadline?.abbreviation === 'H1')
  const hyväksyminenEnd = deadlines.find(dl =>
    dl.deadline?.abbreviation === 'H2' && !!dl.date
  ) || deadlines.find(dl =>
    dl.deadline?.abbreviation === 'H3' && !!dl.date
  )

  let endIndex = null

  if (hyväksyminenStart && hyväksyminenEnd) {
    const startDate = dayjs(hyväksyminenStart.date)
    const endDate = dayjs(hyväksyminenEnd.date)

    const startWeek = findWeek(startDate.date())
    const startIndex = findInMonths(hyväksyminenStart.date, startWeek, monthDates)

    const endWeek = findWeek(endDate.date())
    endIndex = findInMonths(hyväksyminenEnd.date, endWeek, monthDates)

    if (startIndex != null) {
      monthDates[startIndex]['H1'] = {
        abbreviation: 'H1',
        deadline_type: ['phase_start'],
        phase_id: hyväksyminenStart.deadline.phase_id,
        color_code: hyväksyminenStart.deadline.phase_color_code,
        phase_name: hyväksyminenStart.deadline.phase_name,
        deadline_length: endIndex != null ? endIndex - startIndex + 1 : 2
      }
    }

    if (endIndex != null) {
      monthDates[endIndex]['H1'] = {
        abbreviation: 'H1',
        deadline_type: ['phase_end'],
        phase_id: hyväksyminenStart.deadline.phase_id,
        color_code: hyväksyminenStart.deadline.phase_color_code,
        phase_name: hyväksyminenStart.deadline.phase_name,
        deadline_length: 2
      }
    }

    // ✅ Collect V1 data for insertion
    const v1 = deadlines.find(dl => dl.deadline?.abbreviation === 'V1')
    if (v1 && endIndex != null) {
      voimaantuloData = {
        index: endIndex,
        payload: {
          abbreviation: 'V1',
          deadline_type: ['phase_start'],
          phase_id: v1.deadline.phase_id,
          color_code: v1.deadline.phase_color_code,
          phase_name: v1.deadline.phase_name,
          deadline_length: 2
        }
      }
    }
  }

  // 🔁 Default loop for other deadlines (except those we're overriding)
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

    // ✅ skip all V1 + H1/H2/H3 since we manage them manually
    if (
      (abbreviation === 'H1' || abbreviation === 'H2' || abbreviation === 'H3' || abbreviation === 'V1')
    ) {
      return
    }

    const existing = monthDates[monthIndex][abbreviation]

    if (existing && (
      (existing.deadline_type.includes('phase_start') && types.includes('phase_end')) ||
      (existing.deadline_type.includes('phase_end') && types.includes('phase_start'))
    )) {
      monthDates[monthIndex][abbreviation] = {
        abbreviation: existing.abbreviation || abbreviation,
        deadline_type: ['start_end_point'],
        phase_id: phaseId,
        color_code: color,
        phase_name: phaseName,
        deadline_length: 1
      }
      return
    }

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

    if (types.length > 1 && types.includes('phase_start') && types.includes('phase_end')) {
      monthDates[monthIndex][abbreviation] = {
        abbreviation,
        deadline_type: ['start_end_point'],
        phase_id: phaseId,
        color_code: color,
        phase_name: phaseName,
        deadline_length: 1
      }
      hasRealStart = true
    } else {
      const isStart = types[0] === 'phase_start'
      monthDates[monthIndex][abbreviation] = {
        abbreviation,
        deadline_type: [types[0]],
        phase_id: phaseId,
        color_code: color,
        phase_name: phaseName,
        not_last_end_point: deadline.not_last_end_point,
        deadline_length: 2
      }
      if (isStart) hasRealStart = true
    }
  })

  // ✅ Final V1 manual insert (after all processing)
  if (voimaantuloData && !voimaantuloInserted) {
    monthDates[voimaantuloData.index]['V1'] = voimaantuloData.payload
    voimaantuloInserted = true
  }

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
  let phaseName = null

  for (let i = 0; i < monthDates.length; i++) {
    const month = monthDates[i]

    for (const prop in month) {
      if (!has.call(month, prop)) continue

      const item = month[prop]
      if (!item || !Array.isArray(item.deadline_type)) continue

      const type = item.deadline_type[0]
      console.log(item)
      // --- START ---
      if (type === 'phase_start' || type === 'past_start_point') {
        currentAbbr = item.abbreviation
        currentColor = item.color_code
        currentStartIndex = i
        currentStartProp = prop
        deadlineLength = 2
        has_endpoint_in_range = true,
        phaseName = item.phase_name || null
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
      console.log(deadlineLength,currentAbbr)
      month.midpoint = {
        abbreviation: currentAbbr,
        deadline_type: deadlineLength === 2 && currentAbbr !== "K1" ? ['phase_start'] : ['mid_point'],
        color_code: currentColor,
        phase_name: deadlineLength === 2 && currentAbbr !== "K1" ? phaseName : null
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
  if (!inputMonths || !deadlines) {
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
        const week = findWeek(date.date())
        const monthIndex = findInMonths(deadline.date, week, monthDates)

        if (monthIndex != null) {
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
        for (let j = 1; j < deadline_length; j++) {
          const target = monthDates[i + j]
          if (target && !target[abbreviation]) {
            target[abbreviation] = {
              abbreviation,
              deadline_type: ['mid_point'],
              color_code
            }
          }
        }
      }
    }
  }

  return { deadlines: monthDates, error: false }
}