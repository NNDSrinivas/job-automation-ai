import React from 'react';

const Spinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="text-5xl animate-bounce mb-4">🤖</div>
        <p className="text-gray-700 text-lg font-semibold">Loading...</p>
      </div>
    </div>
  );
};

export default Spinner;
