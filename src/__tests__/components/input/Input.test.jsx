import React from 'react'
import {render,screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Input from '../../../components/input/CustomInput'

describe('<Input />', () => {
  const mockStore = configureStore();
  let store;

  beforeEach(() => {
    const initialState = { output: false};
    store = mockStore(initialState);
    render(
      <Provider store={store}>
        <Input
          input={{ value: '123', name: 'test', onChange: value => (value) }}
          meta={{}}
          name='test' 
          placeholder="123"
        />
      </Provider>
    )
  })

  test('has value and name', () => {
    const inputNode = screen.getByLabelText('test')
    expect(inputNode).toBeInTheDocument()
    expect(inputNode.value).toBe('123')
  })

  test('can have custom props', () => {
    const inputNode = screen.getByPlaceholderText('123')
    expect(inputNode).toBeInTheDocument()
  })
})
