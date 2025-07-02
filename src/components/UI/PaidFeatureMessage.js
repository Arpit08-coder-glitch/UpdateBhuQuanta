import React from 'react';

const PaidFeatureMessage = ({ showMessage }) => {
  if (!showMessage) return null;

  return (
    <div
      id="paid-feature-message"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '20px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        borderRadius: '5px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: '1000',
      }}
    >
      This is a paid feature. Please contact support for more information.
    </div>
  );
};

export default PaidFeatureMessage; 