import { useEffect, useRef, useMemo } from 'react';

// Custom hook for managing map layers
export const useMapLayers = (mapInstance, selectedLayerName, wmsLayers) => {
  const currentLayerRef = useRef(null);

  // Memoize the wmsLayers object to prevent unnecessary re-renders
  const memoizedWmsLayers = useMemo(() => wmsLayers, [wmsLayers]);

  useEffect(() => {
    if (!mapInstance.current || !selectedLayerName) return;

    // Remove previous layer
    if (currentLayerRef.current) {
      mapInstance.current.removeLayer(currentLayerRef.current);
      currentLayerRef.current = null;
    }

    // Add new layer
    const newLayer = memoizedWmsLayers[selectedLayerName];
    if (newLayer) {
      newLayer.addTo(mapInstance.current);
      currentLayerRef.current = newLayer;
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (currentLayerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(currentLayerRef.current);
        currentLayerRef.current = null;
      }
    };
  }, [mapInstance, selectedLayerName, memoizedWmsLayers]);
}; 