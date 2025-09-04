import React from 'react'
import {render,screen} from '@testing-library/react'
//import '@testing-library/jest-dom'
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SelectInput from '../../../components/input/SelectInput'
import { describe, test, expect} from 'vitest';


describe.skip('<SelectInput />', () => {
  const mockStore = configureStore();
  let store;
  test('is initialized correctly', () => {
    const initialState = { output: false};
    store = mockStore(initialState);
    const options = ['a', 'b', 'c']
    let change
  
      change = null
      render(
        <Provider store={store}>
          <SelectInput
            input={{ name: 'test', onChange: value => (change = value) }}
            meta={{}}
            options={options.map(option => ({ key: option, value: option, label: option }))}
            placeholder="placeholder"
          />
        </Provider>
      )
    const inputNode = screen.queryByText('placeholder')
    expect(inputNode).toBeInTheDocument()
    expect(change).toBeNull()
  })
})
