import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css';
import '../index.css';
import './ButtonTry.css';

function EmailVerification() {
  const [isModalOpen, setIsModalOpen] = useState(true); // Modal is open by default
  const [otp, setOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const inputsRef = useRef([]); // For OTP inputs
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  // Handles the form submission for sending OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!email || !phone) {
      toast.error('Both email and phone number are required!');
      return;
    }
    if (isEmailVerified) {
      toast.info('Email is already verified!');
      return;
    }

    try {
      const response = await axios.post(`http://otp.quantasip.com/send-otp`, { email, phone }); // Updated to send both `email` and `phone`
      toast.success('OTP sent successfully to your email!');
      console.log('OTP sent:', response.data);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || 'Failed to send OTP. Please try again.';
      toast.error(errorMsg);
      console.error('Error sending OTP:', error);
    }
  };

  // Handles the form submission for verifying OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    // Concatenate OTP input values
    const otpValue = inputsRef.current.map((input) => input.value).join('');
    if (otpValue.length !== 4) {
      toast.error('Please enter a 4-digit OTP.');
      return;
    }

    try {
      const response = await axios.post(`http://otp.quantasip.com/verify-otp`, {
        email,
        otp: otpValue,
      });
      toast.success('OTP verified successfully!');
      console.log('OTP verified:', response.data);
      setIsEmailVerified(true);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || 'Invalid OTP. Please try again.';
      toast.error(errorMsg);
      console.error('Error verifying OTP:', error);
    }
  };

  // Handles input change for OTP fields
  const handleOtpChange = (index, e) => {
    const value = e.target.value;
    if (!/^\d$/.test(value) && value !== '') return; // Ensure only numbers are entered

    inputsRef.current[index].value = value;

    // Automatically move to the next input
    if (value && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1].focus();
    }

    // Move to the previous input if deleting
    if (!value && e.nativeEvent.inputType === 'deleteContentBackward' && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  // Resets OTP inputs when modal is opened
  useEffect(() => {
    if (isModalOpen) {
      inputsRef.current.forEach((input) => (input.value = ''));
    }
  }, [isModalOpen]);

  // Navigate to another route if email is verified
  useEffect(() => {
    if (isEmailVerified) {
      navigate('/map');
    }
  }, [isEmailVerified, navigate]);

  // Disable the button if email or phone is missing
  const isButtonDisabled = !email || !phone;

  return (
    <>
      <ToastContainer />
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50"
          aria-hidden={!isModalOpen}
        >
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                <h1 className="text-2xl font-bold mb-1">Verify Your Email and Phone Number</h1>
              </div>
              <div className="p-4 md:p-5">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Your email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      placeholder="Enter 10 digit phone"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full inline-flex justify-center whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 ${
                      isButtonDisabled
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    disabled={isButtonDisabled}
                  >
                    Send OTP
                  </button>
                </form>

                {/* OTP Form */}
                <form onSubmit={handleOtpSubmit} className="space-y-4 mt-4">
                  <p className="text-[15px] text-slate-500">
                    Enter the 4-digit verification code sent to your email
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        className="w-14 h-14 text-center text-2xl font-extrabold text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded p-4 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        maxLength="1"
                        ref={(el) => (inputsRef.current[index] = el)}
                        onChange={(e) => handleOtpChange(index, e)}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-green-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 transition-colors duration-150"
                  >
                    Verify OTP
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmailVerification;
