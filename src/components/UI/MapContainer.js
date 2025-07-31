import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapContainer = ({ 
  onMapClick, 
  selectedLayer, 
  wmsLayers, 
  currentPolygonLayer, 
  mapInstance 
}) => {
  const mapRef = useRef(null);

  // Memoize the click handler to prevent unnecessary re-renders
  const handleMapClick = useCallback((event) => {
    if (onMapClick) {
      onMapClick(event);
    }
  }, [onMapClick]);
  const formatLayerName = (layer) => {
    const nameMap = {
      AndhraPradesh: 'Andhra Pradesh',
      MadhyaPradesh: 'Madhya Pradesh',
      TamilNadu: 'Tamil Nadu',
    };
    return nameMap[layer] || layer;
  };
  useEffect(() => {
    // Check if map already exists to prevent re-initialization
    if (mapInstance.current) {
      return;
    }

    // Initialize the map
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5); // Centered in India
    mapInstance.current = map; // Save the map instance

    // Set the attribution prefix to the Indian flag image and 'India'
    map.attributionControl.setPrefix('<img src="/india-flag.png" alt="India Flag" style="height:16px;vertical-align:middle;margin-right:4px;display:inline;"/>India');

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
    
    // Add click event listener
    map.on('click', handleMapClick);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate useEffect for updating click handler
  useEffect(() => {
    if (mapInstance.current) {
      // Remove old click listener
      mapInstance.current.off('click');
      // Add new click listener
      mapInstance.current.on('click', handleMapClick);
    }
  }, [handleMapClick]);

  return (
    <div className="relative flex-1 h-full">
      {/* Map Container */}
      <div
        id="map"
        ref={mapRef}
        className="w-full h-full rounded-lg shadow-lg"
        style={{ zIndex: 1 }}
      />
      
      {/* Map Overlay Controls */}
<div className="absolute top-4 right-4 z-[1000] space-y-2">
  {/* Active Layer Status (translucent background) */}
  {selectedLayer && (
    <div className="bg-white/70 rounded-lg shadow-lg p-3">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-gray-700">Selected State</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {formatLayerName(selectedLayer)}
      </p>
    </div>
  )}
</div>

      {/* Loading Indicator */}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[999] hidden" id="map-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Map...</p>
        </div>
      </div>
    </div>
  );
};

export default MapContainer; 