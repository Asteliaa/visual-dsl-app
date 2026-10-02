/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import PricingCard from '../components/features/PricingCard';

const testPlan = {
  name: 'Enterprise DSL',
  price: '499',
  features: ['Unlimited Models', '24/7 Support'],
  buttonText: 'Купить',
  isFeatured: true
};

describe('PricingCard Component', () => {
  test('displays correct plan title and price', () => {
    render(<PricingCard plan={testPlan} />);
    expect(screen.getByText('Enterprise DSL')).toBeInTheDocument();
    expect(screen.getByText(/499/)).toBeInTheDocument();
  });

  test('renders all provided features', () => {
    render(<PricingCard plan={testPlan} />);
    expect(screen.getByText('Unlimited Models')).toBeInTheDocument();
    expect(screen.getByText('24/7 Support')).toBeInTheDocument();
  });

  test('featured plan gets the featured modifier class', () => {
    const { container } = render(<PricingCard plan={testPlan} />);
    expect(container.firstChild).toHaveClass('pricing-card--featured');
  });
});
