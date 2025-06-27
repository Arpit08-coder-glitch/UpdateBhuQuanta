import React from 'react';

const LayerSelector = ({
  wmsLayers,
  selectedLayer,
  onLayerChange,
  selectedDistrict,
  selectedTehsil,
  selectedVillage,
  selectedKhasra,
  districtOptions,
  tehsilOptions,
  villageOptions,
  khasraOptions,
  onDistrictChange,
  onTehsilChange,
  onVillageChange,
  onKhasraChange,
  onSubmit
}) => {
  return (
    <div
      className="layer-selection"
      style={{
        width: '21%',
        minWidth: 250,
        maxWidth: 400,
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#BFD4D5',
        padding: '20px',
        boxSizing: 'border-box',
        flex: '1 1 250px',
      }}
    >
      {/* Layer Selection Radio Buttons */}
      {Object.keys(wmsLayers).map((state) => (
        <label
          key={state}
          style={{
            display: 'block',
            padding: '10px',
            fontSize: '14px',
            cursor: 'pointer',
            color: '#018630'
          }}
        >
          <input
            type="radio"
            name="wmsLayer"
            value={state}
            onChange={() => onLayerChange(state)}
            style={{ marginRight: '10px', color: '#018630' }}
          />
          {state}
        </label>
      ))}

      {/* Filter Form */}
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        {/* District */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ width: '30%', padding: '9px', fontWeight: 'bold', color: '#018630', marginRight: '3px' }}>
            District
          </label>
          <select 
            style={{ width: '70%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' }} 
            value={selectedDistrict} 
            onChange={onDistrictChange} 
            disabled={true}
          >
            <option value="">Select District</option>
            {districtOptions.map((district, index) => (
              <option key={index} value={district}>{district}</option>
            ))}
          </select>
        </div>
        
        {/* Tehsil */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ width: '30%', padding: '9px', fontWeight: 'bold', color: '#018630', marginRight: '3px' }}>
            Tehsil
          </label>
          <select 
            style={{ width: '70%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' }} 
            value={selectedTehsil}
            onChange={onTehsilChange} 
            disabled={true}
          >
            <option value="">Select Tehsil</option>
            {tehsilOptions.map((tehsil, index) => (
              <option key={index} value={tehsil}>{tehsil}</option>
            ))}
          </select>
        </div>
        
        {/* Village */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ width: '30%', padding: '9px', fontWeight: 'bold', color: '#018630', marginRight: '3px' }}>
            Village
          </label>
          <select 
            value={selectedVillage}
            onChange={onVillageChange} 
            style={{ width: '70%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' }}
          >
            <option value="">Select Village</option>
            {villageOptions.map((village, index) => (
              <option key={index} value={village}>{village}</option>
            ))}
          </select>
        </div>
        
        {/* Khasra Number */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ width: '30%', padding: '9px', fontWeight: 'bold', color: '#018630', marginRight: '3px' }}>
            Khasra
          </label>
          <select 
            style={{ width: '70%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' }} 
            value={selectedKhasra}
            onChange={onKhasraChange}
          >
            <option value="">Select Khasra</option>
            {khasraOptions.map((khasra, index) => (
              <option key={index} value={khasra}>{khasra}</option>
            ))}
          </select>
        </div>
        
        {/* Submit Button */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={onSubmit} 
            style={{
              backgroundColor: '#4CAF50', 
              color: '#fff', 
              padding: '10px 20px', 
              fontSize: '16px', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)'
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayerSelector; 