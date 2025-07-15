import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🚀 Job Automation AI</h1>
        <p className="text-gray-600 mb-6">
          Your multi-platform job automation system is running!
        </p>
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ Frontend: Running on localhost:5173
          </div>
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            ⚡ Backend: Running on localhost:8000
          </div>
          <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded">
            📊 8 Job Portals Integrated
          </div>
        </div>
        <div className="mt-6">
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Access Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
