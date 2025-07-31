import React from 'react';

const ProgressSteps = ({ currentStep }) => {
  return (
    <div className="px-6 py-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">Details</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 mx-4">
          <div className={`h-full transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: currentStep >= 2 ? '100%' : '0%' }}></div>
        </div>
        <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Verify</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressSteps; 