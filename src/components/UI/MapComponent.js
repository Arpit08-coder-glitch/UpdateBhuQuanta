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

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [featureDetails, setFeatureDetails] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const currentPolygonLayer = useRef(null);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [tehsilOptions, setTehsilOptions] = useState([]);
  const [villageOptions, setVillageOptions] = useState([]);
  const [khasraOptions, setKhasraOptions] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTehsil, setSelectedTehsil] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedKhasra, setSelectedKhasra] = useState('');
  const [jsonData, setJsonData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [matchingFeature, setMatchingFeature] = useState(null);
  const [villageKhasraMap, setVillageKhasraMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showFeaturePanel, setShowFeaturePanel] = useState(false);
  const [showFeatureButtons, setShowFeatureButtons] = useState(false);

  // Define WMS layers
  const wmsLayers = useMemo(() => ({
    "AndhraPradesh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:AndhraPradesh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "Chhattisgarh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Chhattisgarh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "Goa": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Goa',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "Haryana": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Haryana',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "Karnataka": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Karnataka',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "MadhyaPradesh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:MadhyaPradesh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "Maharashtra": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Maharashtra',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "Rajasthan": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Rajasthan',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "TamilNadu": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:TamilNadu',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "Telangana": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Telangana',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
    "parsola": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:parsola',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
      maxZoom: 19,
    }),
  }), []);

  // Use custom hooks
  useMapLayers(mapInstance, selectedLayer, wmsLayers);
  useDevTools();

  // Memoized event handlers
  const showPaidFeatureMessage = useCallback(() => {
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 5000);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedLayer) {
      alert("Please select a WMS layer.");
      return;
    }

    setIsLoading(true);
    
    const filters = {
      district: selectedDistrict,
      tehsil: selectedTehsil,
      village: selectedVillage,
      khasra: selectedKhasra,
    };

    const url = getFeatureInfoUrl1(selectedLayer, filters);

    try {
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          let newFeatureDetails = [];
          let zoomBounds = null;
          let validFeature = null;

          const sourceProj = "EPSG:32643";
          const targetProj = "EPSG:4326";

          data.features.forEach((feature) => {
            const properties = feature.properties;

            if (
              (selectedDistrict && properties.district !== selectedDistrict) ||
              (selectedTehsil && properties.tehsil !== selectedTehsil) ||
              (selectedVillage && properties.village !== selectedVillage) ||
              (selectedKhasra && properties.khasra_no !== selectedKhasra)
            ) {
              return;
            }

            // Convert properties to feature details format
            for (const [key, value] of Object.entries(properties)) {
              const excludedProperties = [
                "state_code", "distt_code", "teh_code", "block", "block_code", "lu_lc", "others", "remark", "u_id", "objectid_1"
              ];

              if (excludedProperties.includes(key)) continue;

              const formattedKey =
                key === "area_ac"
                  ? "Area"
                  : key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
              const displayValue = key === "area_ac" && !isNaN(value)
                ? parseFloat(value).toFixed(2)
                : value;

              newFeatureDetails.push({
                label: formattedKey,
                value: displayValue
              });
            }

            if (feature.geometry) {
              validFeature = feature;

              if (!zoomBounds) {
                const transformedGeometry = L.geoJSON(feature.geometry, {
                  coordsToLatLng: (coords) => {
                    const [x, y] = proj4(sourceProj, targetProj, [coords[0], coords[1]]);
                    return L.latLng(y, x);
                  },
                });

                zoomBounds = transformedGeometry.getBounds();
              }
            }
          });

          setFeatureDetails(newFeatureDetails);
          setShowFeaturePanel(true);
          setShowFeatureButtons(true);

          if (validFeature && validFeature.geometry) {
            if (currentPolygonLayer.current) {
              mapInstance.current.removeLayer(currentPolygonLayer.current);
            }

            const newPolygonLayer = L.geoJSON(validFeature.geometry, {
              coordsToLatLng: (coords) => {
                const [x, y] = proj4(sourceProj, targetProj, [coords[0], coords[1]]);
                return L.latLng(y, x);
              },
            }).addTo(mapInstance.current);

            currentPolygonLayer.current = newPolygonLayer;

            mapInstance.current.fitBounds(zoomBounds, {
              padding: [50, 50],
              maxZoom: mapInstance.current.options.maxZoom,
            });
          }
        } else {
          setFeatureDetails([]);
          setShowFeaturePanel(false);
          setShowFeatureButtons(false);
          if (currentPolygonLayer.current) {
            mapInstance.current.removeLayer(currentPolygonLayer.current);
          }
        }
      } else {
        console.error("Failed to fetch feature info:", response.status);
      }
    } catch (error) {
      console.error("Error fetching feature info:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLayer, selectedDistrict, selectedTehsil, selectedVillage, selectedKhasra]);

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
          setSelectedKhasra(clickedKhasra);
          
          const excludedProperties = [
            "state_code",
            "distt_code",
            "teh_code",
            "block",
            "block_code",
            "lu_lc",
            "others",
            "remark",
            "u_id",
            "objectid_1",
          ];
          
          let newFeatureDetails = [];

          for (const [key, value] of Object.entries(properties)) {
            if (excludedProperties.includes(key)) continue;

            const formattedKey =
              key === "area_ac"
                ? "Area"
                : key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase());

            const displayValue =
              key === "area_ac" && !isNaN(value)
                ? parseFloat(value).toFixed(2)
                : value;

            newFeatureDetails.push({
              label: formattedKey,
              value: displayValue
            });
          }

          setFeatureDetails(newFeatureDetails);
          setShowFeaturePanel(true);
          setShowFeatureButtons(true);

          if (currentPolygonLayer.current) {
            mapInstance.current.removeLayer(currentPolygonLayer.current);
          }

          const newPolygonLayer = L.geoJSON(feature.geometry).addTo(mapInstance.current);
          currentPolygonLayer.current = newPolygonLayer;

          const bounds = newPolygonLayer.getBounds();
          mapInstance.current.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: mapInstance.current.options.maxZoom,
          });
        } else {
          setFeatureDetails([]);
          setShowFeaturePanel(false);
          setShowFeatureButtons(false);
          if (currentPolygonLayer.current) {
            mapInstance.current.removeLayer(currentPolygonLayer.current);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching feature info:', error);
    }
  }, [wmsLayers]);

  const handleLayerChange = useCallback((state) => {
    setSelectedLayer(state);
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

          setDistrictOptions([district]);
          setTehsilOptions([tehsil]);
          setVillageOptions(villages);
          setSelectedDistrict(district);
          setSelectedTehsil(tehsil);

          if (villages.length > 0) {
            const firstVillage = villages[0];
            setVillageKhasraMap(villageKhasraMap);
            setSelectedVillage(firstVillage);

            const sortedKhasra = villageKhasraMap[firstVillage]
              ? villageKhasraMap[firstVillage].sort((a, b) => parseInt(a) - parseInt(b))
              : [];

            setKhasraOptions(sortedKhasra);
            setSelectedKhasra(sortedKhasra.length > 0 ? sortedKhasra[0] : '');
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
    setSelectedDistrict(selectedDistrict);
    fetchWMSLayerData(selectedDistrict);
  }, [fetchWMSLayerData]);

  const handleTehsilChange = useCallback((e) => {
    const selectedTehsil = e.target.value;
    setSelectedTehsil(selectedTehsil);
  }, []);

  const handleVillageChange = useCallback((e) => {
    const selectedVillage = e.target.value;
    setSelectedVillage(selectedVillage);

    const khasraNumbers = villageKhasraMap[selectedVillage] || [];
    const sortedKhasraNumbers = khasraNumbers.sort((a, b) => parseInt(a) - parseInt(b));

    setKhasraOptions(sortedKhasraNumbers);
    setSelectedKhasra(sortedKhasraNumbers.length > 0 ? sortedKhasraNumbers[0] : '');
  }, [villageKhasraMap]);

  const handleKhasraChange = useCallback((event) => {
    const selectedKhasra = event.target.value;
    setSelectedKhasra(selectedKhasra);
  }, []);

  const handleOwnershipClick = useCallback(() => {
    setShowPopup(true);
    if (selectedKhasra) {
      import('../Parsola.json')
        .then((data) => {
          setJsonData(data.features);
          const match = data.features.find(
            (feature) => feature.properties["Khasra No"] === parseInt(selectedKhasra, 10)
          );
          if (match) {
            match.properties["Owner Name"] = match.properties[
              "Owner Name"
            ].replace("Map Report", "").trim();
          }
          setMatchingFeature(match);
        })
        .catch((err) => console.error('Error loading JSON:', err));
    } else {
      alert('Please select a Khasra first.');
    }
  }, [selectedKhasra]);

  const handleFeedbackClick = useCallback(() => {
    window.open('https://forms.gle/LuWQMxrgU5cpakCq8', '_blank');
  }, []);

  const closePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Sidebar - Layer Selector */}
      <LayerSelector
        wmsLayers={wmsLayers}
        selectedLayer={selectedLayer}
        onLayerChange={(state) => {
          handleLayerChange(state);
          setSelectedLayer(state);
          getLayerBoundingBox(state).then((bounds) => zoomToBounds(bounds, mapInstance));
        }}
        selectedDistrict={selectedDistrict}
        selectedTehsil={selectedTehsil}
        selectedVillage={selectedVillage}
        selectedKhasra={selectedKhasra}
        districtOptions={districtOptions}
        tehsilOptions={tehsilOptions}
        villageOptions={villageOptions}
        khasraOptions={khasraOptions}
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
          selectedLayer={selectedLayer}
          wmsLayers={wmsLayers}
          currentPolygonLayer={currentPolygonLayer}
          mapInstance={mapInstance}
        />
      </div>

      {/* Right Sidebar - Feature Panel */}
      <FeaturePanel
        featureDetails={featureDetails}
        onVillageMapClick={showPaidFeatureMessage}
        onOwnershipClick={handleOwnershipClick}
        onFeedbackClick={handleFeedbackClick}
        showFeaturePanel={showFeaturePanel}
        showFeatureButtons={showFeatureButtons}
      />

      {/* Popups and Messages */}
      <OwnershipPopup
        showPopup={showPopup}
        onClose={closePopup}
        matchingFeature={matchingFeature}
        selectedKhasra={selectedKhasra}
      />

      {/* Loading Overlay */}
      {isLoading && (
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
      {showMessage && (
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