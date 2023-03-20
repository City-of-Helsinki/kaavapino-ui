import React from 'react'
import {render} from '@testing-library/react'
import SelectInput from '../../../components/input/SelectInput'

describe('<SelectInput />', () => {
  let selectInputComponent
  const options = ['a', 'b', 'c']
  let change
  beforeEach(() => {
    change = null
    selectInputComponent = render(
        <SelectInput
          input={{ name: 'test', onChange: value => (change = value) }}
          meta={{}}
          options={options.map(option => ({ key: option, value: option, label: option }))}
          placeholder="placeholder"
        />
    )
  })

  it('is initialized correctly', () => {
    const dropwDownComponent = selectInputComponent.find('SelectInput')
    expect(dropwDownComponent.props().input.name).toBe('test')
    expect(dropwDownComponent.props().placeholder).toBe('placeholder')
    expect(change).toBeNull()
  })

  it('has all option components', () => {
    const dropwDownComponent = selectInputComponent.find('SelectInput')

    expect(dropwDownComponent.props().options.length).toBe(options.length)
    expect(dropwDownComponent.props().options[0].label).toBe('a')
    expect(dropwDownComponent.props().options[0].value).toBe('a')
  })
})
