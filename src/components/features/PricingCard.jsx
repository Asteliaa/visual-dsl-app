import React from 'react';
import Button from '../ui/Button';

const PricingCard = ({ plan }) => {
  return (
    <div className={`pricing-card ${plan.isFeatured ? 'pricing-card--featured' : ''}`}>
      <h4>{plan.name}</h4>
      <p className="price">${plan.price}/mo</p>
      <ul>
        {plan.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      <Button variant={plan.isFeatured ? 'primary' : 'secondary'} className="button--full">
        {plan.buttonText}
      </Button>
    </div>
  );
};

export default PricingCard;
