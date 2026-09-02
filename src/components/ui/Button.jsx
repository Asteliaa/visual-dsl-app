import React from 'react';

const Button = ({ children, variant = 'primary', onClick, className = '', type = 'button' }) => {
  const baseStyles = 'button';
  const variantStyles = variant === 'primary' ? 'button--primary' : 'button--secondary';
  
  return (
    <button 
      type={type}
      className={`${baseStyles} ${variantStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
