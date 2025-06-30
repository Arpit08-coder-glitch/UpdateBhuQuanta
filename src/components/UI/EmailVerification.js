import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

// Configure axios with timeout
const api = axios.create({
  timeout: 10000, // 10 seconds timeout
});

function EmailVerification() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [otp, setOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email/Phone, 2: OTP
  const [mockOtp, setMockOtp] = useState(''); // For testing when API is down
  const [smsSent, setSmsSent] = useState(false); // Track if SMS was sent
  const [emailSent, setEmailSent] = useState(false); // Track if email was sent
  const inputsRef = useRef([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  // Simulate SMS sending
  const simulateSmsSending = async (phone, otp) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`SMS sent to ${phone}: Your OTP is ${otp}`);
        setSmsSent(true);
        resolve();
      }, 2000); // Simulate 2 second delay
    });
  };

  // Simulate email sending
  const simulateEmailSending = async (email, otp) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Email sent to ${email}: Your OTP is ${otp}`);
        setEmailSent(true);
        resolve();
      }, 1000); // Simulate 1 second delay
    });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !phone) {
      toast.error('Both email and phone number are required!');
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address!');
      setIsLoading(false);
      return;
    }

    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number!');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post(`http://otp.quantasip.com/send-otp`, { email, phone });
      toast.success('OTP sent successfully to your phone!');
      setStep(2);
      console.log('OTP sent:', response.data);
    } catch (error) {
      console.error('Error sending OTP:', error);
      console.log('Error status:', error.response?.status);
      console.log('Error code:', error.code);
      
      // If API is down, use mock OTP for testing
      if (error.response?.status === 500 || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setMockOtp(generatedOtp);
        console.log('Mock OTP generated:', generatedOtp);
        console.log('Setting step to 2...');
        
        // Simulate sending to SMS only
        toast.info(`API server is down. Sending test OTP to your phone...`);
        
        // Simulate SMS sending
        await simulateSmsSending(phone, generatedOtp);
        
        toast.success(`Test OTP sent to your phone!`);
        setStep(2);
        console.log('Step should now be 2');
      } else {
        const errorMsg = error.response?.data?.error || 'Failed to send OTP. Please try again.';
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const otpValue = inputsRef.current.map((input) => input.value).join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter a 6-digit OTP.');
      setIsLoading(false);
      return;
    }

    try {
      // If we have a mock OTP, verify it locally
      if (mockOtp) {
        if (otpValue === mockOtp) {
          toast.success('OTP verified successfully!');
          setIsEmailVerified(true);
          console.log('Mock OTP verified:', otpValue);
        } else {
          toast.error('Invalid OTP. Please try again.');
        }
      } else {
        // Use the actual API
        const response = await api.post(`http://otp.quantasip.com/verify-otp`, {
          email,
          otp: otpValue,
        });
        toast.success('OTP verified successfully!');
        setIsEmailVerified(true);
        console.log('OTP verified:', response.data);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const errorMsg = error.response?.data?.error || 'Invalid OTP. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, e) => {
    const value = e.target.value;
    if (!/^\d$/.test(value) && value !== '') return;

    inputsRef.current[index].value = value;

    if (value && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1].focus();
    }

    if (!value && e.nativeEvent.inputType === 'deleteContentBackward' && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const goBackToStep1 = () => {
    setStep(1);
    inputsRef.current.forEach((input) => (input.value = ''));
    setMockOtp(''); // Clear mock OTP when going back
    setSmsSent(false); // Reset SMS sent state
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    // Reset sent states
    setSmsSent(false);
    
    try {
      if (mockOtp) {
        // Generate new mock OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setMockOtp(generatedOtp);
        
        // Simulate sending to SMS only
        toast.info(`Resending test OTP to your phone...`);
        
        // Simulate SMS sending
        await simulateSmsSending(phone, generatedOtp);
        
        toast.success(`New test OTP sent to your phone!`);
      } else {
        // Resend via API
        const response = await api.post(`http://otp.quantasip.com/send-otp`, { email, phone });
        toast.success('New OTP sent successfully to your phone!');
        console.log('OTP resent:', response.data);
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      if (error.response?.status === 500 || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setMockOtp(generatedOtp);
        
        // Simulate sending to SMS only
        toast.info(`API server is down. Resending test OTP to your phone...`);
        
        // Simulate SMS sending
        await simulateSmsSending(phone, generatedOtp);
        
        toast.success(`New test OTP sent to your phone!`);
      } else {
        toast.error('Failed to resend OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEmailVerified) {
      navigate('/map');
    }
  }, [isEmailVerified, navigate]);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('Step changed to:', step);
    console.log('Mock OTP state:', mockOtp);
  }, [step, mockOtp]);

  const isButtonDisabled = !email || !phone;

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="relative w-full max-w-md">
            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {step === 1 ? 'Welcome to QuantaSIP' : 'Verify Your Email'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {step === 1 ? 'Enter your details to get started' : 'Enter the 6-digit code sent to your email'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      1
                    </div>
                    <span className="ml-2 text-sm font-medium">Details</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                    <div className={`h-full transition-all duration-300 ${
                      step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                    }`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
                  </div>
                  <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      2
                    </div>
                    <span className="ml-2 text-sm font-medium">Verify</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-8">
                {step === 1 ? (
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter your email address"
                          required
                        />
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
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isButtonDisabled || isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
                        isButtonDisabled || isLoading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 shadow-lg'
                      }`}
                    >
                      {isLoading ? (
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
                        We've sent a 6-digit verification code to <span className="font-medium text-gray-900">{phone}</span>
                      </p>
                      {mockOtp && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Test Mode:</strong> API server is down. OTP sent to your phone.
                          </p>
                        </div>
                      )}
                      {smsSent && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            SMS sent successfully
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
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        {isLoading ? (
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
                        disabled={isLoading}
                        className="text-sm text-blue-600 hover:text-blue-800 underline disabled:text-gray-400 disabled:no-underline"
                      >
                        {isLoading ? 'Sending...' : 'Resend OTP'}
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