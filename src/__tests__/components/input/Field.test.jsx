import React from 'react'
import {render, screen, cleanup} from '@testing-library/react'
import { Provider } from 'react-redux'
import { reduxForm } from 'redux-form'
import configureStore from 'redux-mock-store'
import {vi, describe, expect, test, afterEach} from 'vitest';
import CustomField from '../../../components/input/CustomField'

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => {
    Component.defaultProps = { ...Component.defaultProps, t: () => "" };
    return Component;
  },
}));

describe('<Field />', () => {

  afterEach(() => {
    cleanup();
  });

  const mockStore = configureStore();
  let store


  const createFieldOfType = (type, fieldProps = {}, inputProps = {}) => {
    const initialState = {
      auth: {},
      comment: {
        fieldComments: {}
      },
      project: { checking: true,  connection: true }
    }
    store = mockStore(initialState)

    const props = {
      attributeData: {
        '1': 'a',
        '2': 'b',
        '3': 'c',
        '4': 'd',
        file: { link: '1', description: '2' },
        'fieldset': [{ 5: 'e' }]
      },
      field: {
        name: '1',
        type,
        required: true,
        ...inputProps
      },
      fields: [],
      ...fieldProps
    }
    const formWrapper = () => (
      <div>
        <CustomField {...props} />
      </div>
    )
    const Decorated = reduxForm({ form: 'testForm' })(formWrapper)
    render(
      <Provider store={store}>
        <Decorated />
      </Provider>
    )
  }

  test('renders', () => {
    createFieldOfType('text')
    /* React-redux version 8 makes a wrapping Field component and another Field component inside it,
     * which is given _reduxForm context.
     * Older ones seem to render only one.
     * Both render only one input though. */
 
    const fieldNode = screen.getByLabelText('1')
    expect(fieldNode).toBeInTheDocument()
  })

  test('renders text types', () => {
    createFieldOfType('short_string')
    const fieldNode = screen.getByLabelText('1')
    expect(fieldNode.getAttribute('type')).toBe('text');
  })

  test('renders boolean types', () => {
    createFieldOfType('boolean')
    const fieldNode = screen.getByTestId('radio1')
    expect(fieldNode.getAttribute('type')).toBe('radio');
  })

  test('renders date types', () => {
    createFieldOfType('date')
    const fieldNode = screen.getByLabelText('1')
    expect(fieldNode.getAttribute('type')).toBe('date');
  })

  test('renders number types', () => {
    createFieldOfType('number')
    const fieldNode = screen.getByLabelText('1')
    expect(fieldNode.getAttribute('type')).toBe('number');
  })

  test('renders fieldset types', () => {
    createFieldOfType('fieldset', { fieldset: true })
    const fieldNode = screen.getByText('project.add')
    expect(fieldNode).toBeInTheDocument()
  })

  test('renders file types', () => {
    createFieldOfType('file', {}, { name: 'file' })
    const fieldNode = screen.getByText('1')
    expect(fieldNode).toBeInTheDocument()
  })

  test('renders image types', () => {
    createFieldOfType('image', {}, { name: 'file' })
    const fieldNode = screen.getByText('1')
    expect(fieldNode).toBeInTheDocument()
  })
})