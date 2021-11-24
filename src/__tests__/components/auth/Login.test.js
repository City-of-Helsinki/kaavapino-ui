import React from 'react'
import { mount } from 'enzyme'
import LoginPage from '../../../components/auth/Login'
import mockUserManager from '../../../utils/userManager'

describe('<Login />', () => {
  let loginWrapper
  
  beforeEach(() => {
    jest.mock('react-i18next', () => ({
      useTranslation: () => ({ t: key => key })
    }))
    loginWrapper = mount(<LoginPage />)
    
  })

  it('renders', () => {
    expect(loginWrapper.find('div').text()).toBe('redirecting')
    expect(mockUserManager.signinRedirect).toHaveBeenCalledTimes(1)
  })

  afterEach(() => {
    setInterval.mockClear()
    clearInterval.mockClear()
  })
})
