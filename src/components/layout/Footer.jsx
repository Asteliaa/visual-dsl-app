import React from 'react';

const Footer = ({ version, copyright }) => {
  return (
    <footer className="footer">
      {copyright} | {version}
    </footer>
  );
};

export default Footer;
