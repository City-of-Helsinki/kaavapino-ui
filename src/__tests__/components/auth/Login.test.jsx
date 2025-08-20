import React from 'react'
import {render,screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '../../../components/auth/Login'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}))

describe('<Login />', () => {

  
  beforeEach(() => {
    render(<LoginPage />)
  })

  test('renders', () => {
    expect(screen.getByText('redirecting')).toBeInTheDocument()
  })

  afterEach(() => {
    jest.useRealTimers()
  })
})
