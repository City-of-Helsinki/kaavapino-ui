import React from 'react'
import {render,screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { reduxForm } from 'redux-form'
import configureStore from 'redux-mock-store'
import Matrix from '../../../components/input/Matrix'

describe('<Matrix />', () => {
  beforeEach(() => {
    const mockStore = configureStore()
    const initialState = { project: { checking: true } }
    const store = mockStore(initialState)
    const props = {
      field: {
        matrix: {
          rows: ['row1', 'row2'],
          columns: ['col1', 'col2'],
          fields: [
            { name: '1', type: 'short_string', required: true, row: 0, column: 0 },
            { name: '2', type: 'short_string', required: true, row: 0, column: 1 },
            { name: '3', type: 'short_string', row: 1, column: 0 },
            { name: '4', type: 'short_string', row: 1, column: 1 }
          ]
        }
      },
      attributeData: {
        '2': '',
        '3': 'c',
        '4': 'd'
      }
    }
    const Decorated = reduxForm({ form: 'testForm' })(Matrix)
     render(
      <Provider store={store}>
        <Decorated store={store} {...props} />
      </Provider>
    )
  })

  test('renders', () => {
    const inputContainer = screen.getByTestId("matrix-testid")
    expect(inputContainer).toBeInTheDocument()
    const input1 = screen.getByLabelText("1")
    const input2 = screen.getByLabelText("2")
    const input3 = screen.getByLabelText("3")
    const input4 = screen.getByLabelText("4")
    expect(input1).toBeInTheDocument()
    expect(input2).toBeInTheDocument()
    expect(input3).toBeInTheDocument()
    expect(input4).toBeInTheDocument()
  })

  test('can be highlighted', () => {
    const highlighted = screen.getByTestId("1test-highligh")
    const normal = screen.getByTestId("4test-highligh")
    expect(highlighted).toBeInTheDocument()
    expect(highlighted).toHaveClass('highlighted')
    expect(normal).toBeInTheDocument()
    expect(normal).toHaveClass('rowColumnStyle')
  })
})
