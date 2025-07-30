import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from "proj4";
import "proj4leaflet";

// Import modern UI components
import LayerSelector from './LayerSelector';
import MapContainer from './MapContainer';
import FeaturePanel from './FeaturePanel';
import OwnershipPopup from './OwnershipPopup';

// Import custom hooks
import { useMapLayers } from '../hooks/useMapLayers';
import { useDevTools } from '../hooks/useDevTools';

// Import utilities
import { 
  getFeatureInfoUrl1, 
  getFeatureInfoUrl, 
  getLayerBoundingBox, 
  zoomToBounds 
} from '../utils/mapUtils';

// --- Constants and Configurations ---
const EXCLUDED_PROPERTIES = [
  "state_code", "distt_code", "teh_code", "block", "block_code", "lu_lc", "others", "remark", "u_id", "objectid_1"
];
const SOURCE_PROJ = "EPSG:32643";
const TARGET_PROJ = "EPSG:4326";
const MAP_PADDING = [50, 50];
const WMS_LAYER_CONFIG = {
  format: 'image/png',
  transparent: true,
  attribution: "© QuantaSIP",
  zIndex: 500,
  maxZoom: 19,
};
const LAYER_NAMES = [
  "AndhraPradesh", "Chhattisgarh", "Goa", "Haryana", "Karnataka",
  "MadhyaPradesh", "Maharashtra", "Rajasthan", "TamilNadu", "Telangana"
];

// --- Utility Functions ---
const processFeatureProperties = (properties) => {
  return Object.entries(properties)
    .filter(([key]) => !EXCLUDED_PROPERTIES.includes(key))
    .map(([key, value]) => ({
      label: key === "area_ac" ? "Area" : key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      value: key === "area_ac" && !isNaN(value) ? parseFloat(value).toFixed(2) : value
    }));
};
const createPolygonLayer = (geometry) => L.geoJSON(geometry, {
  coordsToLatLng: (coords) => {
    const [x, y] = proj4(SOURCE_PROJ, TARGET_PROJ, [coords[0], coords[1]]);
    return L.latLng(y, x);
  },
});

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentPolygonLayer = useRef(null);
  const [state, setState] = useState({
    selectedLayer: null,
    featureDetails: [],
    showMessage: false,
    districtOptions: [],
    tehsilOptions: [],
    villageOptions: [],
    khasraOptions: [],
    selectedDistrict: '',
    selectedTehsil: '',
    selectedVillage: '',
    selectedKhasra: '',
    jsonData: [],
    showPopup: false,
    matchingFeature: null,
    villageKhasraMap: {},
    isLoading: false,
    showFeaturePanel: false,
    showFeatureButtons: false,
  });

  // Define WMS layers
  const wmsLayers = useMemo(() => {
    const layers = {};
    LAYER_NAMES.forEach(name => {
      layers[name] = L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
        ...WMS_LAYER_CONFIG,
        layers: `ne:${name}`,
      });
    });
    return layers;
  }, []);

  // Use custom hooks
  useMapLayers(mapInstance, state.selectedLayer, wmsLayers);
  useDevTools();

  // --- Handlers ---
  const setStatePartial = (partial) => setState(prev => ({ ...prev, ...partial }));

  const showPaidFeatureMessage = useCallback(() => {
    setStatePartial({ showMessage: true });
    setTimeout(() => setStatePartial({ showMessage: false }), 5000);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!state.selectedLayer) {
      alert("Please select a WMS layer.");
      return;
    }
    setStatePartial({ isLoading: true });
    const filters = {
      district: state.selectedDistrict,
      tehsil: state.selectedTehsil,
      village: state.selectedVillage,
      khasra: state.selectedKhasra,
    };
    const url = getFeatureInfoUrl1(state.selectedLayer, filters);
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const filtered = data.features.filter(f =>
            (!filters.district || f.properties.district === filters.district) &&
            (!filters.tehsil || f.properties.tehsil === filters.tehsil) &&
            (!filters.village || f.properties.village === filters.village) &&
            (!filters.khasra || f.properties.khasra_no === filters.khasra)
          );
          if (filtered.length > 0) {
            const feature = filtered[0];
            setStatePartial({
              featureDetails: processFeatureProperties(feature.properties),
              showFeaturePanel: true,
              showFeatureButtons: true,
            });
            if (feature.geometry) {
              if (currentPolygonLayer.current) mapInstance.current.removeLayer(currentPolygonLayer.current);
              const newPolygonLayer = createPolygonLayer(feature.geometry).addTo(mapInstance.current);
              currentPolygonLayer.current = newPolygonLayer;
              mapInstance.current.fitBounds(newPolygonLayer.getBounds(), { padding: MAP_PADDING, maxZoom: mapInstance.current.options.maxZoom });
            }
          } else {
            setStatePartial({ featureDetails: [], showFeaturePanel: false, showFeatureButtons: false });
            if (currentPolygonLayer.current) mapInstance.current.removeLayer(currentPolygonLayer.current);
          }
        } else {
          setStatePartial({ featureDetails: [], showFeaturePanel: false, showFeatureButtons: false });
          if (currentPolygonLayer.current) mapInstance.current.removeLayer(currentPolygonLayer.current);
        }
      } else {
        console.error("Failed to fetch feature info:", response.status);
      }
    } catch (error) {
      console.error("Error fetching feature info:", error);
    } finally {
      setStatePartial({ isLoading: false });
    }
  }, [state.selectedLayer, state.selectedDistrict, state.selectedTehsil, state.selectedVillage, state.selectedKhasra]);

  const handleMapClick = useCallback(async (event) => {
    const { lat, lng } = event.latlng;

    const activeLayer = Object.keys(wmsLayers).find((layerName) =>
      mapInstance.current.hasLayer(wmsLayers[layerName])
    );

    if (!activeLayer) {
      return;
    }

    const url = getFeatureInfoUrl(activeLayer, lat, lng);

    try {
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const properties = feature.properties;
          const clickedKhasra = properties.khasra_no;
          setStatePartial({ selectedKhasra: clickedKhasra });
          
          const newFeatureDetails = processFeatureProperties(properties);

          setStatePartial({
            featureDetails: newFeatureDetails,
            showFeaturePanel: true,
            showFeatureButtons: true,
          });

          if (currentPolygonLayer.current) {
            mapInstance.current.removeLayer(currentPolygonLayer.current);
          }

          const newPolygonLayer = L.geoJSON(feature.geometry).addTo(mapInstance.current);
          currentPolygonLayer.current = newPolygonLayer;

          const bounds = newPolygonLayer.getBounds();
          mapInstance.current.fitBounds(bounds, {
            padding: MAP_PADDING,
            maxZoom: mapInstance.current.options.maxZoom,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching feature info:', error);
    }
  }, [wmsLayers]);

  const handleLayerChange = useCallback((state) => {
    setStatePartial({ selectedLayer: state });
    fetchWMSLayerData(state);
  }, []);

  const fetchWMSLayerData = useCallback(async (layerName) => {
    if (!layerName) return;

    const url = getFeatureInfoUrl1(layerName, {});

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const firstFeature = data.features[0].properties;
          const district = firstFeature.district || '';
          const tehsil = firstFeature.tehsil || '';

          const villages = [];
          const villageKhasraMap = {};

          for (const feature of data.features) {
            const properties = feature.properties;

            if (properties.district === district && properties.tehsil === tehsil) {
              if (properties.village && !villages.includes(properties.village)) {
                villages.push(properties.village);
              }

              if (properties.khasra_no) {
                if (!villageKhasraMap[properties.village]) {
                  villageKhasraMap[properties.village] = [];
                }
                if (!villageKhasraMap[properties.village].includes(properties.khasra_no)) {
                  villageKhasraMap[properties.village].push(properties.khasra_no);
                }
              }
            }
          }

          setStatePartial({
            districtOptions: [district],
            tehsilOptions: [tehsil],
            villageOptions: villages,
            selectedDistrict: district,
            selectedTehsil: tehsil,
          });

          if (villages.length > 0) {
            const firstVillage = villages[0];
            setStatePartial({
              villageKhasraMap,
              selectedVillage: firstVillage,
            });

            const sortedKhasra = villageKhasraMap[firstVillage]
              ? villageKhasraMap[firstVillage].sort((a, b) => parseInt(a) - parseInt(b))
              : [];

            setStatePartial({
              khasraOptions: sortedKhasra,
              selectedKhasra: sortedKhasra.length > 0 ? sortedKhasra[0] : '',
            });
          }
        }
      } else {
        console.error("Failed to fetch WMS layer data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching WMS layer data:", error);
    }
  }, []);

  const handleDistrictChange = useCallback((e) => {
    const selectedDistrict = e.target.value;
    setStatePartial({ selectedDistrict });
    fetchWMSLayerData(selectedDistrict);
  }, [fetchWMSLayerData]);

  const handleTehsilChange = useCallback((e) => {
    const selectedTehsil = e.target.value;
    setStatePartial({ selectedTehsil });
  }, []);

  const handleVillageChange = useCallback((e) => {
    const selectedVillage = e.target.value;
    setStatePartial({ selectedVillage });

    const khasraNumbers = state.villageKhasraMap[selectedVillage] || [];
    const sortedKhasraNumbers = khasraNumbers.sort((a, b) => parseInt(a) - parseInt(b));

    setStatePartial({
      khasraOptions: sortedKhasraNumbers,
      selectedKhasra: sortedKhasraNumbers.length > 0 ? sortedKhasraNumbers[0] : '',
    });
  }, [state.villageKhasraMap]);

  const handleKhasraChange = useCallback((event) => {
    const selectedKhasra = event.target.value;
    setStatePartial({ selectedKhasra });
  }, []);

  const handleOwnershipClick = useCallback(() => {
    setStatePartial({ showPopup: true });
    if (state.selectedKhasra) {
      import('./Parsola.json')
        .then((data) => {
          setStatePartial({ jsonData: data.features });
          const match = data.features.find(
            (feature) => feature.properties["Khasra No"] === parseInt(state.selectedKhasra, 10)
          );
          if (match) {
            match.properties["Owner Name"] = match.properties[
              "Owner Name"
            ].replace("Map Report", "").trim();
          }
          setStatePartial({ matchingFeature: match });
        })
        .catch((err) => console.error('Error loading JSON:', err));
    } else {
      alert('Please select a Khasra first.');
    }
  }, [state.selectedKhasra]);

  const handleFeedbackClick = useCallback(() => {
    window.open('https://forms.gle/LuWQMxrgU5cpakCq8', '_blank');
  }, []);

  const closePopup = useCallback(() => {
    setStatePartial({ showPopup: false });
  }, []);

  // Debug function to check sessionStorage
  const checkSessionStorage = () => {
    console.log('=== DEBUG SESSION STORAGE (MAP) ===');
    console.log('sessionStorage.getItem("isEmailVerified") =', sessionStorage.getItem('isEmailVerified'));
    console.log('=============================');
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Debug button - remove in production */}
      <button 
        onClick={checkSessionStorage}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 9999,
          background: 'blue',
          color: 'white',
          padding: '5px',
          fontSize: '12px',
          opacity: 0,
          pointerEvents: 'auto'
        }}
      >
        Debug Session (Map)
      </button>

      {/* Left Sidebar - Layer Selector */}
      <LayerSelector
        wmsLayers={wmsLayers}
        selectedLayer={state.selectedLayer}
        onLayerChange={(state) => {
          handleLayerChange(state);
          setStatePartial({ selectedLayer: state });
          getLayerBoundingBox(state).then((bounds) => zoomToBounds(bounds, mapInstance));
        }}
        selectedDistrict={state.selectedDistrict}
        selectedTehsil={state.selectedTehsil}
        selectedVillage={state.selectedVillage}
        selectedKhasra={state.selectedKhasra}
        districtOptions={state.districtOptions}
        tehsilOptions={state.tehsilOptions}
        villageOptions={state.villageOptions}
        khasraOptions={state.khasraOptions}
        onDistrictChange={handleDistrictChange}
        onTehsilChange={handleTehsilChange}
        onVillageChange={handleVillageChange}
        onKhasraChange={handleKhasraChange}
        onSubmit={handleSubmit}
      />

      {/* Center - Map Container */}
      <div className="flex-1 h-screen overflow-auto ml-80 mr-80">
        <MapContainer
          onMapClick={handleMapClick}
          selectedLayer={state.selectedLayer}
          wmsLayers={wmsLayers}
          currentPolygonLayer={currentPolygonLayer}
          mapInstance={mapInstance}
        />
      </div>

      {/* Right Sidebar - Feature Panel */}
      <FeaturePanel
        featureDetails={state.featureDetails}
        onVillageMapClick={showPaidFeatureMessage}
        onOwnershipClick={handleOwnershipClick}
        onFeedbackClick={handleFeedbackClick}
        showFeaturePanel={state.showFeaturePanel}
        showFeatureButtons={state.showFeatureButtons}
      />

      {/* Popups and Messages */}
      <OwnershipPopup
        showPopup={state.showPopup}
        onClose={closePopup}
        matchingFeature={state.matchingFeature}
        selectedKhasra={state.selectedKhasra}
      />

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 font-medium">Loading Data...</span>
            </div>
          </div>
        </div>
      )}

      {/* Paid Feature Message */}
      {state.showMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow-lg z-[9999]">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            This is a paid feature. Please contact support for more information.
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent; 