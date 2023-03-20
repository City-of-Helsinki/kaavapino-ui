import React from 'react'
import {render} from '@testing-library/react'
import RadioBooleanButton from '../../../components/input/RadioBooleanButton'

describe('<RadioBooleanButton />', () => {
  let wrapper
  beforeEach(() => {
    wrapper = render(
      <RadioBooleanButton
        input={{ value: true, name: 'test' }}
        meta={{}}
      />
    )
  })

  it('is initialized correctly', () => {
    expect(wrapper.find('input')).toHaveLength(3)

    const radioButtonTrue = wrapper.find('.radio-button-true')
    const radioButtonFalse = wrapper.find('.radio-button-false')
    const radioButtonNull = wrapper.find('.radio-button-null')

    expect(radioButtonTrue.at(0).props().checked).toBe(true)
    expect(radioButtonFalse.at(0).props().checked).toBe(false)
    expect(radioButtonNull.at(0).props().checked).toBe(false)
  })

  it('is initialized correctly second test', () => {
    const radioButtonWrapper = render(
      <RadioBooleanButton
        input={{ value: false, name: 'test' }}
        meta={{}}
      />
    )

    const radioButtonTrue = radioButtonWrapper.find('.radio-button-true')
    const radioButtonFalse = radioButtonWrapper.find('.radio-button-false')
    const radioButtonNull = radioButtonWrapper.find('.radio-button-null')

    expect(radioButtonTrue.at(0).props().checked).toBe(false)
    expect(radioButtonFalse.at(0).props().checked).toBe(true)
    expect(radioButtonNull.at(0).props().checked).toBe(false)
  })
  // Click tests needs to be removed since HDS has two same class components

  it('can have default value', () => {
    const positiveRadio = render(
      <RadioBooleanButton
        input={{ value: true, name: 'test' }}
        meta={{}}
      />
    )
    expect(positiveRadio.find('.radio-button-true').at(0).props().checked).toBe(true)
    const negativeRadio = render(
      <RadioBooleanButton
        input={{ value: false, name: 'test' }}
        meta={{}}
      />
    )
    expect(negativeRadio.find('.radio-button-false').at(0).props().checked).toBe(true)
  })
})
