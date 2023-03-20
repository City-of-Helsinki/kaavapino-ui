import React from 'react'
import {render} from '@testing-library/react'
import Input from '../../../components/input/CustomInput'

describe('<Input />', () => {
  let inputComponent
 // let change
  beforeEach(() => {
    change = ''
    inputComponent = render(
      <Input
        input={{ value: '123', name: 'test', onChange: value => (value) }}
        meta={{}}
      />
    ).find('input')
  })

  it('has value and name', () => {
    const { value, name } = inputComponent.instance()
    expect(value).toBe('123')
    expect(name).toBe('test')
  })
/* 
  it('can be changed', () => {
    inputComponent.simulate('change', { target: { value: 'test' } })
    expect(change).toBe('test')
  }) */

  it('can have custom props', () => {
    const customComponent = render(<Input input={{}} meta={{}} placeholder="123" />).find(
      'input'
    )
    const { placeholder } = customComponent.instance()
    expect(placeholder).toBe('123')
  })
})
