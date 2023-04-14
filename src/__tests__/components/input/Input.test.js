import React from 'react'
import {render,screen,fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import Input from '../../../components/input/CustomInput'

describe('<Input />', () => {
  let change
  beforeEach(() => {
    change = ''
    render(
      <Input
        input={{ value: '123', name: 'test', onChange: value => (value) }}
        meta={{}}
      />
    )
  })

  test('has value and name', () => {
    const inputNode = screen.getByLabelText('test')
    expect(inputNode).toBeInTheDocument()
    expect(inputNode.value).toBe('123')
  })

/*   test('can be changed', () => {
    const inputNode = screen.getByLabelText('test')
    fireEvent.change(inputNode, { target: { value: 'test' }});
    expect(inputNode.value).toBe('test')
  }) */

  test('can have custom props', () => {
    render(<Input input={{}} meta={{}} name='test' placeholder="123" />)
    const inputNode = screen.getByPlaceholderText('123')
    expect(inputNode).toBeInTheDocument()
  })
})
