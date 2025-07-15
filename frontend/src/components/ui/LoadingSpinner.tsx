import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  fullScreen = true
}) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-16 w-16',
    large: 'h-24 w-24'
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-white text-center">
        <div className={`animate-spin rounded-full border-b-4 border-white mx-auto mb-4 ${sizeClasses[size]}`}></div>
        <h2 className="text-2xl font-bold mb-2">🚀 Job Automation AI</h2>
        <p className="text-lg opacity-90">{message}</p>
        <div className="mt-4 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
