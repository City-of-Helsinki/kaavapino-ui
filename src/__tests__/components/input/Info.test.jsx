import React from 'react'
import {render,screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import Info from '../../../components/input/Info'

describe('<Info />', () => {

  beforeEach(() => {
    render(<Info className="test" content="test" />)
  })

  test('renders', () => {
    const inputNode = screen.getByLabelText('Tooltip')
    expect(inputNode).toBeInTheDocument()
  })
})
