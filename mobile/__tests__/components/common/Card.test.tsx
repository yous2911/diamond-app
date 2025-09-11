import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import Card from '../../../src/components/common/Card';

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    const content = screen.getByText('Card Content');
    expect(content).toBeDefined();
  });
});
