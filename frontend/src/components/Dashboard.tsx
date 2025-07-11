// src/components/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeList from './ResumeList';
import AnimatedMentors from './AnimatedMentors';
import MentorEngine from '../mentors/MentorEngine';
import '../styles/Dashboard.css';
import { ResumeInfo } from './types';
import { useAuth } from './AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

const jobBoards = [
  { name: 'LinkedIn', value: 'linkedin' },
  { name: 'Glassdoor', value: 'glassdoor' },
  { name: 'Dice', value: 'dice' },
  { name: 'Indeed', value: 'indeed' },
];

// Dashboard component that serves as the main user interface after login
// Displays welcome message, mentor animations, and action buttons for resume upload, job matching, and cover letter generation
// Also includes a logout button to clear session and redirect to login page

// This component retrieves the username from localStorage and displays it in the welcome message
// It also handles user logout by clearing the token and redirecting to the login page

// The component uses the useEffect hook to fetch user information from localStorage on mount
// It also provides buttons for navigating to different functionalities like uploading resumes, matching jobs, and generating cover letters
// The AnimatedMentors component is included to show mentor animations relevant to the current screen

// The component is styled using Tailwind CSS classes for a clean and responsive layout
// It uses the useNavigate hook from react-router-dom for navigation between different routes in the application

// The Dashboard component is the main entry point for users after they log in, providing a user-friendly interface to interact with the application
// It also includes a ResumeList component to display uploaded resumes, enhancing the user experience by providing quick access to their documents

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(jobBoards[0].value);
  const [stats, setStats] = useState({ applied: 0, denied: 0, interviewed: 0 });
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [searching, setSearching] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState('');
  const [questionnaire, setQuestionnaire] = useState<{ [key: string]: string }>({});
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [currentJobId, setCurrentJobId] = useState('');
  const { logout } = useAuth();

  const sampleQuestions = [
    { key: 'workAuth', label: 'Are you authorized to work in the US?' },
    { key: 'relocate', label: 'Are you willing to relocate?' },
    { key: 'startDate', label: 'Earliest start date?' },
  ];

  useEffect(() => {
    setLoading(true);
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUsername(parsed.username || '');
      } catch (err) {
        setError('Failed to load user info.');
        toast.error('Failed to load user info.');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch stats from backend (mock for now)
    setStats({ applied: 12, denied: 3, interviewed: 2 });
  }, []);

  const fetchStats = async () => {
    try {
      // Replace with actual user ID logic if needed
      const userId = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')!).id : 'user1';
      const response = await axiosInstance.get('/application-stats', { params: { user_id: userId } });
      setStats(response.data);
    } catch (err) {
      toast.error('Failed to fetch statistics.');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
    setLoading(true);
    try {
      localStorage.removeItem('token');
      logout();
      toast.info('Logged out successfully.');
      navigate('/login');
    } catch (err) {
      setError('Logout failed.');
      toast.error('Logout failed.');
    }
    setLoading(false);
  };

  const handleSearchJobs = async () => {
    setSearching(true);
    try {
      // Assume resumeText is from primary resume
      const storedResumes = localStorage.getItem('resumes');
      let resumeText = '';
      if (storedResumes) {
        const parsed = JSON.parse(storedResumes);
        const primary = parsed.find((r: any) => r.isPrimary);
        if (primary) resumeText = primary.content;
      }
      const response = await axiosInstance.post('/search-jobs', {
        resume_text: resumeText,
        job_board: selectedBoard,
        questionnaire: {}, // Add questionnaire logic if needed
      });
      setMatchedJobs(response.data.jobs || []);
      toast.success('Job search completed!');
    } catch (err) {
      toast.error('Job search failed.');
    }
    setSearching(false);
  };

  const handleQuestionnaireChange = (key: string, value: string) => {
    setQuestionnaire(prev => ({ ...prev, [key]: value }));
  };

  const handleShowQuestionnaire = (jobId: string) => {
    setCurrentJobId(jobId);
    setShowQuestionnaire(true);
  };

  const handleSubmitQuestionnaire = async () => {
    setShowQuestionnaire(false);
    await handleApplyJob(currentJobId, questionnaire);
    setQuestionnaire({});
    setCurrentJobId('');
  };

  const handleApplyJob = async (jobId: string, questionnaireData: any = {}) => {
    setApplyingJobId(jobId);
    try {
      const storedResumes = localStorage.getItem('resumes');
      let resumeText = '';
      if (storedResumes) {
        const parsed = JSON.parse(storedResumes);
        const primary = parsed.find((r: any) => r.isPrimary);
        if (primary) resumeText = primary.content;
      }
      await axiosInstance.post('/apply-job', {
        job_id: jobId,
        resume_text: resumeText,
        job_board: selectedBoard,
        questionnaire: questionnaireData,
      });
      toast.success('Applied to job!');
      fetchStats(); // Refresh stats after applying
    } catch (err) {
      toast.error('Application failed.');
    }
    setApplyingJobId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Job Automation AI</h1>
                <p className="text-sm text-gray-600">Welcome back, {username || 'User'}!</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mentor Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col items-center text-center">
            <AnimatedMentors />
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-gray-900">Your AI Career Assistant</h2>
              <p className="text-gray-600 mt-1">Ready to help you land your dream job</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications Sent</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.applied}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interviews</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.interviewed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.applied > 0 ? Math.round((stats.interviewed / stats.applied) * 100) : 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Resume
            </button>

            <button
              onClick={() => navigate('/match')}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Match Jobs
            </button>

            <button
              onClick={() => navigate('/cover')}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Cover Letter
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
          </div>
        </div>

        {/* Job Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Job Search</h3>
              <p className="text-sm text-gray-600 mt-1">Find jobs that match your skills and experience</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <select
                value={selectedBoard}
                onChange={e => setSelectedBoard(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
              >
                {jobBoards.map(board => (
                  <option key={board.value} value={board.value}>{board.name}</option>
                ))}
              </select>
              <button
                onClick={handleSearchJobs}
                disabled={searching}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {searching ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find Jobs
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Matched Jobs */}
          {matchedJobs.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Matched Jobs ({matchedJobs.length})</h4>
              {matchedJobs.map((job: any) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <h5 className="text-lg font-medium text-gray-900">{job.title}</h5>
                      <p className="text-gray-600">{job.company}</p>
                      <div className="mt-2 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {job.score}% Match
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-4">
                      <button
                        onClick={() => handleShowQuestionnaire(job.id)}
                        disabled={applyingJobId === job.id}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {applyingJobId === job.id ? 'Applying...' : 'Apply Now'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Resume Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Resume Management</h3>
          <ResumeList />
        </div>

        {/* Questionnaire Modal */}
        {showQuestionnaire && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Application Questions</h2>
                  <button
                    onClick={() => setShowQuestionnaire(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={e => { e.preventDefault(); handleSubmitQuestionnaire(); }}>
                  <div className="space-y-4">
                    {sampleQuestions.map(q => (
                      <div key={q.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{q.label}</label>
                        <input
                          type="text"
                          value={questionnaire[q.key] || ''}
                          onChange={e => handleQuestionnaireChange(q.key, e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowQuestionnaire(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      Submit Application
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
