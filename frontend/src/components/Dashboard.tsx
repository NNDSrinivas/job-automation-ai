import React from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeList from './ResumeList';
import AnimatedMentors from './AnimatedMentors';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto bg-gray-100 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">Welcome to Job Automation AI!</h1>
        <AnimatedMentors />
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/upload')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Upload Resume
          </button>
          <button
            onClick={() => navigate('/match')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Match Job
          </button>
          <button
            onClick={() => navigate('/cover')}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Generate Cover Letter
          </button>
        </div>
        <div className="mt-8">
          <ResumeList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;