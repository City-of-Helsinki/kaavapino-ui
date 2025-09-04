import React from 'react'
import { render, fireEvent, screen, cleanup } from '@testing-library/react'
import FormButton from '../../../components/common/FormButton'
import {vi, describe, test, expect, afterEach} from 'vitest';

describe('<FormButton />', () => {
  let mockFn

  afterEach(() => {
    cleanup();
  });

  test('renders', () => {
    mockFn = vi.fn(() => null)
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
    mockFn = vi.fn(() => null)
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
