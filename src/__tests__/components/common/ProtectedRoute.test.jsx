import React from 'react'
import TestRenderer from 'react-test-renderer'
import {render, screen, cleanup} from '@testing-library/react'
import { describe, test, expect, afterEach } from 'vitest';
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import ProtectedRoute from '../../../components/common/ProtectedRoute'

describe('<ProtectedRoute />', () => {


  afterEach(() => {
    cleanup();
  });

  test('renders a component when pred is true', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute
          render={() => <span className="test">123</span>}
          pred={true}
          redirect="/test"
        />
      </MemoryRouter>
    )
    expect(screen.getByText('123')).toBeInTheDocument()
  })

  test('renders multiple children when pred is true', () => {
    const testRenderer = TestRenderer.create(
      <MemoryRouter initialEntries={['/login']}>
      <ProtectedRoute
        render={() => <span className="test">1</span>}
        pred={true}
        redirect="/test">
        <Route path="/" render={() => <span className="child">2</span>} />
        <Route path="/test" render={() => <span className="child">3</span>} />
        <Route path="/test/2" render={() => <span className="child">4</span>} />
      </ProtectedRoute>
      </MemoryRouter>
    );
    const testInstance = testRenderer.root;
    testInstance.findByType(ProtectedRoute);
    const allRoutes = testInstance.findAllByType(Route);
    expect(allRoutes.length).toBe(1)
  })

  test('doesn\'t render a component when pred is false and redirects to another route', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Switch>
          <ProtectedRoute
            exact
            path="/login"
            render={() => <span className="test">1</span>}
            pred={false}
            redirect="/test"
          />
          <Route exact path="/test" render={() => <span className="index">2</span>} />
        </Switch>
      </MemoryRouter>
    )
    //1 is not visible so did not render protected route
    const protectedRoute = screen.queryByText('1')
    expect(protectedRoute).not.toBeInTheDocument()
    
    //2 is visible so redirected to route
    const normalRoute = screen.queryByText('2')
    expect(normalRoute).toBeInTheDocument()
  })

  test('doesn\'t render children when pred is false and redirects to another route', () => {
    const testRenderer = TestRenderer.create(
      <MemoryRouter initialEntries={['/login']}>
        <Switch>
          <ProtectedRoute exact path="/login" pred={false} redirect="/test">
            <Route exact path="/" render={() => <span className="child">1</span>} />
            <Route exact path="/test" render={() => <span className="child">2</span>} />
            <Route
              exact
              path="/test/2"
              render={() => <span className="child">3</span>}
            />
          </ProtectedRoute>
          <Route exact path="/test" render={() => <span className="index">4</span>} />
        </Switch>
      </MemoryRouter>
    )

    const testInstance = testRenderer.root;
    testInstance.find(ProtectedRoute)
    expect(testInstance.length).toBe(undefined)

    const allRoutes = testInstance.findAllByType(Route);
    expect(allRoutes.length).toBe(1)
  }) 
})
