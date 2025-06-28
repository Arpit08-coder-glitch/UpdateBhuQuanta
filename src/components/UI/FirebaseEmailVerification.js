import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  sendEmailVerification, 
  reload, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { auth } from '../../firebase';
import 'react-toastify/dist/ReactToastify.css';

function FirebaseEmailVerification() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email/Phone, 2: Verify Email
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userCredential, setUserCredential] = useState(null);
  
  const { signup, login, sendVerificationEmail, currentUser } = useAuth();
  const navigate = useNavigate();

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
      console.log('Starting email OTP process...');
      console.log('Email:', email);
      console.log('Phone:', phone);
      
      // Generate a unique password for this session
      const sessionPassword = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated session password');
      
      let credential;
      
      try {
        // Try to create a new account first
        console.log('Attempting to create new account...');
        credential = await createUserWithEmailAndPassword(auth, email, sessionPassword);
        console.log('New account created successfully:', credential);
        
        // Store the credential for OTP verification
        setUserCredential(credential);
        
        // Send verification email
        console.log('Sending verification email to:', credential.user.email);
        await sendEmailVerification(credential.user);
        console.log('Verification email sent successfully');
        
        toast.success('OTP sent to your email! Please check your inbox.');
        setStep(2);
      } catch (signupError) {
        console.log('Signup error:', signupError.code);
        
        // If account already exists, send email link authentication
        if (signupError.code === 'auth/email-already-in-use') {
          console.log('Account already exists, sending email link authentication...');
          
          // Configure email link settings
          const actionCodeSettings = {
            url: window.location.origin + '/map', // URL to redirect to after verification
            handleCodeInApp: true,
          };
          
          // Send sign-in link to email
          await sendSignInLinkToEmail(auth, email, actionCodeSettings);
          console.log('Sign-in link sent successfully');
          
          // Store email in localStorage for later use
          window.localStorage.setItem('emailForSignIn', email);
          
          toast.success('Verification email sent! Please check your inbox.');
          setStep(2);
        } else {
          throw signupError;
        }
      }
    } catch (error) {
      console.error('=== EMAIL OTP ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      
      let errorMsg = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered. Please use a different email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your connection.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please wait a moment and try again.';
      } else if (error.code === 'auth/user-disabled') {
        errorMsg = 'This account has been disabled. Please contact support.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = 'Email/password accounts are not enabled. Please contact support.';
      } else if (error.code === 'auth/user-not-found') {
        errorMsg = 'Email not found. Please check your email address.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (userCredential) {
        // Handle new user email verification
        console.log('Checking email verification status for new user...');
        
        // Reload the user to get the latest verification status
        await reload(userCredential.user);
        
        if (userCredential.user.emailVerified) {
          console.log('Email verified successfully');
          toast.success('Email verified successfully!');
          navigate('/map');
        } else {
          console.log('Email not verified yet');
          toast.info('Please check your email and click the verification link.');
        }
      } else {
        // Handle existing user (email link authentication was sent)
        console.log('Existing user verification - email link was sent');
        toast.success('Verification email sent successfully! You can now proceed.');
        navigate('/map');
      }
    } catch (error) {
      console.error('Email verification check error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMsg = 'Failed to check verification status. Please try again.';
      
      if (error.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your connection.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please wait a moment and try again.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      if (userCredential) {
        // Resend verification email for new user
        console.log('Resending verification email for new user...');
        await sendEmailVerification(userCredential.user);
        console.log('Verification email resent successfully');
        toast.success('New verification email sent! Please check your inbox.');
      } else {
        // Resend email link authentication for existing user
        console.log('Resending email link authentication for existing user...');
        const actionCodeSettings = {
          url: window.location.origin + '/map',
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        console.log('Email link authentication resent successfully');
        toast.success('New verification email sent! Please check your inbox.');
      }
    } catch (error) {
      console.error('Resend verification email error:', error);
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToStep1 = () => {
    setStep(1);
    setEmail('');
    setPhone('');
    setUserCredential(null);
  };

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (currentUser && step === 2) {
        try {
          await reload(currentUser);
          // Don't automatically redirect - let user click the button
          console.log('Email verification status checked:', currentUser.emailVerified);
        } catch (error) {
          console.error('Error checking email verification:', error);
        }
      }
    };

    // Check immediately when component mounts or currentUser changes
    checkEmailVerification();

    // Remove automatic periodic checking - let user control when to check
  }, [currentUser, step]);

  // Handle email link authentication on component mount
  useEffect(() => {
    const handleEmailLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        console.log('Email link detected on component mount');
        try {
          let email = window.localStorage.getItem('emailForSignIn');
          if (!email) {
            email = window.prompt('Please provide your email for confirmation');
          }
          
          if (email) {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            console.log('Email link sign-in successful:', result);
            window.localStorage.removeItem('emailForSignIn');
            toast.success('Email verified successfully!');
            navigate('/map');
          }
        } catch (error) {
          console.error('Email link sign-in error:', error);
          toast.error('Failed to verify email. Please try again.');
        }
      }
    };

    handleEmailLink();
  }, []);

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
                  {step === 1 ? 'Verify Your Email and Phone Number' : 'Verify Your Email'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {step === 1 ? 'Enter your details to get started' : 'Check your email and click the verification link'}
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
                    <span className="ml-2 text-sm font-medium">Verify Email</span>
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
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
                        isLoading
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
                          Sending Email...
                        </div>
                      ) : (
                        'Send Email OTP'
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        We've sent a verification email to <span className="font-medium text-gray-900">{email}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Click the verification link in your email to complete your registration.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleOtpSubmit}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Checking...
                          </div>
                        ) : (
                          'I\'ve Verified My Email'
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        {isLoading ? 'Sending...' : 'Resend Verification Email'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={goBackToStep1}
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        Back to Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FirebaseEmailVerification; 