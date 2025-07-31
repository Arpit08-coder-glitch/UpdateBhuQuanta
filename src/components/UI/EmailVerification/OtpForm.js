import React from 'react';

const OtpForm = ({ 
  state, 
  inputsRef, 
  handleOtpSubmit, 
  handleOtpChange, 
  goBackToStep1, 
  handleResendOtp, 
  formatTimer 
}) => {
  return (
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
  );
};

export default OtpForm; 