import React from 'react'
import {render,screen} from '@testing-library/react'
import { describe, vi, test, beforeEach, afterEach, expect } from 'vitest'
import LoginPage from '../../../components/auth/Login'

describe('<Login />', () => {
  vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: key => key })
  }))
  
  beforeEach(() => {
    render(<LoginPage />)
  })

  test('renders', () => {
    expect(screen.getByText('redirecting')).toBeInTheDocument()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})
