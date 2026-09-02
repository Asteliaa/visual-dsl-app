import React from 'react';

const ActivityBar = () => {
  return (
    <aside className="ide__activity activity-bar">
      <div className="activity-bar__item activity-bar__item--active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
      </div>
      <div className="activity-bar__item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <div className="activity-bar__item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v8"/><path d="m4.93 4.93 4.24 4.24"/><path d="M2 12h8"/><path d="m4.93 19.07 4.24-4.24"/><path d="M12 22v-8"/><path d="m19.07 19.07-4.24-4.24"/><path d="M22 12h-8"/><path d="m19.07 4.93-4.24 4.24"/></svg>
      </div>
    </aside>
  );
};

export default ActivityBar;
