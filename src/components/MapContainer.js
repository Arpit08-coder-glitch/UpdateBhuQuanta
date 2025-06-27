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

  useEffect(() => {
    // Check if map already exists to prevent re-initialization
    if (mapInstance.current) {
      return;
    }

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
    />
  );
};

export default MapContainer; 