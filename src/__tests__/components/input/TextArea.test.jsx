import React from 'react'
import {render,screen} from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import CustomTextArea from '../../../components/input/CustomTextArea'
import { describe, it, expect } from 'vitest'

const mockStore = configureStore()

describe('<TextArea />', () => {
  it('has value and name', () => {
    const initialState = { 
      project: { 
        formErrorList: [],
        lastSaved: { status: '', fields: [] }
      } 
    }
    const store = mockStore(initialState)
    
    render(
      <Provider store={store}>
        <CustomTextArea input={{ value: '123', name: 'test', onChange: e => (e.target.value) }}
        meta={{}} />
      </Provider>
    );

   expect(screen.getByTestId('text1')).toHaveTextContent('123');
   expect(screen.getByTestId('text1')).toHaveProperty('name');
   expect(screen.getByTestId('text1').name).toEqual('test');
  })
 
  it('can have custom props', () => {
    const initialState = { 
      project: { 
        formErrorList: [],
        lastSaved: { status: '', fields: [] }
      } 
    }
    const store = mockStore(initialState)
    
    render(
      <Provider store={store}>
        <CustomTextArea input={{}} meta={{}} placeholder="123" />
      </Provider>
    )
    const {placeholder} = screen.getByPlaceholderText('123')
    expect(placeholder).toBe('123')
  }) 
})
