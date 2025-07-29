import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

interface JobPortal {
  id: string;
  name: string;
  logo: string;
  isConnected: boolean;
  username?: string;
  lastSync?: string;
  jobCount?: number;
  description: string;
}

const AutoApplyPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [portals, setPortals] = useState<JobPortal[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<JobPortal | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  const [settings, setSettings] = useState({
    maxApplicationsPerDay: 10,
    autoApplyEnabled: false,
    matchThreshold: 80,
    preferredJobTypes: ['Full-time', 'Remote'],
    blacklistedCompanies: [] as string[],
    preferredLocations: ['Remote', 'San Francisco', 'New York'],
    salaryMinimum: 80000,
    applyToNewJobs: true,
    customCoverLetter: true
  });

  // Initialize portals
  useEffect(() => {
    const jobPortals: JobPortal[] = [
      { 
        id: '1', 
        name: 'LinkedIn', 
        logo: '💼', 
        isConnected: false, 
        jobCount: 150,
        description: 'Professional network with premium job listings and recruiter contacts'
      },
      { 
        id: '2', 
        name: 'Indeed', 
        logo: '🔍', 
        isConnected: false, 
        jobCount: 289,
        description: 'World\'s largest job board with millions of opportunities'
      },
      { 
        id: '3', 
        name: 'Glassdoor', 
        logo: '🏢', 
        isConnected: false, 
        jobCount: 167,
        description: 'Company insights, salary data, and insider job information'
      },
      { 
        id: '4', 
        name: 'AngelList', 
        logo: '🚀', 
        isConnected: false, 
        jobCount: 78,
        description: 'Startup jobs and equity opportunities in tech companies'
      },
      { 
        id: '5', 
        name: 'Stack Overflow', 
        logo: '📚', 
        isConnected: false, 
        jobCount: 45,
        description: 'Developer-focused job board for technical positions'
      },
      { 
        id: '6', 
        name: 'ZipRecruiter', 
        logo: '⚡', 
        isConnected: false, 
        jobCount: 112,
        description: 'Fast hiring platform with AI-powered job matching'
      }
    ];
    setPortals(jobPortals);
  }, []);

  const toggleAutomation = () => {
    if (!isAutomationRunning) {
      // Check if any portals are connected
      const connectedPortals = portals.filter(p => p.isConnected);
      if (connectedPortals.length === 0) {
        showError('No portals connected', 'Please connect at least one job portal to start automation');
        return;
      }
      
      showSuccess('Auto-apply started!', `Monitoring ${connectedPortals.length} platforms for new opportunities`);
    } else {
      showInfo('Auto-apply stopped', 'Job application automation has been paused');
    }
    
    setIsAutomationRunning(!isAutomationRunning);
  };

  const handlePortalConnect = (portal: JobPortal) => {
    setSelectedPortal(portal);
    setShowConnectModal(true);
    setCredentials({ username: '', password: '' });
  };

  const handlePortalDisconnect = async (portalId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPortals(prev => prev.map(portal => 
        portal.id === portalId 
          ? { ...portal, isConnected: false, username: undefined, lastSync: undefined }
          : portal
      ));
      
      showSuccess('Portal disconnected', 'Your credentials have been removed securely');
    } catch (error) {
      console.error('Failed to disconnect portal:', error);
      showError('Failed to disconnect portal', 'Please try again later');
    }
  };

  const handleCredentialSubmit = async () => {
    if (!selectedPortal) return;

    try {
      // Simulate API call for credential verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPortals(prev => prev.map(portal => 
        portal.id === selectedPortal.id 
          ? { 
              ...portal, 
              isConnected: true, 
              username: credentials.username,
              lastSync: new Date().toISOString()
            }
          : portal
      ));
      
      setShowConnectModal(false);
      showSuccess(`${selectedPortal.name} connected!`, 'Your account has been linked successfully');
    } catch (error) {
      console.error('Failed to connect portal:', error);
      showError('Connection failed', 'Please check your credentials and try again');
    }
  };

  const connectedPortals = portals.filter(p => p.isConnected);
  const totalJobs = connectedPortals.reduce((sum, portal) => sum + (portal.jobCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Auto Apply</h1>
            <p className="text-gray-600 mt-2">Automate your job applications with AI-powered matching</p>
          </div>

          {/* Status Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${isAutomationRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-semibold ${isAutomationRunning ? 'text-green-600' : 'text-gray-500'}`}>
                    {isAutomationRunning ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Connected Portals</p>
                  <p className="font-semibold text-gray-900">{connectedPortals.length} / {portals.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Available Jobs</p>
                  <p className="font-semibold text-gray-900">{totalJobs.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Applied Today</p>
                  <p className="font-semibold text-gray-900">12</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Job Portals */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Job Portals</h2>
                  <p className="text-sm text-gray-600 mt-1">Connect your accounts to start automated job applications</p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portals.map(portal => (
                      <div key={portal.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{portal.logo}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900">{portal.name}</h3>
                              <p className="text-xs text-gray-500 mt-1">{portal.description}</p>
                              {portal.username && (
                                <p className="text-sm text-blue-600 mt-1">Connected as {portal.username}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              portal.isConnected
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {portal.isConnected ? 'Connected' : 'Not Connected'}
                            </span>
                            {portal.jobCount && (
                              <p className="text-xs text-gray-500 mt-1">{portal.jobCount} jobs</p>
                            )}
                          </div>
                        </div>

                        {portal.lastSync && (
                          <p className="text-xs text-gray-500 mt-3">
                            Last sync: {new Date(portal.lastSync).toLocaleDateString()}
                          </p>
                        )}

                        <div className="mt-4">
                          {portal.isConnected ? (
                            <button
                              onClick={() => handlePortalDisconnect(portal.id)}
                              className="w-full px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Disconnect
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePortalConnect(portal)}
                              className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="space-y-6">
              {/* Main Control */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Control</h3>
                
                <button
                  onClick={toggleAutomation}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors duration-200 ${
                    isAutomationRunning
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isAutomationRunning ? '⏸️ Stop Auto Apply' : '▶️ Start Auto Apply'}
                </button>

                {isAutomationRunning && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      🤖 AI is actively monitoring {connectedPortals.length} platform(s) for matching opportunities
                    </p>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Applications Per Day
                    </label>
                    <input
                      type="number"
                      value={settings.maxApplicationsPerDay}
                      onChange={(e) => setSettings({...settings, maxApplicationsPerDay: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Match Threshold: {settings.matchThreshold}%
                    </label>
                    <input
                      type="range"
                      min="60"
                      max="100"
                      value={settings.matchThreshold}
                      onChange={(e) => setSettings({...settings, matchThreshold: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>60%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Salary ($)
                    </label>
                    <input
                      type="number"
                      value={settings.salaryMinimum}
                      onChange={(e) => setSettings({...settings, salaryMinimum: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="5000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.applyToNewJobs}
                        onChange={(e) => setSettings({...settings, applyToNewJobs: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Apply to new jobs automatically</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.customCoverLetter}
                        onChange={(e) => setSettings({...settings, customCoverLetter: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Generate custom cover letters</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-700">Applications today</span>
                    <span className="font-semibold text-blue-600">12</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">Response rate</span>
                    <span className="font-semibold text-green-600">18%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm text-gray-700">Jobs screened</span>
                    <span className="font-semibold text-purple-600">247</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Portal Modal */}
      {showConnectModal && selectedPortal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selectedPortal.logo}</span>
              <div>
                <h3 className="text-lg font-semibold">Connect {selectedPortal.name}</h3>
                <p className="text-sm text-gray-600">{selectedPortal.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username/Email
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username or email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Secure Connection</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Your credentials are encrypted and used only for automated job applications. We never store passwords in plain text.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCredentialSubmit}
                disabled={!credentials.username || !credentials.password}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoApplyPage;
