import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Input from '../../../src/components/common/Input';

describe('Input', () => {
  it('renders the placeholder', () => {
    render(<Input placeholder="Test Input" />);
    const input = screen.getByPlaceholderText('Test Input');
    expect(input).toBeDefined();
  });

  it('handles onChangeText', () => {
    const onChangeTextMock = jest.fn();
    render(<Input placeholder="Test Input" onChangeText={onChangeTextMock} />);
    const input = screen.getByPlaceholderText('Test Input');
    fireEvent.changeText(input, 'hello');
    expect(onChangeTextMock).toHaveBeenCalledWith('hello');
  });
});
