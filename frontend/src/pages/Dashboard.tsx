import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

console.log('🚀 PROFESSIONAL DASHBOARD COMPONENT LOADED!');

interface DashboardStats {
  totalApplications: number;
  successRate: number;
  interviewRate: number;
  thisWeek: number;
  activeJobs: number;
  savedJobs: number;
}

interface RecentActivity {
  id: string;
  type: 'application' | 'interview' | 'response' | 'job_saved';
  company: string;
  position: string;
  timestamp: string;
  status: 'success' | 'pending' | 'rejected';
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    successRate: 0,
    interviewRate: 0,
    thisWeek: 0,
    activeJobs: 0,
    savedJobs: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch real user data from the backend
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/application-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalApplications: data.applied || 0,
          successRate: data.success_rate || 0,
          interviewRate: data.interviewed || 0,
          thisWeek: 0, // This can be calculated from the backend if needed
          activeJobs: 0, // This should come from job search results
          savedJobs: 0 // This should come from saved jobs feature
        });

        // Only show recent activity if user has applications
        if (data.applied > 0) {
          setRecentActivity([
            {
              id: '1',
              type: 'application',
              company: 'Recent Application',
              position: 'Software Engineer',
              timestamp: 'Recently',
              status: 'pending'
            }
          ]);
        } else {
          setRecentActivity([]);
        }
      } else {
        // If no data or error, show empty state
        setStats({
          totalApplications: 0,
          successRate: 0,
          interviewRate: 0,
          thisWeek: 0,
          activeJobs: 0,
          savedJobs: 0
        });
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Show empty state on error
      setStats({
        totalApplications: 0,
        successRate: 0,
        interviewRate: 0,
        thisWeek: 0,
        activeJobs: 0,
        savedJobs: 0
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.firstName || user?.email || 'User';
  };

  const handleStartAutoApply = () => {
    // Navigate to auto apply feature or show modal
    navigate('/auto-apply');
  };

  const handleBrowseJobs = () => {
    // Navigate to job browsing page
    navigate('/jobs');
  };

  const handleFindNewJobs = () => {
    navigate('/jobs');
  };

  const handleAICareerChat = () => {
    // Navigate to AI career chat page
    navigate('/ai-chat');
  };

  const handleUpdateResume = () => {
    navigate('/resume-manager');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-20 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Job Automation Dashboard - {getGreeting()}, {getUserDisplayName()}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your job search today.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleStartAutoApply}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Start Auto Apply
          </button>
          <button
            onClick={handleBrowseJobs}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Browse Jobs
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats.totalApplications > 0 ? (
              <span className="text-green-500 text-sm font-medium">+{stats.thisWeek} this week</span>
            ) : (
              <span className="text-gray-500 text-sm">Start applying to jobs to see your progress</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.successRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats.successRate > 0 ? (
              <span className="text-green-500 text-sm font-medium">+2% from last month</span>
            ) : (
              <span className="text-gray-500 text-sm">Apply to jobs to track success rate</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interview Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.interviewRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats.interviewRate > 0 ? (
              <span className="text-green-500 text-sm font-medium">+1% from last week</span>
            ) : (
              <span className="text-gray-500 text-sm">Keep applying to increase interview chances</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeJobs}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 112 2v6a2 2 0 11-2 2v-2M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-6a2 2 0 00-2-2H10a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats.activeJobs > 0 ? (
              <span className="text-blue-500 text-sm font-medium">{stats.savedJobs} saved</span>
            ) : (
              <span className="text-gray-500 text-sm">Browse jobs to see available positions</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'application' ? 'bg-blue-100' :
                        activity.type === 'interview' ? 'bg-purple-100' :
                        activity.type === 'response' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {activity.type === 'application' && (
                          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {activity.type === 'interview' && (
                          <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        )}
                        {activity.type === 'response' && (
                          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type === 'application' ? 'Applied to' :
                           activity.type === 'interview' ? 'Interview scheduled at' :
                           activity.type === 'response' ? 'Response from' : 'Saved job at'} {activity.company}
                        </p>
                        <p className="text-sm text-gray-600">{activity.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          activity.status === 'success' ? 'bg-green-100 text-green-800' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-600 mb-6">Start your job search journey by finding and applying to your first job!</p>
                  <button
                    onClick={handleFindNewJobs}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Find Your First Job
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & AI Mentor */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleFindNewJobs}
                className="w-full flex items-center space-x-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-blue-600 rounded-lg">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 112 2v6a2 2 0 11-2 2v-2M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-6a2 2 0 00-2-2H10a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Find New Jobs</p>
                  <p className="text-sm text-gray-600">Browse latest opportunities</p>
                </div>
              </button>

              <button
                onClick={handleAICareerChat}
                className="w-full flex items-center space-x-3 p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-purple-600 rounded-lg">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI Career Chat</p>
                  <p className="text-sm text-gray-600">Get personalized advice</p>
                </div>
              </button>

              <button
                onClick={handleUpdateResume}
                className="w-full flex items-center space-x-3 p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-green-600 rounded-lg">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Update Resume</p>
                  <p className="text-sm text-gray-600">Optimize for new roles</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/portals')}
                className="w-full flex items-center space-x-3 p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-orange-600 rounded-lg">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Connect Portals</p>
                  <p className="text-sm text-gray-600">Link LinkedIn, Indeed & more</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/questionnaire')}
                className="w-full flex items-center space-x-3 p-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m5-2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5 2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Answer Questions</p>
                  <p className="text-sm text-gray-600">AI-generated job questions</p>
                </div>
              </button>
            </div>
          </div>

          {/* AI Mentor Preview */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">�</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Professor Hoot</h3>
              <p className="text-sm text-gray-600 mb-4">
                "Hoot hoot! 🦉 I'm analyzing your profile and the job market. Let's craft a strategic approach to land your dream role!"
              </p>
              <button
                onClick={handleAICareerChat}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors duration-200"
              >
                Chat with Professor Hoot
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
