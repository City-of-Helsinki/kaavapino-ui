import React from 'react'
import {render,screen} from '@testing-library/react'
import LogoutPage from '../../../components/auth/Logout'
import {vi, describe, test, it, expect, beforeEach} from 'vitest';

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key }),
}));


describe('<Logout />', () => {

  let logoutMock = vi.fn(() => null)

  beforeEach(() => {
    logoutMock.mockClear()
    render(<LogoutPage handleLogout={logoutMock} />)
  })

  test.skip('renders', () => {
    const normalRoute = screen.queryByText('logging-out')
    expect(normalRoute).toBeInTheDocument()
  })

  it('calls logout fn', () => {
    expect(logoutMock.mock.calls.length).toBe(1)
  })
})
