import React from 'react';

const ModalHeader = ({ currentStep }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">
        {currentStep === 1 ? 'Welcome to QuantaSIP' : 'Verify Your Email'}
      </h1>
      <p className="text-blue-100 text-sm">
        {currentStep === 1 ? 'Enter your details to get started' : 'Enter the 6-digit code sent to your email'}
      </p>
    </div>
  );
};

export default ModalHeader; 