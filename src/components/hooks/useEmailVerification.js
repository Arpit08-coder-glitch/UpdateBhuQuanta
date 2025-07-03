import axios from 'axios';
import { toast } from 'react-toastify';
import config from '../../config';

// Configure axios with timeout
const axiosInstance = axios.create({
  timeout: 10000,
});

export function useEmailVerification() {
  // Send OTP to email
  const sendOtp = async (email) => {
    try {
      const response = await axiosInstance.post(`${config.otpApiUrl}/api/send-otp`, { email });
      toast.success('OTP sent to your email!');
      return response.data;
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
      throw error;
    }
  };

  // Verify OTP
  const verifyOtp = async (email, otp) => {
    try {
      const response = await axiosInstance.post(`${config.otpApiUrl}/api/verify-otp`, { email, otp });
      toast.success('Email verified successfully!');
      return response.data;
    } catch (error) {
      toast.error('Invalid OTP. Please try again.');
      throw error;
    }
  };

  return { sendOtp, verifyOtp };
} 