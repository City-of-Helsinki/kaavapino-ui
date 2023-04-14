import React from 'react'
import {render,screen, fireEvent} from '@testing-library/react'
import '@testing-library/jest-dom'
import RadioBooleanButton from '../../../components/input/RadioBooleanButton'

describe('<RadioBooleanButton />', () => {

  test('is initialized correctly', () => {
    const {getByTestId} = render(<RadioBooleanButton input={{value:"Kyllä", name:'test'}} meta={{ error:"false" }} label="Kyllä" />);

    const radioValue = getByTestId("radio1").value
    expect(radioValue).toEqual("Kyllä")

    const radioButton = getByTestId("radio1")
    expect(radioButton).toBeChecked

    const radioButton2 = getByTestId("radio2")
    expect(radioButton2).not.toBeChecked

    const radioButton3 = getByTestId("radio3")
    expect(radioButton3).not.toBeChecked

  })

  test('is initialized correctly second test', () => {
    const {getByTestId} = render(<RadioBooleanButton input={{ value: "", name: 'test' }} meta={{}} />);

    const radioButton = getByTestId("radio1")
    expect(radioButton).not.toBeChecked

    const radioButton2 = getByTestId("radio2")
    expect(radioButton2).toBeChecked

    const radioButton3 = getByTestId("radio3")
    expect(radioButton3).not.toBeChecked

  })
})
