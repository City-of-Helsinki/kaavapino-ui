import React from 'react'
import {render,screen} from '@testing-library/react'
import Info from '../../../components/input/Info'
import { describe, beforeEach, test, expect } from 'vitest'


describe('<Info />', () => {

  beforeEach(() => {
    render(<Info className="test" content="test" />)
  })

  test.skip('renders', () => {
    const inputNode = screen.getByLabelText('Tooltip')
    expect(inputNode).toBeInTheDocument()
  })
})
