import React from 'react';
import PricingCard from './PricingCard';

const PricingList = ({ plans }) => {
  return (
    <div className="pricing-grid">
      {plans.map(plan => (
        <PricingCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
};

export default PricingList;
