import { describe, it, expect } from 'vitest'
import { deadlinesHaveErrors } from '../../components/ProjectTimeline/helpers/helpers'

const makeDeadline = (abbreviation, types = [], flags = {}) => ({
  date: '2026-05-20',
  deadline: {
    abbreviation,
    deadline_types: types
  },
  ...flags
})

describe('deadlinesHaveErrors', () => {
  it('returns true when deadlines is undefined', () => {
    expect(deadlinesHaveErrors(undefined)).toBe(true)
  })

  it('returns true when deadlines is empty', () => {
    expect(deadlinesHaveErrors([])).toBe(true)
  })

  it('returns true when the first deadline has no date', () => {
    expect(deadlinesHaveErrors([{ deadline: { abbreviation: 'O1' } }])).toBe(true)
  })

  it('returns false for a correctly ordered sequence of phases', () => {
    const deadlines = [
      makeDeadline('O1', ['phase_start']),
      makeDeadline('O2'),
      makeDeadline('O3', ['phase_end']),
      makeDeadline('L1', ['phase_start']),
      makeDeadline('L2'),
      makeDeadline('L3', ['phase_end'])
    ]
    expect(deadlinesHaveErrors(deadlines)).toBe(false)
  })

  it('returns true when a deadline from a different phase appears mid-phase', () => {
    const deadlines = [
      makeDeadline('O1', ['phase_start']),
      makeDeadline('O2'),
      makeDeadline('L2'), // wrong phase letter
      makeDeadline('O3', ['phase_end'])
    ]
    expect(deadlinesHaveErrors(deadlines)).toBe(true)
  })

  it('returns true when is_under_min_distance_next is set', () => {
    const deadlines = [
      makeDeadline('O1', ['phase_start']),
      makeDeadline('O2', [], { is_under_min_distance_next: true })
    ]
    expect(deadlinesHaveErrors(deadlines)).toBe(true)
  })

  it('returns true when is_under_min_distance_previous is set', () => {
    const deadlines = [
      makeDeadline('O1', ['phase_start']),
      makeDeadline('O2', [], { is_under_min_distance_previous: true })
    ]
    expect(deadlinesHaveErrors(deadlines)).toBe(true)
  })

  it('returns true when out_of_sync is set', () => {
    const deadlines = [
      makeDeadline('O1', ['phase_start']),
      makeDeadline('O2', [], { out_of_sync: true })
    ]
    expect(deadlinesHaveErrors(deadlines)).toBe(true)
  })

  it('does not compare abbreviations before the first phase_start', () => {
    const deadlines = [
      makeDeadline('O1'),
      makeDeadline('L1', ['phase_start']),
      makeDeadline('L2')
    ]
    expect(deadlinesHaveErrors(deadlines)).toBe(false)
  })

  it('handles deadlines with missing deadline_types', () => {
    const deadlines = [
      makeDeadline('O1', ['phase_start']),
      { date: '2026-05-21', deadline: { abbreviation: 'O2' } }
    ]
    expect(deadlinesHaveErrors(deadlines)).toBe(false)
  })
})
