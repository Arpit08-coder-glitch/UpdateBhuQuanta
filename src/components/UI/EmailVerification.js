import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';
// Configure axios with timeout
const api = axios.create({
  timeout: 10000, // 10 seconds timeout
});

// --- Constants and Validation Patterns ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const OTP_REGEX = /^\d{6}$/;
const TOAST_CONFIG = {
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
};

// --- Utility Functions ---
const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address';
  return null;
};
const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!PHONE_REGEX.test(phone.replace(/\D/g, ''))) return 'Please enter a valid 10-digit phone number';
  return null;
};
const validateOtp = (otp) => {
  if (!otp) return 'OTP is required';
  if (!OTP_REGEX.test(otp)) return 'Please enter a 6-digit OTP';
  return null;
};

const checkGmailExists = async (email) => {
  // Example using open.kickbox.com (free, but not always reliable)
  try {
    const res = await fetch(`https://open.kickbox.com/v1/disposable/${email}`);
    const data = await res.json();
    // If not disposable and format is valid, assume it exists (not 100% accurate)
    return data && data.disposable === false;
  } catch {
    return true; // If API fails, allow by default
  }
};

function EmailVerification() {
  // --- State Management ---
  const [state, setState] = useState({
    isModalOpen: true,
    isLoading: false,
    step: 1,
    email: '',
    phone: '',
    errors: {},
    otpTimer: 0, // Timer in seconds
    isOtpExpired: false,
  });
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const { isEmailVerified, setIsEmailVerified } = useAuth();

  // Redirect to map if already authenticated
  useEffect(() => {
    console.log('EmailVerification: isEmailVerified =', isEmailVerified);
    if (isEmailVerified) {
      console.log('EmailVerification: Redirecting to /map');
      navigate('/map');
    }
  }, [isEmailVerified, navigate]);

  // Timer effect for OTP countdown
  useEffect(() => {
    let interval;
    if (state.step === 2 && state.otpTimer > 0) {
      interval = setInterval(() => {
        setState(prev => {
          const newTimer = prev.otpTimer - 1;
          if (newTimer <= 0) {
            return { ...prev, otpTimer: 0, isOtpExpired: true };
          }
          return { ...prev, otpTimer: newTimer };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.step, state.otpTimer]);

  // --- Utility State Updater ---
  const setStatePartial = (partial) => setState(prev => ({ ...prev, ...partial }));

  // --- Form Handlers ---
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setStatePartial({ isLoading: true, errors: {} });
    const emailError = validateEmail(state.email);
    const phoneError = validatePhone(state.phone);
    if (emailError || phoneError) {
      setStatePartial({
        isLoading: false,
        errors: { email: emailError, phone: phoneError }
      });
      return;
    }
    // --- Gmail existence check ---
    if (state.email.toLowerCase().endsWith('@gmail.com')) {
      const exists = await checkGmailExists(state.email);
      if (!exists) {
        toast.warn('This Gmail address does not exist or is not valid.');
        setStatePartial({ isLoading: false });
        return;
      }
    }
    try {
      await api.post(`http://localhost:5006/send-otp`, { email: state.email, phone: state.phone });
      toast.success('OTP sent successfully to your email!');
      setStatePartial({ step: 2, otpTimer: 300, isOtpExpired: false }); // 5 minutes timer
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to send OTP. Please try again.';
      toast.error(errorMsg);
    } finally {
      setStatePartial({ isLoading: false });
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setStatePartial({ isLoading: true, errors: {} });
    
    // Check if OTP is expired
    if (state.isOtpExpired) {
      toast.error('OTP has expired. Please resend.');
      setStatePartial({ isLoading: false });
      return;
    }
    
    const otpValue = inputsRef.current.map((input) => input.value).join('');
    const otpError = validateOtp(otpValue);
    if (otpError) {
      setStatePartial({ isLoading: false, errors: { otp: otpError } });
      toast.error(otpError);
      return;
    }
    try {
      await api.post(`http://localhost:5006/verify-otp`, { email: state.email, otp: otpValue });
      toast.success('OTP verified successfully!');
      setIsEmailVerified(true);
      navigate('/map');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Invalid OTP. Please try again.';
      toast.error(errorMsg);
    } finally {
      setStatePartial({ isLoading: false });
    }
  };

  const handleOtpChange = (index, e) => {
    const value = e.target.value;
    if (!/^\d$/.test(value) && value !== '') return;
    inputsRef.current[index].value = value;
    if (value && index < inputsRef.current.length - 1) inputsRef.current[index + 1].focus();
    if (!value && e.nativeEvent.inputType === 'deleteContentBackward' && index > 0) inputsRef.current[index - 1].focus();
  };

  const goBackToStep1 = () => {
    setStatePartial({ step: 1, errors: {}, otpTimer: 0, isOtpExpired: false });
    inputsRef.current.forEach((input) => (input.value = ''));
  };

  const handleResendOtp = async () => {
    setStatePartial({ isLoading: true });
    try {
      await api.post(`http://localhost:5006/send-otp`, { email: state.email, phone: state.phone });
      setStatePartial({ otpTimer: 300, isOtpExpired: false }); // Reset timer
      toast.success('New OTP sent successfully to your email!');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to resend OTP. Please try again.';
      toast.error(errorMsg);
    } finally {
      setStatePartial({ isLoading: false });
    }
  };

  // --- UI/UX Logic ---
  const isButtonDisabled = !state.email || !state.phone;

  // Format timer display
  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Debug function to check sessionStorage
  const checkSessionStorage = () => {
    console.log('=== DEBUG SESSION STORAGE ===');
    console.log('sessionStorage.getItem("isEmailVerified") =', sessionStorage.getItem('isEmailVerified'));
    console.log('isEmailVerified state =', isEmailVerified);
    console.log('=============================');
  };

  return (
    <>
      <ToastContainer {...TOAST_CONFIG} />
      {/* Debug button - remove in production */}
      <button 
        onClick={checkSessionStorage}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 9999,
          background: 'red',
          color: 'white',
          padding: '5px',
          fontSize: '12px',
          opacity: 0,
          pointerEvents: 'auto'
        }}
      >
        Debug Session
      </button>
      {state.isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="relative w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {state.step === 1 ? 'Welcome to QuantaSIP' : 'Verify Your Phone'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {state.step === 1 ? 'Enter your details to get started' : 'Enter the 6-digit code sent to your phone'}
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${state.step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${state.step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      1
                    </div>
                    <span className="ml-2 text-sm font-medium">Details</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                    <div className={`h-full transition-all duration-300 ${state.step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: state.step >= 2 ? '100%' : '0%' }}></div>
                  </div>
                  <div className={`flex items-center ${state.step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${state.step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      2
                    </div>
                    <span className="ml-2 text-sm font-medium">Verify</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-8">
                {state.step === 1 ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          id="email"
                          value={state.email}
                          onChange={(e) => setStatePartial({ email: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter your email address"
                          required
                        />
                        {state.errors.email && <p className="text-red-500 text-xs mt-1">{state.errors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          value={state.phone}
                          onChange={(e) => setStatePartial({ phone: e.target.value })}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter your phone number"
                          required
                        />
                        {state.errors.phone && <p className="text-red-500 text-xs mt-1">{state.errors.phone}</p>}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isButtonDisabled || state.isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${isButtonDisabled || state.isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 shadow-lg'}`}
                    >
                      {state.isLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending OTP...
                        </div>
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-6">
                        We've sent a 6-digit verification code to <span className="font-medium text-gray-900">{state.email}</span>
                      </p>
                      {/* Timer Display */}
                      {state.otpTimer > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            OTP expires in: <span className="font-bold ml-1">{formatTimer(state.otpTimer)}</span>
                          </p>
                        </div>
                      )}
                      {state.isOtpExpired && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            OTP has expired. Please resend.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center gap-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          className="w-14 h-14 text-center text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          maxLength="1"
                          ref={(el) => (inputsRef.current[index] = el)}
                          onChange={(e) => handleOtpChange(index, e)}
                        />
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={goBackToStep1}
                        className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={state.isLoading}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        {state.isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </div>
                        ) : (
                          'Verify OTP'
                        )}
                      </button>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={state.isLoading || (state.otpTimer > 0 && !state.isOtpExpired)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline disabled:text-gray-400 disabled:no-underline"
                      >
                        {state.isLoading ? 'Sending...' : 
                         state.otpTimer > 0 && !state.isOtpExpired ? 
                         `Resend OTP (${formatTimer(state.otpTimer)})` : 
                         'Resend OTP'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmailVerification; 