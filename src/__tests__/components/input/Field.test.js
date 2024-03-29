import React from 'react'
import {render,screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import { Provider } from 'react-redux'
import { reduxForm } from 'redux-form'
import configureStore from 'redux-mock-store'
import CustomField from '../../../components/input/CustomField'
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => {
    Component.defaultProps = { ...Component.defaultProps, t: () => "" };
    return Component;
  },
}));

describe('<Field />', () => {
  const mockStore = configureStore();
  let store

  /* beforeEach(() => {
    const initialState = {
      auth: {},
      comment: {
        fieldComments: {}
      },
      project: { checking: true }
    }
    store = mockStore(initialState)
    wrapper = null
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
        type:"",
        required: true,
        inputProps:{}
      },
      fields: [],
      fieldProps:{}
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

  }) */

  const createFieldOfType = (type, fieldProps = {}, inputProps = {}) => {
    const initialState = {
      auth: {},
      comment: {
        fieldComments: {}
      },
      project: { checking: true }
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
  /* test('renders different types', () => {
    createFieldOfType('short_string')
    expect(wrapper.find('input').props().type).toBe('text')
    createFieldOfType('long_string')
    createFieldOfType('boolean')
    expect(wrapper.find('RadioBooleanButton').length).toBe(1)
    createFieldOfType('date')
    expect(wrapper.find('input').props().type).toBe('date')
    createFieldOfType('number')
    expect(wrapper.find('input').props().type).toBe('number')
    createFieldOfType('fieldset', { fieldset: true })
    expect(wrapper.find('FieldSet').length).toBe(1)
    createFieldOfType('file', {}, { name: 'file' })
    expect(wrapper.find('File').length).toBe(1)
    createFieldOfType('image', {}, { name: 'file' })
    expect(wrapper.find('File').length).toBe(1)
    createFieldOfType(
      'short_string',
      {},
      {
        choices: [
          { value: 'a', label: '1' },
          { value: 'b', label: '2' }
        ],
        multiple_choice: true,
        type: 'select'
      }
    )
    expect(wrapper.find('SelectInput').length).toBe(1)
    const selectInput = wrapper.find('SelectInput')
    expect(selectInput.props().options.length).toBe(2)
    expect(selectInput.props().options[0].value).toBe('a')
    expect(selectInput.props().options[0].label).toBe('1')
  })

  test('updates only when necessary', () => {
    const props = {
      attributeData: {
        '1': 'a',
        '2': 'b',
        '3': 'c',
        '4': 'd'
      },
      field: { name: '1', type: 'short_string', required: true },
      fields: []
    }
    const renderSpy = jest.spyOn(CustomField.prototype, 'render')
    const test = render(<CustomField {...props} />)

    expect(renderSpy).toHaveBeenCalledTimes(1)
    test.setProps({ attributeData: { '1': 'a' } })
    expect(renderSpy).toHaveBeenCalledTimes(2)
    test.setProps({ attributeData: { '1': 'b' } })
    expect(renderSpy).toHaveBeenCalledTimes(3)
    test.setProps({ field: { name: '1', type: 'short_string', required: true } })
    expect(renderSpy).toHaveBeenCalledTimes(3)
    test.setProps({
      field: { name: '1', type: 'short_string', required: true, disabled: true }
    })
    expect(renderSpy).toHaveBeenCalledTimes(4)
    renderSpy.mockRestore()
  })
  it('updates when a related field updates', () => {
    const props = {
      attributeData: {
        '1': 'a',
        '2': 'b',
        '3': 'c',
        '4': 'd',
        '5': 'e'
      },
      field: {
        name: '1',
        type: 'short_string',
        required: true,
        related_fields: ['3', '4']
      },
      fields: []
    }
    const renderSpy = jest.spyOn(CustomField.prototype, 'render')
    const test = render(<CustomField {...props} />)

    expect(renderSpy).toHaveBeenCalledTimes(1)
    test.setProps({ attributeData: { ...props.attributeData, '2': 'changed' } })
    expect(renderSpy).toHaveBeenCalledTimes(2)
    test.setProps({
      attributeData: { ...props.attributeData, '2': 'changed', '3': 'changed' }
    }) */

    /* do not render again if the related_field attribute data is the same is the same */
    /* expect(renderSpy).toHaveBeenCalledTimes(3)
    test.setProps({
      attributeData: { ...props.attributeData, '2': 'changed', '3': 'changed' }
    })
    expect(renderSpy).toHaveBeenCalledTimes(3)

    test.setProps({
      attributeData: {
        ...props.attributeData,
        '2': 'changed',
        '3': 'changed',
        '4': 'changed'
      }
    })
    expect(renderSpy).toHaveBeenCalledTimes(4)
    test.setProps({
      attributeData: {
        ...props.attributeData,
        '2': 'changed',
        '3': 'changed',
        '4': 'changed',
        '5': 'changed'
      }
    })
    expect(renderSpy).toHaveBeenCalledTimes(5)
    renderSpy.mockRestore()
  }) */
})