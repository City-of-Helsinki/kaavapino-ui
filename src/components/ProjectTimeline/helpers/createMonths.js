import dayjs from 'dayjs'

const getWeeksInMonth = monthStart => {
  const firstWeekday = monthStart.startOf('month').day()
  const daysInMonth = monthStart.daysInMonth()
  const weeks = Math.ceil((firstWeekday + daysInMonth) / 7)
  if (weeks < 4) {
    return 4
  }
  if (weeks > 6) {
    return 6
  }
  return weeks
}

/**
 * @desc creates array of months that should be rendered, from first date of deadline
 * @param deadlines - deadlines from api
 * @return object - with months array, error flag and total week count
 */
export function createMonths(deadlines) {
  let error = false
  if (!deadlines || !deadlines.length || !deadlines[0]?.date) {
    error = true
  }

  const monthArray = []
  const start = dayjs().startOf('month').subtract(1, 'month')

  for (let i = 0; i < 13; i++) {
    const currentMonth = start.add(i, 'month')
    const weeks = getWeeksInMonth(currentMonth)
    monthArray.push({
      date: `${currentMonth.year()}-${currentMonth.month()}`,
      year: currentMonth.year(),
      month: currentMonth.month(),
      weeks
    })
  }

  const totalWeeks = monthArray.reduce((sum, month) => sum + month.weeks, 0)

  return { months: monthArray, totalWeeks, error }
}
