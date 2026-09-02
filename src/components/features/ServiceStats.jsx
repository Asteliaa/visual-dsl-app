import React from 'react';

const ServiceStats = ({ stats }) => {
  return (
    <section className="sidebar__section">
      <div className="sidebar__section-title">Usage Statistics</div>
      <div className="stats-panel">
        {stats.map(stat => (
          <div key={stat.id} className="stats-item">
            <span>{stat.label}:</span> 
            <strong>{stat.value}</strong> 
            <small style={{ color: stat.trend.startsWith('+') ? 'var(--success)' : 'var(--error)', marginLeft: '8px' }}>
              {stat.trend}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServiceStats;
