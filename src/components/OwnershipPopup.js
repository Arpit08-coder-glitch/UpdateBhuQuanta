import React from 'react';

const OwnershipPopup = ({ 
  showPopup, 
  onClose, 
  matchingFeature, 
  selectedKhasra 
}) => {
  if (!showPopup) return null;

  return (
    <>
      {/* Translucent Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1999,
        }}
        onClick={onClose}
      />
      
      {/* Popup */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
          border: '2px solid #dee2e6',
          borderRadius: '15px',
          zIndex: 2000,
          boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '20px',
          overflow: 'hidden',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: '2px solid #ff6b6b',
            color: '#ff6b6b',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            fontSize: '18px',
            cursor: 'pointer',
            lineHeight: '25px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          &times;
        </button>
        
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '20px',
            color: '#495057',
            fontSize: '1.5rem',
            fontWeight: 'bold',
          }}
        >
          Ownership Information
        </h2>
        
        <div style={{ textAlign: 'justify', color: '#343a40', fontSize: '1rem' }}>
          {matchingFeature ? (
            <>
              <p>
                <strong>Khata No:</strong> {matchingFeature.properties['Khata No.']}
              </p>
              <p>
                <strong>Khasra No:</strong> {matchingFeature.properties['Khasra No']}
              </p>
              <p>
                <strong>Area (Ha):</strong> {matchingFeature.properties['Area (Ha)']}
              </p>
              <p>
                <strong>Owner Name:</strong> {matchingFeature.properties['Owner Name']}
              </p>
            </>
          ) : (
            <p>No data found for Khasra {selectedKhasra}.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default OwnershipPopup; 