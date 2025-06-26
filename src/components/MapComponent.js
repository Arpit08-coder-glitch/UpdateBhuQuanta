import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import proj4 from "proj4";
import "proj4leaflet";
import { useNavigate, useLocation } from 'react-router-dom';

// Custom hook for managing map layers
function useMapLayers(mapInstance, selectedLayerName, wmsLayers) {
  const currentLayerRef = useRef(null);

  useEffect(() => {
    if (!mapInstance.current || !selectedLayerName) return;

    // Remove previous layer
    if (currentLayerRef.current) {
      mapInstance.current.removeLayer(currentLayerRef.current);
    }

    // Add new layer
    const newLayer = wmsLayers[selectedLayerName];
    if (newLayer) {
      newLayer.addTo(mapInstance.current);
      currentLayerRef.current = newLayer;
    }

    // Cleanup on unmount
    return () => {
      if (currentLayerRef.current) {
        mapInstance.current.removeLayer(currentLayerRef.current);
      }
    };
  }, [mapInstance, selectedLayerName, wmsLayers]);
}

const responsiveMapStyles = `
  @media (max-width: 900px) {
    .responsive-map-container {
      flex-direction: column !important;
    }
    .layer-selection, .feature-panel {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      height: auto !important;
      flex: none !important;
    }
    #map {
      width: 100% !important;
      min-width: 0 !important;
      height: 50vh !important;
      flex: none !important;
    }
  }
`;

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null); // Reference to the map instance
  const navigate = useNavigate();
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [featureDetails, setFeatureDetails] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const currentPolygonLayer = useRef(null); // Reference to the currently displayed polygon layer
  const [districtOptions, setDistrictOptions] = useState([]);
  const [tehsilOptions, setTehsilOptions] = useState([]);
  const [villageOptions, setVillageOptions] = useState([]);
  const [khasraOptions, setKhasraOptions] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTehsil, setSelectedTehsil] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedKhasra, setSelectedKhasra] = useState(''); // State for Khasra number
  const location = useLocation();
  const [jsonData, setJsonData] = useState([]);
   const [showPopup, setShowPopup] = useState(false);
  const [matchingFeature, setMatchingFeature] = useState(null);
  // Store the village-to-khasra mapping
  const [villageKhasraMap, setVillageKhasraMap] = useState({});
  const getFeatureInfoUrl1 = (layerName, filters) => {
  const geoserverUrl = `http://gs.quantasip.com/geoserver/ne/ows`;
  let cqlFilter = [];
  if (filters.district) cqlFilter.push(`district='${filters.district}'`);
  if (filters.tehsil) cqlFilter.push(`tehsil='${filters.tehsil}'`);
  if (filters.village) cqlFilter.push(`village='${filters.village}'`);
  const params = new URLSearchParams({
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName: `ne:${layerName}`,
    maxFeatures: "10000",
    outputFormat: "application/json",
  });
  if (cqlFilter.length > 0) {
    params.append("cql_filter", cqlFilter.join(" AND "));
  }
  const geoserverUrlWithParams = `${geoserverUrl}?${params.toString()}`;
  // Using the proxy server
  return `http://3.109.124.23:3000/proxy?url=${encodeURIComponent(geoserverUrlWithParams)}`;
};
  // Function to show the paid feature message
  const showPaidFeatureMessage = () => {
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false); // Hide the message after 5 seconds
    }, 5000);
  };
  const handleSubmit = async () => {
    if (!selectedLayer) {
      alert("Please select a WMS layer.");
      return;
    }
  
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
        const featurePanel = document.getElementById("feature-details");
        const featureButton = document.getElementById("feature-buttons");
        const tableBody = document
          .getElementById("feature-table")
          .querySelector("tbody");
  
        tableBody.innerHTML = ""; // Clear existing table data
  
        if (data.features && data.features.length > 0) {
          let propertyRow = "";
          let zoomBounds = null;
          let validFeature = null;
  
          // Define projections
          const sourceProj = "EPSG:32643"; // WGS84
          const targetProj = "EPSG:4326"; // Web Mercator or your desired projection
  
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
  
            // Add feature properties to table
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
                ? parseFloat(value).toFixed(2) // Round to 2 decimal places
                : value;
  
              propertyRow += `
                <tr>
                  <td style="text-align: center; background-color: #f2f2f2; padding: 12px 24px; border: 1px solid #ddd; width: 30%;">
                    <b style="color: '#555';">${formattedKey}</b>
                  </td>
                  <td style="text-align: center; background-color: #f9f9f9; padding: 12px 24px; border: 1px solid #ddd; width: 70%;">
                    <span style="color: #444;">${displayValue}</span>
                  </td>
                </tr>`;
            }
  
            if (feature.geometry) {
              validFeature = feature;
  
              if (!zoomBounds) {
                // Reproject coordinates
                const transformedGeometry = L.geoJSON(feature.geometry, {
                  coordsToLatLng: (coords) => {
                    const [x, y] = proj4(sourceProj, targetProj, [coords[0], coords[1]]);
                    return L.latLng(y, x); // Leaflet expects lat/lng
                  },
                });
  
                zoomBounds = transformedGeometry.getBounds();
              }
            }
          });
  
          tableBody.innerHTML = propertyRow;
  
          featurePanel.classList.add("show");
          featureButton.style.display = "flex";
  
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
          featurePanel.classList.remove("show");
          if (currentPolygonLayer.current) {
            mapInstance.current.removeLayer(currentPolygonLayer.current);
          }
          featureButton.style.display = "none";
        }
      } else {
        console.error("Failed to fetch feature info:", response.status);
      }
    } catch (error) {
      console.error("Error fetching feature info:", error);
    }
  };
  
  
  // Define WMS layers outside of useEffect for accessibility
  const wmsLayers = useMemo(() => ({
    "AndhraPradesh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:AndhraPradesh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "Chhattisgarh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Chhattisgarh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "Goa": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Goa',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "Haryana": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Haryana',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "Karnataka": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Karnataka',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "MadhyaPradesh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:MadhyaPradesh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "Maharashtra": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Maharashtra',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "Rajasthan": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Rajasthan',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "TamilNadu": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:TamilNadu',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "Telangana": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Telangana',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
    "parsola": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:parsola',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
      zIndex: 500,
    }),
}), []);

useMapLayers(mapInstance, selectedLayer, wmsLayers);

  const proxyServerUrl = "http://3.109.124.23:3000/proxy";
  const getFeatureInfoUrl = (layerName, lat, lng) => {
    const geoserverUrl = `http://gs.quantasip.com/geoserver/ne/wms?service=WMS&version=1.1.1&request=GetFeatureInfo&layers=ne:${layerName}&query_layers=ne:${layerName}&info_format=application/json&x=50&y=50&height=101&width=101&srs=EPSG:4326&bbox=${lng - 0.001},${lat - 0.001},${lng + 0.001},${lat + 0.001}`;
    console.log(`${proxyServerUrl}?url=${encodeURIComponent(geoserverUrl)}`);
    return `${proxyServerUrl}?url=${encodeURIComponent(geoserverUrl)}`;
  };
  const parseFeatureInfoResponse = (data) => {
    const features = data.features || [];
    return features.map((feature) => ({
      label: feature.properties.name || 'Unknown',
      value: JSON.stringify(feature.properties, null, 2),
    }));
  };
  

  const handleMapClick = async (event) => {
    const { lat, lng } = event.latlng;

    // Get the active WMS layer
    const activeLayer = Object.keys(wmsLayers).find((layerName) =>
      mapInstance.current.hasLayer(wmsLayers[layerName])
    );

    if (!activeLayer) {
      console.log("No active WMS layer found");
      return;
    }

    // Generate the GetFeatureInfo URL
    const url = getFeatureInfoUrl(activeLayer, lat, lng);

    try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const featurePanel = document.getElementById("feature-details");
          const featureButton= document.getElementById("feature-buttons");
          const tableBody = document
            .getElementById("feature-table")
            .querySelector("tbody");
  
          // Clear existing table data
          tableBody.innerHTML = "";
  
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const properties = feature.properties;
            const selectedKhasra = properties.khasra_no;
            console.log(selectedKhasra);
            setSelectedKhasra(selectedKhasra); // Set the selected khasra number
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
            let propertyRow = "";
  
            for (const [key, value] of Object.entries(properties)) {
              if (excludedProperties.includes(key)) continue;
  
              const formattedKey =
    key === "area_ac"
      ? "Area"
      : key
          .replace(/_/g, " ") // Replace underscores with spaces
          .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter

  const displayValue =
    key === "area_ac" && !isNaN(value)
      ? parseFloat(value).toFixed(2) // Round to 2 decimal places
      : value;
  
              propertyRow += `
                <tr>
                  <td style="text-align: center; background-color: #f2f2f2; padding: 12px 24px; border: 1px solid #ddd; width: 30%;">
                    <b style="color: '#018630';">${formattedKey}</b>
                  </td>
                  <td style="text-align: center; background-color: #f9f9f9; padding: 12px 24px; border: 1px solid #ddd; width: 70%;">
                    <span style="color: #444;">${displayValue}</span>
                  </td>
                </tr>`;
            }
  
            // Populate table
            tableBody.innerHTML = propertyRow;
  
            // Show the feature panel
            featurePanel.classList.add("show");
            featureButton.style.display='flex';
  
            if (currentPolygonLayer.current) {
                mapInstance.current.removeLayer(currentPolygonLayer.current);
              }
    
              // Add the new polygon to the map
              const newPolygonLayer = L.geoJSON(feature.geometry).addTo(mapInstance.current);
              currentPolygonLayer.current = newPolygonLayer; // Update current polygon layer reference
    
              // Zoom to the bounds of the new polygon layer
              const bounds = newPolygonLayer.getBounds();
              mapInstance.current.fitBounds(bounds, {
                padding: [50, 50], // Optional padding
                maxZoom: mapInstance.current.options.maxZoom,       // Set max zoom level
              });
          } else {
            featurePanel.classList.remove("show");
            if (currentPolygonLayer.current) {
              mapInstance.current.removeLayer(currentPolygonLayer.current);
            }
            featureButton.style.display='none';

          }
        }i
    } catch (error) {
      console.error('Error fetching feature info:', error);
    }
  };

  useEffect(() => {
    // Initialize the map
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5); // Centered in India
    mapInstance.current = map; // Save the map instance

    // Define different base layers
    const osmLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      attribution: ' ',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© QuantaSIP",
    });

    const googleSatelliteLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© QuantaSIP",
    });

    const hybridLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© QuantaSIP",
    });

    const terrainLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© QuantaSIP",
    });

    const trafficLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=m,traffic&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© QuantaSIP",
    });

    // Add OSM Layer to the map initially
    googleSatelliteLayer.addTo(map);

    // Layer control
    const baseLayers = {
      "Open Street Map": osmLayer,
      Satellite: googleSatelliteLayer,
      Hybrid: hybridLayer,
      Terrain: terrainLayer,
      Traffic: trafficLayer,
    };
    L.control.layers(baseLayers, null, { position: 'bottomleft' }).addTo(map);
    
     // Variable to store the currently added feature layer
     map.on('click', handleMapClick);
  

    return () => {
      map.remove();
    };
  }, [wmsLayers]);
  useEffect(() => {
    const disableDevTools = () => {
      window.oncontextmenu = () => false;  // Disable right-click
      window.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault();  // Disable F12 and Ctrl+Shift+I
        }
      });
    };

    disableDevTools();

    return () => {
      window.oncontextmenu = null;  // Re-enable right-click
      window.removeEventListener('keydown', disableDevTools);  // Remove keydown event
    };
  }, []);
  
  

  const handleLayerChange = (state) => {
    setSelectedLayer(state);
    fetchWMSLayerData(state);
  };
   // Fetch bounding box and feature details from GeoServer
   const getLayerBoundingBox = async (layerName) => {
    const url = `http://gs.quantasip.com/geoserver/ne/wms?service=WMS&version=1.1.1&request=GetCapabilities`;
    const geoserverUrl = `http://3.109.124.23:3000/proxy?url=${encodeURIComponent(url)}`;
    try {
      const response = await axios.get(geoserverUrl);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "text/xml");
      const layers = xmlDoc.getElementsByTagName('Layer');
      
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const layerNameElement = layer.querySelector('Name');
        if (layerNameElement && layerNameElement.textContent === layerName) {
          const bboxNode = layer.querySelector('LatLonBoundingBox');
          if (bboxNode) {
            const west = parseFloat(bboxNode.getAttribute('minx'));
            const south = parseFloat(bboxNode.getAttribute('miny'));
            const east = parseFloat(bboxNode.getAttribute('maxx'));
            const north = parseFloat(bboxNode.getAttribute('maxy'));
            return { west, south, east, north };
          }
        }
      }
    } catch (error) {
      console.error('Error fetching bounding box:', error);
    }
  };
  // Function to fetch WMS Layer data
  const fetchWMSLayerData = async (layerName) => {
    if (!layerName) return;

    const url = getFeatureInfoUrl1(layerName, {}); // Fetch the layer data without filters

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

          // Loop through all features to collect villages and khasra numbers
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
          // Set the selected district and tehsil to the first available values
          setSelectedDistrict(district);
          setSelectedTehsil(tehsil);
  
          if (villages.length > 0) {
            const firstVillage = villages[0];
            setVillageKhasraMap(villageKhasraMap);
            setSelectedVillage(firstVillage);
  
            // Sort the khasra numbers in ascending order numerically
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
  };
  // Handle the change in selected district
  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setSelectedDistrict(selectedDistrict);

    // Fetch data for tehsil and villages based on the selected district
    fetchWMSLayerData(selectedDistrict);
  };

  // Handle the change in selected tehsil
  const handleTehsilChange = (e) => {
    const selectedTehsil = e.target.value;
    setSelectedTehsil(selectedTehsil);
  };

  // Handle the change in selected village
  const handleVillageChange = (e) => {
    const selectedVillage = e.target.value;
    setSelectedVillage(selectedVillage);
  
    // Set Khasra numbers for the selected village
    const khasraNumbers = villageKhasraMap[selectedVillage] || [];
    
    // Sort the Khasra numbers in ascending order numerically
    const sortedKhasraNumbers = khasraNumbers.sort((a, b) => parseInt(a) - parseInt(b));
    
    setKhasraOptions(sortedKhasraNumbers);
  
    // Clear selected Khasra if no options
    setSelectedKhasra(sortedKhasraNumbers.length > 0 ? sortedKhasraNumbers[0] : '');
  };

  // Handle the change in selected Khasra
  const handleKhasraChange = (event) => {
    const selectedKhasra = event.target.value; // Get the selected value
    setSelectedKhasra(selectedKhasra); // Set the selected khasra number
    console.log("Selected Khasra Number:", selectedKhasra);
  };
  const handleOwnershipClick = () => {
    setShowPopup(true);
    if (selectedKhasra) {
      // Load the JSON data
    import('./Parsola.json') // Replace with the correct JSON file path
    .then((data) => {
      setJsonData(data.features);
      // Find the matching feature by Khasra No
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
  };


  const zoomToBounds = (bounds) => {
    if (bounds && mapInstance.current) {
      const { west, south, east, north } = bounds;
      const latLngBounds = L.latLngBounds([south, west], [north, east]);
      mapInstance.current.fitBounds(latLngBounds); // Use the map reference here
    }
  };
  const closePopup = () => {
    setShowPopup(false);
  };
  

  return (
    <>
      <style>{responsiveMapStyles}</style>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: '100vh',
          margin: 0,
          width: '100%',
          flexWrap: 'wrap',
        }}
        className="responsive-map-container"
      >
        {/* Left Side - Layer Selection */}
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
                onChange={() => {
                  handleLayerChange(state);
                  setSelectedLayer(state);
                  getLayerBoundingBox(state).then(zoomToBounds);
                }}
                style={{ marginRight: '10px' , color: '#018630'}}
              />
              {state}
            </label>
          ))}
          <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        {/* District */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ width: '30%',padding:'9px', fontWeight: 'bold', color: '#018630', marginRight: '3px' }}>District</label>
          <select style={{ width: '70%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' }} value={selectedDistrict} onChange={handleDistrictChange} disabled={true}>
            <option value="">Select District</option>
            {districtOptions.map((district, index) => (
              <option key={index} value={district}>{district}</option>
            ))}
          </select>
        </div>
        
        {/* Tehsil */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ width: '30%',padding:'9px', fontWeight: 'bold', color: '#018630', marginRight: '3px'  }}>Tehsil</label>
          <select style={{ width: '70%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' }} value={selectedTehsil}
                onChange={handleTehsilChange} disabled={true}>
            <option value="">Select Tehsil</option>
            {tehsilOptions.map((tehsil, index) => (
              <option key={index} value={tehsil}>{tehsil}</option>
            ))}
          </select>
        </div>
        
        {/* Village */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ width: '30%',padding:'9px', fontWeight: 'bold', color: '#018630', marginRight: '3px' }}>Village</label>
          <select value={selectedVillage}
                onChange={handleVillageChange} style={{ width: '70%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' }}>
            <option value="">Select Village</option>
            {villageOptions.map((village, index) => (
              <option key={index} value={village}>{village}</option>
            ))}
          </select>
        </div>
        
        {/* Khasra Number */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <label style={{ width: '30%',padding:'9px', fontWeight: 'bold', color: '#018630', marginRight: '3px' }}>Khasra</label>
          <select style={{ width: '70%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' }} value={selectedKhasra}
                onChange={handleKhasraChange}>
            <option value="">Select Khasra</option>
            {khasraOptions.map((khasra, index) => (
              <option key={index} value={khasra}>{khasra}</option>
            ))}
          </select>
        </div>
        
        {/* Submit Button */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={handleSubmit} 
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

      {/* Center - Map Container */}
      <div
        id="map"
        ref={mapRef}
        style={{
          width: '60%',
          minWidth: 300,
          height: '100%',
          border: '1px solid #ddd',
          boxSizing: 'border-box',
          flex: '2 1 300px',
        }}
      ></div>

      {/* Right Side - Feature Details and Buttons */}
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
        {/* Buttons with Labels */}
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
            onClick={showPaidFeatureMessage}
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
            onClick={handleOwnershipClick}
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
    {/* New Button Section */}
    <div style={{ textAlign: 'center', marginTop: '2px' }}>
      <button
        id="new-feature-button"
        onClick={() => {
          window.open('https://forms.gle/LuWQMxrgU5cpakCq8', '_blank');
        }}
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
    </div>

    {/* Paid Feature Message */}
    {showMessage && (
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
    )}
    {/* Overlay and Popup */}
    {showPopup && (
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
          onClick={closePopup}
        ></div>
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
            onClick={closePopup}
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
    )}

      </>
    );
};
export default MapComponent;
