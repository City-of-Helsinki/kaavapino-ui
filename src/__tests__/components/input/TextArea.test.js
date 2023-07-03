import React from 'react'
import {render,screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import CustomTextArea from '../../../components/input/CustomTextArea'

describe('<TextArea />', () => {
  it('has value and name', () => {
    render(<CustomTextArea input={{ value: '123', name: 'test', onChange: e => (e.target.value) }}
    meta={{}} />);

   expect(screen.getByTestId('text1')).toHaveTextContent('123');
   expect(screen.getByTestId('text1')).toHaveProperty('name');
   expect(screen.getByTestId('text1').name).toEqual('test');
  })

/*   it('can be changed', async () => {
    const handleInputChange = jest.fn();
    render(<CustomTextArea onChange={handleInputChange} input={{ value: '123', name: 'test' }}
    meta={{}} />);

    const inputNode = screen.getByTestId('text1')
    fireEvent.change(inputNode, { target: { value: 'test' }});
    expect(handleInputChange).toHaveBeenCalledTimes(1);
    expect(handleInputChange).toHaveBeenCalledWith("test");

  }) */
 
  it('can have custom props', () => {
    render(
      <CustomTextArea input={{}} meta={{}} placeholder="123" />
    )
    const {placeholder} = screen.getByPlaceholderText('123')
    expect(placeholder).toBe('123')
  }) 
})
