import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import FormButton from '../../../components/common/FormButton'

describe('<FormButton />', () => {
  let mockFn
  test('renders', () => {
    mockFn = jest.fn(() => null)
    render(<FormButton
      handleClick={mockFn}
      icon={<div className="icon" />}
      help="help"
      value="button-test"
    />);
    const button = screen.getByText("button-test");
    expect(button).toBeInTheDocument();
  });

  test("can be clicked", () => {
    mockFn = jest.fn(() => null)
    render(<FormButton
      handleClick={mockFn}
      icon={<div className="icon" />}
      help="help"
      value="button-test"
    />);

    const button = screen.getByText("button-test");
    fireEvent.click(button);
    expect(mockFn.mock.calls.length).toBe(1)
    fireEvent.click(button);
    expect(mockFn.mock.calls.length).toBe(2)
  });
})
