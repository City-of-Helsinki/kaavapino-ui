import React from 'react'
import {render} from '@testing-library/react'
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

  it('renders', () => {

    expect(logoutWrapper.find('div').text()).toBe('logging-out')
  })

  it('calls logout fn', () => {
    expect(logoutMock.mock.calls.length).toBe(1)
  })
})
