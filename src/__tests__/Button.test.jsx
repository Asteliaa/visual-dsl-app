import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/ui/Button';

describe('Button Component', () => {
  test('renders button with children text', () => {
    render(<Button>Deploy DSL</Button>);
    expect(screen.getByText(/Deploy DSL/i)).toBeInTheDocument();
  });

  test('executes onClick callback when clicked', () => {
    const mockClick = jest.fn();
    render(<Button onClick={mockClick}>Click Me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});