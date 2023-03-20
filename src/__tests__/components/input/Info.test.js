import React from 'react'
import {render} from '@testing-library/react'
import Info from '../../../components/input/Info'

describe('<Info />', () => {
  let wrapper

  beforeEach(() => {
    wrapper = render(<Info className="test" content="test" />)
  })

  it('renders', () => {
    expect(wrapper.find('.test').length).toBe(1)
  })
})
