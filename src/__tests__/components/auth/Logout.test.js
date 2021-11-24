import React from 'react'
import { mount } from 'enzyme'
import LogoutPage from '../../../components/auth/Logout'

describe('<Logout />', () => {
  let logoutWrapper
  let logoutMock = jest.fn(() => null)

  beforeEach(() => {
    jest.mock("react-i18next", () => ({
      useTranslation: () => ({ t: key => key }),
    }));
    logoutMock.mockClear()
    logoutWrapper = mount(<LogoutPage handleLogout={logoutMock} />)
  })

  it('renders', () => {

    expect(logoutWrapper.find('div').text()).toBe('logging-out')
  })

  it('calls logout fn', () => {
    expect(logoutMock.mock.calls.length).toBe(1)
  })
})
