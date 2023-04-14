import React from 'react'
import {render,screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import LogoutPage from '../../../components/auth/Logout'
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key }),
}));
describe('<Logout />', () => {
  let logoutWrapper
  let logoutMock = jest.fn(() => null)

  beforeEach(() => {
   
    logoutMock.mockClear()
    logoutWrapper = render(<LogoutPage handleLogout={logoutMock} />)
  })

  test('renders', () => {
    const normalRoute = screen.queryByText('logging-out')
    expect(normalRoute).toBeInTheDocument()
  })

  it('calls logout fn', () => {
    expect(logoutMock.mock.calls.length).toBe(1)
  })
})
