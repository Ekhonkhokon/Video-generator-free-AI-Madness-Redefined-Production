
import React from 'react';

interface LoadingIndicatorProps {
  message: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-2xl flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 border-4 border-t-indigo-500 border-gray-600 rounded-full animate-spin mb-4"></div>
      <h3 className="text-xl font-semibold text-gray-200">Generating Your Video...</h3>
      <p className="text-gray-400 mt-2 transition-opacity duration-500">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
