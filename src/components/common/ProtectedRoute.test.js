import React from 'react'
import { mount } from 'enzyme'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

describe('<ProtectedRoute />', () => {
  it('renders a component when pred is true', () => {
    const protectedRouteComponent = mount(
      <MemoryRouter>
        <ProtectedRoute render={() => <span className='test'>123</span>} pred={true} redirect='/test' />
      </MemoryRouter>
    )
    expect(protectedRouteComponent.find('.test').length).toBeGreaterThan(0)
  })

  it('renders multiple children when pred is true', () => {
    const protectedRouteComponent = mount(
      <MemoryRouter initialEntries={['/login']}>
        <ProtectedRoute exact path='/login' pred={true} redirect='/test'>
          <Route exact path='/' render={() => <span className='child'>123</span>} />
          <Route exact path='/test' render={() => <span className='child'>123</span>} />
          <Route exact path='/test/2' render={() => <span className='child'>123</span>} />
        </ProtectedRoute>
      </MemoryRouter>
    )
    // It has to be 4, because ProtectedRoute is also a route
    expect(protectedRouteComponent.find('Route').length).toBe(4)
  })

  it('doesn\'t render a component when pred is false and redirects to another route', () => {
    const protectedRouteComponent = mount(
      <MemoryRouter initialEntries={['/login']}>
        <Switch>
          <ProtectedRoute exact path='/login' render={() => <span className='test'>123</span>} pred={false} redirect='/test' />
          <Route exact path='/test' render={() => <span className='index'>123</span>} />
        </Switch>
      </MemoryRouter>
    )
    expect(protectedRouteComponent.find('.test').length).toBe(0)
    expect(protectedRouteComponent.find('.index').length).toBeGreaterThan(0)
    expect(protectedRouteComponent.find('Router').props().history.location.pathname).toBe('/test')
  })

  it('doesn\'t render children when pred is false and redirects to another route', () => {
    const protectedRouteComponent = mount(
      <MemoryRouter initialEntries={['/login']}>
        <Switch>
          <ProtectedRoute exact path='/login' pred={false} redirect='/test'>
            <Route exact path='/' render={() => <span className='child'>123</span>} />
            <Route exact path='/test' render={() => <span className='child'>123</span>} />
            <Route exact path='/test/2' render={() => <span className='child'>123</span>} />
          </ProtectedRoute>
          <Route exact path='/test' render={() => <span className='index'>123</span>} />
        </Switch>
      </MemoryRouter>
    )
    expect(protectedRouteComponent.find('Route').length).toBe(1)
    expect(protectedRouteComponent.find('.chid').length).toBe(0)
    expect(protectedRouteComponent.find('.index').length).toBeGreaterThan(0)
    expect(protectedRouteComponent.find('Router').props().history.location.pathname).toBe('/test')
  })
})