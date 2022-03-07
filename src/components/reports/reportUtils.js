import { findIndex } from 'lodash'

export const parseReport = (headers, csvRows, blockColumn, timeRange) => {
  if (!csvRows || !headers) {
    return []
  }
  const kylkDates = new Set()
  csvRows.forEach(row => {
    if (row[blockColumn]) {
      const dates = row[blockColumn].split(',')

      dates.forEach(date => {
        if (timeRange) {
          const timeRangeDates = timeRange.split(',')

          const startDate = new Date(timeRangeDates[0])

          const endDate = new Date(timeRangeDates[1])

          const dateItems = date.split('.')

          const currentDate = new Date(dateItems[2], dateItems[1] - 1, dateItems[0])

          if (currentDate >= startDate && currentDate <= endDate) {
            return kylkDates.add({ date: date.trim(), current: currentDate })
          }
        } else {
          return kylkDates.add({ date: date.trim() })
        }
      })
    }
  })
  const sortDates = (a, b) => {
    const dayArray = a.date ? a.date.split('.') : []
    const dayArraySecond = b.date ? b.date.split('.') : []

    if (dayArray.length > 2 && dayArraySecond.length > 2) {
      const first = new Date()
      first.setDate(dayArray[0])
      // First month is 0 in date
      first.setMonth(dayArray[1] - 1)
      first.setFullYear(dayArray[2])

      const second = new Date()
      second.setDate(dayArraySecond[0])
      // First month is 0 in date
      second.setMonth(dayArraySecond[1] - 1)
      second.setFullYear(dayArraySecond[2])

      return first < second ? -1 : first > second ? 1 : 0
    }
    return 0
  }

  const sortedKylkDates = Array.from(kylkDates).sort((a, b) => {
    return sortDates(a, b)
  })

  const getRows = kylk => {
    const rows = []

    csvRows.forEach(row => {
      if (row[blockColumn]) {
        const valueArray = row[blockColumn].split(',')

        if (findIndex(valueArray, item => item.trim() === kylk) != -1) {
          rows.push(row)
        }
      }
    })

    return rows
  }

  const returnValue = []

  sortedKylkDates.forEach(item => {
    const value = returnValue.find(current => current.date === item.date)

    if (!value) {
      returnValue.push({ date: item.date.trim(), rows: getRows(item.date.trim()) })
    } else {
      value.rows = getRows(item.date.trim())
    }
  })

  return returnValue
}
