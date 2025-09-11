import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Button from '../../../src/components/common/Button';

describe('Button', () => {
  it('renders the title', () => {
    render(<Button title="Test Button" />);
    const button = screen.getByText('Test Button');
    expect(button).toBeDefined();
  });

  it('handles onPress', () => {
    const onPressMock = jest.fn();
    render(<Button title="Test Button" onPress={onPressMock} />);
    const button = screen.getByText('Test Button');
    fireEvent.press(button);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
