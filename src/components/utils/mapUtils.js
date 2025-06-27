import axios from 'axios';
import proj4 from "proj4";
import L from 'leaflet';

// Utility functions for map operations
export const getFeatureInfoUrl1 = (layerName, filters) => {
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

export const getFeatureInfoUrl = (layerName, lat, lng) => {
  const proxyServerUrl = "http://3.109.124.23:3000/proxy";
  const geoserverUrl = `http://gs.quantasip.com/geoserver/ne/wms?service=WMS&version=1.1.1&request=GetFeatureInfo&layers=ne:${layerName}&query_layers=ne:${layerName}&info_format=application/json&x=50&y=50&height=101&width=101&srs=EPSG:4326&bbox=${lng - 0.001},${lat - 0.001},${lng + 0.001},${lat + 0.001}`;
  console.log(`${proxyServerUrl}?url=${encodeURIComponent(geoserverUrl)}`);
  return `${proxyServerUrl}?url=${encodeURIComponent(geoserverUrl)}`;
};

export const parseFeatureInfoResponse = (data) => {
  const features = data.features || [];
  return features.map((feature) => ({
    label: feature.properties.name || 'Unknown',
    value: JSON.stringify(feature.properties, null, 2),
  }));
};

export const getLayerBoundingBox = async (layerName) => {
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

export const zoomToBounds = (bounds, mapInstance) => {
  if (bounds && mapInstance.current) {
    const { west, south, east, north } = bounds;
    const latLngBounds = L.latLngBounds([south, west], [north, east]);
    mapInstance.current.fitBounds(latLngBounds);
  }
}; 