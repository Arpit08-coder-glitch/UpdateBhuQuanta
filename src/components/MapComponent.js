import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';


const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null); // Reference to the map instance
  const [, setSelectedLayer] = useState(null);
  const [featureDetails, setFeatureDetails] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const currentPolygonLayer = useRef(null); // Reference to the currently displayed polygon layer

  // Function to show the paid feature message
  const showPaidFeatureMessage = () => {
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false); // Hide the message after 5 seconds
    }, 5000);
  };
  
  // Define WMS layers outside of useEffect for accessibility
  const wmsLayers = useMemo(() => ({
    "AndhraPradesh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:AndhraPradesh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "Chhattisgarh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Chhattisgarh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "Goa": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Goa',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "Haryana": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Haryana',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "Karnataka": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Karnataka',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "MadhyaPradesh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:MadhyaPradesh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "Maharashtra": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Maharashtra',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "Rajasthan": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Rajasthan',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "TamilNadu": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:TamilNadu',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "Telangana": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:Telangana',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
    "UttarPradesh": L.tileLayer.wms('http://gs.quantasip.com/geoserver/ne/wms', {
      layers: 'ne:UttarPradesh',
      format: 'image/png',
      transparent: true,
      attribution: "© QuantaSIP",
    }),
}), []);

  const proxyServerUrl = "http://3.109.124.23:3000/proxy";

  const getFeatureInfoUrl = (layerName, lat, lng) => {
    const geoserverUrl = `http://gs.quantasip.com/geoserver/ne/wms?service=WMS&version=1.1.1&request=GetFeatureInfo&layers=ne:${layerName}&query_layers=ne:${layerName}&info_format=application/json&x=50&y=50&height=101&width=101&srs=EPSG:4326&bbox=${lng - 0.001},${lat - 0.001},${lng + 0.001},${lat + 0.001}`;
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
  
              propertyRow += `
                <tr>
                  <td style="text-align: center; background-color: #f2f2f2; padding: 12px 24px; border: 1px solid #ddd; width: 30%;">
                    <b style="color: #333;">${formattedKey}</b>
                  </td>
                  <td style="text-align: center; background-color: #f9f9f9; padding: 12px 24px; border: 1px solid #ddd; width: 70%;">
                    <span style="color: #444;">${value}</span>
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
        }
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
    });

    const googleSatelliteLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });

    const hybridLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });

    const terrainLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });

    const trafficLayer = L.tileLayer('http://mt0.google.com/vt/lyrs=m,traffic&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
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
    if (mapInstance.current) {
      setSelectedLayer(state);
      const mapMaxZoom = mapInstance.current.options.maxZoom;
      Object.keys(wmsLayers).forEach((key) => {
        if (key === state) {
          const wmsLayer = wmsLayers[key];
        
          // Set the maxZoom of the WMS layer to match the map's maxZoom
          wmsLayer.options.maxZoom = mapMaxZoom;
          wmsLayers[key].addTo(mapInstance.current);
          wmsLayers[key].getContainer().style.zIndex = '100'; // Ensure WMS layer is above background layers
        } else {
          mapInstance.current.removeLayer(wmsLayers[key]);
        }
      });
    }
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

  const zoomToBounds = (bounds) => {
    if (bounds && mapInstance.current) {
      const { west, south, east, north } = bounds;
      const latLngBounds = L.latLngBounds([south, west], [north, east]);
      mapInstance.current.fitBounds(latLngBounds); // Use the map reference here
    }
  };
  

  return (
    
    <div>
      <div
        id="map"
        ref={mapRef}
        style={{ position: 'absolute', top: 0, left: '325px', width: '56vw', height: '100vh' }}
      ></div>
      <div className="layer-selection">
        {Object.keys(wmsLayers).map((state) => (
          <label key={state}>
            <input
              type="radio"
              name="wmsLayer"
              value={state}
              onChange={() => {handleLayerChange(state);
                setSelectedLayer(state);
                getLayerBoundingBox(state).then(zoomToBounds);
              }}
            />
            {state}
          </label>
        ))}
      </div>
      <div id="feature-details" className="feature-panel">
        <table id="feature-table">
          <thead>
            <tr></tr>
          </thead>
          <tbody>
            {featureDetails.map((feature, index) => (
              <tr key={index}>
                <td>{feature.label}</td>
                <td>{feature.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
      {/* Buttons container */}
      <div
        id="feature-buttons"
        style={{
          display: 'none',
          justifyContent: 'center',
          marginTop: '20px',
        }}
      >
        {/* Show Ownership Data button */}
        <button
          id="ownership-button"
          onClick={showPaidFeatureMessage}
          style={{
            padding: '10px 20px',
            margin: '0 10px',
            flex: '1',
            border: 'none',
            backgroundColor: '#007bff',
            color: '#fff',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Show Ownership Data
        </button>

        {/* Show Village Map button */}
        <button
          id="village-map-button"
          onClick={showPaidFeatureMessage}
          style={{
            padding: '10px 20px',
            margin: '0 10px',
            flex: '1',
            border: 'none',
            backgroundColor: '#28a745',
            color: '#fff',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Show Village Map
        </button>
      </div>
    </div>
    {/* Paid feature message */}
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
      </div>
    </div>
  );
};

export default MapComponent;
