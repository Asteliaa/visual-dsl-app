import React from 'react';

const Sidebar = ({ children, title }) => {
  return (
    <aside className="ide__sidebar sidebar">
      <header className="sidebar__header">
        <h2>{title}</h2>
      </header>
      <div className="sidebar__content">
        {children}
      </div>
    </aside>
  );
};

export default Sidebar;
