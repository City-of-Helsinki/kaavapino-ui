import React from 'react'
import {render} from '@testing-library/react'
import LoginPage from '../../../components/auth/Login'
import mockUserManager from '../../../utils/userManager'
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}))
describe('<Login />', () => {
  let loginWrapper
  
  beforeEach(() => {
   
    loginWrapper = render(<LoginPage />)
    
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
