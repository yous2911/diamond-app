/**
 * AccessibleButton Component Tests
 * Ensures the button is accessible and handles interactions correctly.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessibleButton from '../AccessibleButton'; // Adjust path

describe('AccessibleButton', () => {
  const defaultProps = {
    onClick: jest.fn(),
    ariaLabel: 'Click this button',
  };

  it('should render with the correct text and ARIA label', () => {
    render(<AccessibleButton {...defaultProps}>Click Me</AccessibleButton>);

    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', defaultProps.ariaLabel);
  });

  it('should call onClick handler when clicked', async () => {
    const onClickMock = jest.fn();
    const user = userEvent.setup();
    render(<AccessibleButton {...defaultProps} onClick={onClickMock}>Click Me</AccessibleButton>);

    const button = screen.getByRole('button', { name: 'Click Me' });
    await user.click(button);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should be focusable via keyboard', () => {
    render(<AccessibleButton {...defaultProps}>Click Me</AccessibleButton>);
    const button = screen.getByRole('button', { name: 'Click Me' });

    button.focus();
    expect(button).toHaveFocus();
  });

  it('should be disabled when the disabled prop is true', () => {
    render(<AccessibleButton {...defaultProps} disabled>Click Me</AccessibleButton>);
    const button = screen.getByRole('button', { name: 'Click Me' });

    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const onClickMock = jest.fn();
    const user = userEvent.setup();
    render(<AccessibleButton {...defaultProps} onClick={onClickMock} disabled>Click Me</AccessibleButton>);

    const button = screen.getByRole('button', { name: 'Click Me' });
    await user.click(button);

    expect(onClickMock).not.toHaveBeenCalled();
  });
});
