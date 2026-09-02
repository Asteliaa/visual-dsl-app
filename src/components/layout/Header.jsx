import React from 'react';
import Button from '../ui/Button';

const Header = ({ breadcrumbs }) => {
  return (
    <header className="ide__header header">
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <div className={`breadcrumbs__item ${crumb.active ? 'breadcrumbs__item--active' : ''}`}>
              {crumb.label}
            </div>
            {index < breadcrumbs.length - 1 && (
              <div className="breadcrumbs__separator">/</div>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="header__actions">
        <Button variant="primary">Run</Button>
        <Button variant="secondary">Save</Button>
      </div>
    </header>
  );
};

export default Header;
