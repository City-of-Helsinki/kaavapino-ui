import dayjs from 'dayjs'

export function findInMonths(date, week, monthDates) {
  const parsedDate = dayjs(date)
  const monthKey = `${parsedDate.year()}-${parsedDate.month()}`
  let monthIndex = null
  for (let i = 0; i < monthDates.length; i++) {
    if (monthKey === monthDates[i].date && week === monthDates[i].week) {
      monthIndex = i
      break
    }
  }
  return monthIndex
}
export function findWeek(date) {
  const parsedDate = dayjs(date)
  const firstWeekday = parsedDate.startOf('month').day()
  const dayOfMonth = parsedDate.date()
  const calculatedWeek = Math.floor((firstWeekday + dayOfMonth - 1) / 7) + 1
  if (calculatedWeek < 1) {
    return 1
  }
  if (calculatedWeek > 6) {
    return 6
  }
  return calculatedWeek
}
/**
 * @desc cleans deadline object
 * @param deadlines - deadlines from api
 * @return object
 */
export function cleanDeadlines(deadlines) {
  let cleanedDeadlines = deadlines
  let deadlineType = null
  let deadlineEndPoints = []
  const has = Object.prototype.hasOwnProperty
  // cleanup deadline start and end points
  cleanedDeadlines.forEach(function (deadline, index, object) {
    if (deadline.deadline) {
      if (deadline.deadline.deadline_types) {
        for (const prop in deadline.deadline.deadline_types) {
          if (has.call(deadline.deadline.deadline_types, prop)) {
            if (
              deadline.deadline.deadline_types[prop] === 'phase_start' ||
              deadline.deadline.deadline_types[prop] === 'phase_end'
            ) {
              if (!deadlineType) {
                deadlineType = deadline.deadline.deadline_types[prop]
              } else if (deadlineType === deadline.deadline.deadline_types[prop]) {
                object.splice(index - 1, 1)
                deadlineType = null
              } else {
                deadlineType = deadline.deadline.deadline_types[prop]
              }
              if (deadline.deadline.deadline_types[prop] === 'phase_end') {
                deadlineEndPoints.push(index)
              }
            } else {
              deadlineType = null
            }
          }
        }
      }
    }
  })
  deadlineEndPoints.forEach((arr, index, array) => {
    if (array[index - 1]) {
      if (
        cleanedDeadlines[arr].deadline.abbreviation.charAt(0) ===
        cleanedDeadlines[array[index - 1]].deadline.abbreviation.charAt(0)
      ) {
        cleanedDeadlines[array[index - 1]].not_last_end_point = true
      }
    }
  })
  return cleanedDeadlines
}
/**
 * @desc checks if deadlines have errors (missing dates, wrong order, min distance)
 * @param deadlines - deadlines from api
 * @return true if errors, false if no errors
 */
export function deadlinesHaveErrors(deadlines) {
  if (!deadlines?.[0]?.date) {
    return true
  }
  let currDeadlineAbbreviation = null
  for (const deadline of deadlines) {
    const abbrChar = deadline.deadline?.abbreviation?.charAt(0)
    if (deadline?.deadline?.deadline_types?.includes('phase_start')) {
      currDeadlineAbbreviation = abbrChar
    }
    if (currDeadlineAbbreviation && currDeadlineAbbreviation !== abbrChar) {
      return true
    }
    if (deadline?.is_under_min_distance_next || deadline?.is_under_min_distance_previous || deadline?.out_of_sync) {
      return true
    }
  }
  return false
}
