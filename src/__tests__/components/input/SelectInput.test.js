import React from 'react'
import {render,screen, fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import SelectInput from '../../../components/input/SelectInput'

describe('<SelectInput />', () => {
  test('is initialized correctly', () => {
    const options = ['a', 'b', 'c']
    let change
  
      change = null
      render(
          <SelectInput
            input={{ name: 'test', onChange: value => (change = value) }}
            meta={{}}
            options={options.map(option => ({ key: option, value: option, label: option }))}
            placeholder="placeholder"
          />
      )
    const inputNode = screen.queryByText('placeholder')
    expect(inputNode).toBeInTheDocument()
    expect(change).toBeNull()
  })

/*   it('has all option components', () => {
    const options = ['a', 'b', 'c']
    let change
  
      change = null
      render(
          <SelectInput
            input={{ name: 'test', onChange: value => (change = value) }}
            meta={{}}
            options={options.map(option => ({ key: option, value: option, label: option }))}
            placeholder="placeholder"
          />
      )

    const dropwDownComponent = screen.findByPlaceholderText('placeholder')

    expect(dropwDownComponent.options).toBe(options.length)
    expect(dropwDownComponent.options[0].label).toBe('a')
    expect(dropwDownComponent.options[0].value).toBe('a')
  }) */
})
