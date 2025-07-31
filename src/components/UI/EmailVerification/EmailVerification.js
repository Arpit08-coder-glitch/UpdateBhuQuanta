import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../AuthContext';

// Import smaller components
import EmailForm from './EmailForm';
import OtpForm from './OtpForm';
import ProgressSteps from './ProgressSteps';
import ModalHeader from './ModalHeader';

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
  try {
    const res = await fetch(`https://open.kickbox.com/v1/disposable/${email}`);
    const data = await res.json();
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
              <ModalHeader currentStep={state.step} />
              <ProgressSteps currentStep={state.step} />
              <div className="px-6 py-8">
                {state.step === 1 ? (
                  <EmailForm 
                    state={state}
                    setStatePartial={setStatePartial}
                    handleEmailSubmit={handleEmailSubmit}
                    isButtonDisabled={isButtonDisabled}
                  />
                ) : (
                  <OtpForm 
                    state={state}
                    inputsRef={inputsRef}
                    handleOtpSubmit={handleOtpSubmit}
                    handleOtpChange={handleOtpChange}
                    goBackToStep1={goBackToStep1}
                    handleResendOtp={handleResendOtp}
                    formatTimer={formatTimer}
                  />
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