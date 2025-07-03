// Centralized configuration for the application
const config = {
  // API Configuration
  geoserverUrl: process.env.REACT_APP_GEOSERVER_URL || 'http://gs.quantasip.com/geoserver',
  proxyServerUrl: process.env.REACT_APP_PROXY_SERVER_URL || 'http://3.109.124.23:3000',
  otpApiUrl: process.env.REACT_APP_OTP_API_URL || 'http://otp.quantasip.com',
  
  // Map Configuration
  defaultMapCenter: {
    lat: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LAT) || 20.5937,
    lng: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LNG) || 78.9629,
  },
  defaultMapZoom: parseInt(process.env.REACT_APP_DEFAULT_MAP_ZOOM) || 5,
  
  // Feature Flags
  enableMockOtp: process.env.REACT_APP_ENABLE_MOCK_OTP === 'true',
  enableDevTools: process.env.REACT_APP_ENABLE_DEV_TOOLS === 'true',
  
  // External Services
  feedbackFormUrl: process.env.REACT_APP_FEEDBACK_FORM_URL || 'https://forms.gle/LuWQMxrgU5cpakCq8',
  
  // Validation Patterns
  validation: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\d{10}$/,
    otp: /^\d{6}$/,
  },
  
  // Animation Durations
  animations: {
    smsSimulation: 2000,
    emailSimulation: 1000,
  },
  
  // Toast Configuration
  toast: {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    newestOnTop: false,
    closeOnClick: true,
    rtl: false,
    pauseOnFocusLoss: true,
    draggable: true,
    pauseOnHover: true,
    theme: "light"
  }
};

export default config; 