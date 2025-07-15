import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  platform: string;
  salary?: string;
  jobType?: string;
  postedDate?: string;
  matchScore?: number;
  isBookmarked?: boolean;
}

interface JobPortal {
  id: string;
  name: string;
  logo: string;
  isConnected: boolean;
  username?: string;
  lastSync?: string;
  jobCount?: number;
}

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [portals, setPortals] = useState<JobPortal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeywords, setSearchKeywords] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<JobPortal | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);

  // Available job portals
  const availablePortals: JobPortal[] = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      logo: '💼',
      isConnected: false,
      jobCount: 0
    },
    {
      id: 'indeed',
      name: 'Indeed',
      logo: '🔍',
      isConnected: false,
      jobCount: 0
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      logo: '🏢',
      isConnected: false,
      jobCount: 0
    },
    {
      id: 'dice',
      name: 'Dice',
      logo: '🎲',
      isConnected: false,
      jobCount: 0
    },
    {
      id: 'remoteok',
      name: 'Remote OK',
      logo: '🌍',
      isConnected: false,
      jobCount: 0
    }
  ];

  useEffect(() => {
    fetchConnectedPortals();
    fetchJobs();
  }, []);

  const fetchConnectedPortals = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/job-portal-credentials', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const credentials = await response.json();
        const updatedPortals = availablePortals.map(portal => {
          const credential = credentials.find((c: any) => c.platform === portal.id);
          return {
            ...portal,
            isConnected: !!credential,
            username: credential?.username,
            lastSync: credential?.last_used
          };
        });
        setPortals(updatedPortals);
      }
    } catch (error) {
      console.error('Failed to fetch connected portals:', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();

      if (searchKeywords) params.append('keywords', searchKeywords);
      if (selectedLocation) params.append('location', selectedLocation);
      if (selectedPortals.length > 0) {
        selectedPortals.forEach(portal => params.append('platform', portal));
      }

      const response = await fetch(`http://localhost:8000/jobs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        if (data.jobs?.length > 0) {
          showInfo(`Found ${data.jobs.length} relevant jobs`, 'Jobs have been automatically matched to your resume');
        }
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      showError('Failed to load jobs', 'Please try again or check your connection');
    } finally {
      setLoading(false);
    }
  };

  const connectPortal = async (portal: JobPortal) => {
    setSelectedPortal(portal);
    setShowConnectModal(true);
  };

  const handlePortalConnection = async () => {
    if (!selectedPortal || !credentials.username || !credentials.password) {
      showError('Missing credentials', 'Please enter both username and password');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/job-portal-credentials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPortal.id,
          username: credentials.username,
          password: credentials.password,
          additional_data: {}
        }),
      });

      if (response.ok) {
        showSuccess(`${selectedPortal.name} connected successfully!`, 'You can now view and apply to jobs from this portal');
        setShowConnectModal(false);
        setCredentials({ username: '', password: '' });
        fetchConnectedPortals();
        fetchJobs(); // Refresh jobs with new portal
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Failed to connect portal:', error);
      showError('Connection failed', 'Please check your credentials and try again');
    }
  };

  const applyToJob = async (job: Job) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/jobs/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.id,
          resume_path: null, // Will use primary resume
          cover_letter: null, // AI will generate
          skills: []
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Application submitted!', `Applied to ${job.title} at ${job.company} via ${job.platform}`);
      } else {
        throw new Error('Application failed');
      }
    } catch (error) {
      console.error('Failed to apply to job:', error);
      showError('Application failed', 'Please try again or apply manually');
    }
  };

  const startAutoApply = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/start-automation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setAutoApplyEnabled(true);
        showSuccess('🤖 AI Auto-Apply Started!', 'Our AI bot will automatically apply to matching jobs across all connected portals');
      } else {
        throw new Error('Failed to start auto-apply');
      }
    } catch (error) {
      console.error('Failed to start auto-apply:', error);
      showError('Auto-apply failed', 'Please check your settings and try again');
    }
  };

  const stopAutoApply = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/stop-automation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setAutoApplyEnabled(false);
        showInfo('Auto-apply stopped', 'AI bot has been paused. You can restart it anytime');
      }
    } catch (error) {
      console.error('Failed to stop auto-apply:', error);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPlatformBadgeColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      linkedin: 'bg-blue-100 text-blue-800',
      indeed: 'bg-green-100 text-green-800',
      glassdoor: 'bg-purple-100 text-purple-800',
      dice: 'bg-orange-100 text-orange-800',
      remoteok: 'bg-indigo-100 text-indigo-800'
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
            <p className="text-gray-600">Find and apply to jobs across all major platforms</p>
          </div>

          {/* Auto Apply Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">🤖 AI Auto-Apply</span>
              <button
                onClick={autoApplyEnabled ? stopAutoApply : startAutoApply}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoApplyEnabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoApplyEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Portal Connection Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Job Portals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {portals.map((portal) => (
              <div
                key={portal.id}
                className={`p-4 border rounded-lg transition-colors ${
                  portal.isConnected
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{portal.logo}</div>
                  <h3 className="font-medium text-gray-900">{portal.name}</h3>
                  {portal.isConnected ? (
                    <div className="mt-2">
                      <span className="text-sm text-green-600 font-medium">✓ Connected</span>
                      <p className="text-xs text-gray-500 mt-1">@{portal.username}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => connectPortal(portal)}
                      className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <input
                type="text"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="e.g., Software Engineer, React, Python"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                placeholder="e.g., San Francisco, Remote"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchJobs}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No jobs found. Try connecting more portals or adjusting your search criteria.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <div className="flex items-center space-x-2">
                        {/* Platform Badge */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlatformBadgeColor(job.platform)}`}>
                          {job.platform.toUpperCase()}
                        </span>
                        {/* Match Score */}
                        {job.matchScore && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMatchScoreColor(job.matchScore)}`}>
                            {job.matchScore}% Match
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-lg text-gray-700 mb-2">{job.company}</p>
                    <p className="text-gray-600 mb-2">📍 {job.location}</p>

                    {job.salary && (
                      <p className="text-green-600 font-medium mb-2">💰 {job.salary}</p>
                    )}

                    <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {job.jobType && <span>📋 {job.jobType}</span>}
                        {job.postedDate && <span>📅 {job.postedDate}</span>}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(job.url, '_blank')}
                          className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          View Job
                        </button>
                        <button
                          onClick={() => applyToJob(job)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Quick Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Connect Portal Modal */}
        {showConnectModal && selectedPortal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">
                Connect to {selectedPortal.name} {selectedPortal.logo}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username/Email</label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">
                    🔒 Your credentials are encrypted and stored securely. We only use them to apply for jobs on your behalf.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setCredentials({ username: '', password: '' });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePortalConnection}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
