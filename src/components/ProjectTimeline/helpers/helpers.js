import dayjs from 'dayjs'

export function findInMonths(date, week, monthDates) {
  date = dayjs(date)

  const tempDate = date.add(1, 'month')
  date = `${tempDate.year()}-${tempDate.month()}`
  let monthIndex = null
  for (let i = 0; i < monthDates.length; i++) {
    if (date === monthDates[i].date && week === monthDates[i].week) {
      monthIndex = i
      break
    }
  }
  return monthIndex
}
export function findWeek(date) {

  if (Math.round(date / 5) < 1) {
    return 1
  } else if (Math.round(date / 5) > 5) {
    return 5
  } else {
    return Math.round(date / 5)
  }
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
 * @desc checks deadlines for errors
 * @param deadlines - deadlines from api
 * @return boolean
 */
export function checkDeadlines(deadlines) {
  if (!deadlines) {
    return true
  }
  if (!deadlines[0]) {
    return true
  }
  if (!deadlines[0].date) {
    return true
  }
  const has = Object.prototype.hasOwnProperty
  let deadlineAbbreviation = null
  let deadlineError = false
  deadlines.forEach(deadline => {
    if (deadline.deadline) {
      if (deadline.deadline.deadline_types) {
        for (const prop in deadline.deadline.deadline_types) {
          if (has.call(deadline.deadline.deadline_types, prop)) {
            if (deadline.deadline.deadline_types[prop] === 'phase_start') {
              deadlineAbbreviation = deadline.deadline.abbreviation.charAt(0)
            }
            if (deadlineAbbreviation) {
              if (deadlineAbbreviation !== deadline.deadline.abbreviation.charAt(0)) {
                deadlineError = true
              }
            }
          }
        }
      }
    }
    if (deadline) {
      if (deadline.is_under_min_distance_next) {
        deadlineError = true
      }
      if (deadline.is_under_min_distance_previous) {
        deadlineError = true
      }
      if (deadline.out_of_sync) {
        deadlineError = true
      }
    } else {
      deadlineError = true
    }
  })
  if (deadlineError) {
    return true
  }
  return false
}
