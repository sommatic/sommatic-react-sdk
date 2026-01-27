import React from 'react';
import '@styles/fonts.css';
import '@styles/styles.css';

export const Card = ({ children, style = {} }) => {
  const defaultStyles = {
    border: '1px solid #f2f2f2',
    borderRadius: '8px',
    padding: '2.25rem',
    boxShadow: '0 .75rem 6rem rgba(56, 65, 74, 0.03)',
    background: '#FFFFFF',
  };
  return (
    <>
      <section style={{ ...defaultStyles, ...style }}>
        {children}
      </section>
    </>
  );
};
