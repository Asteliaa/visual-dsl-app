export const pricingPlans = [
  {
    id: 1,
    name: 'Free',
    price: 0,
    features: ['5 Diagrams', 'Standard Export', 'Community Support'],
    isFeatured: false,
    buttonText: 'Current Plan'
  },
  {
    id: 2,
    name: 'Pro',
    price: 19,
    features: ['Unlimited Diagrams', 'HD Export', 'AI Assistant', 'Priority Support'],
    isFeatured: true,
    buttonText: 'Upgrade to Pro'
  },
  {
    id: 3,
    name: 'Enterprise',
    price: 99,
    features: ['Team Collaboration', 'Custom Branding', 'SLA Guarantee', 'Dedicated Manager'],
    isFeatured: false,
    buttonText: 'Contact Sales'
  }
];

export const usageStats = [
  { id: 1, label: 'Active Nodes', value: '1,240', trend: '+12%' },
  { id: 2, label: 'Total Edges', value: '3,850', trend: '+5%' },
  { id: 3, label: 'API Calls', value: '45.2k', trend: '+20%' }
];

export const breadcrumbs = [
  { id: 1, label: 'src', active: false },
  { id: 2, label: 'projects', active: false },
  { id: 3, label: 'diagram.dsl', active: true }
];
