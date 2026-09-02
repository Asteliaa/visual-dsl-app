import React from 'react';

const Card = ({ children, className = '', title }) => {
  return (
    <div className={`card ${className}`}>
      {title && <h3 className="card__title">{title}</h3>}
      <div className="card__body">
        {children}
      </div>
    </div>
  );
};

export default Card;
