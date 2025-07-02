# Low-Level Design (LLD)

## 1. App.js
- Sets up `AuthContext.Provider`.
- Configures routes using `react-router-dom`.
- Uses `ProtectedRoute` for `/map`.

## 2. components/UI/
- **EmailVerification.js**: Handles user login, OTP verification, and email/phone validation.
- **MapComponent.js**: Renders the map, manages layers, handles user interactions.
- **ProtectedRoute.js**: Restricts access to routes based on authentication.
- **AuthContext.js**: Provides authentication state and methods.
- **PaidFeatureMessage.js**: Displays messages for paid features.
- **OwnershipPopup.js**: Shows ownership details in a popup on the map.
- **MapContainer.js**: Container for map and related controls.
- **FeaturePanel.js**: Displays map features and details.
- **LayerSelector.js**: UI for selecting map layers.
- **Parsola.json**: GeoJSON or configuration data for map features.

## 3. components/hooks/
- **useMapLayers.js**: Custom hook for managing map layers.
- **useDevTools.js**: Custom hook for development tools or debugging.

## 4. components/utils/
- **mapUtils.js**: Utility functions for map operations (e.g., coordinate conversion, feature processing).

---

## Example LLD for Key Components

### EmailVerification.js
- State: email, phone, OTP, verification status.
- Functions: handleInputChange, sendOTP, verifyOTP, validateEmail, validatePhone.
- UI: Input fields, OTP input, submit buttons, error/success messages.
- Integrations: Calls backend for OTP, uses validation logic, updates AuthContext on success.

### MapComponent.js
- State: map instance, selected layer, features, popups.
- Functions: initializeMap, addLayer, handleFeatureClick, showPopup.
- UI: Renders Leaflet map, overlays, popups, and controls.
- Integrations: Uses useMapLayers hook, mapUtils, and context for user state. 