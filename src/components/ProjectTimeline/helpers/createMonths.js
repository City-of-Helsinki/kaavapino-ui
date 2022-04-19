import dayjs from 'dayjs'

/**
 * @desc creates array of months that should be rendered, from first date of deadline
 * @param deadlines - deadlines from api
 * @return object - with months array, error
 */
export function createMonths(deadlines) {
  let date = dayjs()
  let error = false
  let monthArray = []
  if (!deadlines) {
    date = dayjs()
    error = true
  }
  if (date.year() < 1980) {
    date = dayjs()
    error = true
  }

  date = date.subtract(1, 'month')
  for (let i = 0; i < 13; i++) {
    if (i > 0) {
      date = date.date(1)
      date = date.add(1, 'month')
    }
    const tempMonth = date.add(1, 'month')
    monthArray.push({ date: `${tempMonth.year()}-${tempMonth.month()}` })
   }
  // if date is not set will return Jan 01 1970 and will show error
  if (error) {
    return { months: monthArray, error: true }
  } else {
    return { months: monthArray, error: false }
  }
}
