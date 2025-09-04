import React from 'react'
import {render} from '@testing-library/react'
import RadioBooleanButton from '../../../components/input/RadioBooleanButton'
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, test, expect } from 'vitest';

const mockStore = configureStore();

const store = mockStore({
  project: {
    saving: false,
  }
});

describe('<RadioBooleanButton />', () => {

  test.skip('is initialized correctly', () => {

    const {getByTestId} = render(
      <Provider store={store}>
        <RadioBooleanButton input={{value:"Kyllä", name:'test'}} meta={{ error:"false" }} label="Kyllä" />
      </Provider>
    );

    const radioValue = getByTestId("radio1").value
    expect(radioValue).toEqual("Kyllä")

    const radioButton = getByTestId("radio1")
    expect(radioButton).toBeChecked

    const radioButton2 = getByTestId("radio2")
    expect(radioButton2).not.toBeChecked

    const radioButton3 = getByTestId("radio3")
    expect(radioButton3).not.toBeChecked

  })

  test.skip('is initialized correctly second test', () => {
    const {getByTestId} = render(
      <Provider store={store}>
        <RadioBooleanButton input={{ value: "", name: 'test' }} meta={{}} />
      </Provider>
    );

    const radioButton = getByTestId("radio1")
    expect(radioButton).not.toBeChecked

    const radioButton2 = getByTestId("radio2")
    expect(radioButton2).toBeChecked

    const radioButton3 = getByTestId("radio3")
    expect(radioButton3).not.toBeChecked

  })
})
