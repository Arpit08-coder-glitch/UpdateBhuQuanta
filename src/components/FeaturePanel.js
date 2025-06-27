import React from 'react';

const FeaturePanel = ({
  featureDetails,
  onVillageMapClick,
  onOwnershipClick,
  onFeedbackClick
}) => {
  return (
    <div
      id="feature-details"
      className="feature-panel"
      style={{
        width: '20%',
        minWidth: 250,
        maxWidth: 400,
        height: '100%',
        backgroundColor: '#BFD4D5',
        overflowY: 'auto',
        padding: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: '1 1 250px',
      }}
    >
      {/* Feature Details Table */}
      <table
        id="feature-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '20px',
        }}
      >
        <tbody>
          {featureDetails.map((feature, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
              <td
                style={{
                  padding: '10px',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  color: '#018630'
                }}
              >
                {feature.label}
              </td>
              <td
                style={{
                  padding: '10px',
                  textAlign: 'right',
                  color: '#018630'
                }}
              >
                {feature.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Action Buttons */}
      <div
        id="feature-buttons"
        style={{
          display: 'none',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Village Section */}
        <div style={{ textAlign: 'center' }}>
          <button
            id="village-map-button"
            onClick={onVillageMapClick}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Village Map
          </button>
        </div>

        {/* Ownership Section */}
        <div style={{ textAlign: 'center' }}>
          <button
            id="ownership-button"
            onClick={onOwnershipClick}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Ownership
          </button>
        </div>
      </div>

      {/* Feedback Button */}
      <div style={{ textAlign: 'center', marginTop: '2px' }}>
        <button
          id="new-feature-button"
          onClick={onFeedbackClick}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Feedback
        </button>
      </div>
    </div>
  );
};

export default FeaturePanel; 