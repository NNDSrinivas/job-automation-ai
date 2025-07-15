import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface JobPortal {
  id: string;
  name: string;
  description: string;
  features: string[];
  connected: boolean;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  logo: string;
  stats?: {
    applicationsToday: number;
    totalApplications: number;
    responseRate: number;
    lastActivity: string;
  };
  credentials?: {
    username: string;
    hasPassword: boolean;
    lastUpdated: string;
  };
}

const JobPortalsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'automation'>('overview');
  const [portals, setPortals] = useState<JobPortal[]>([
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Professional networking platform with premium job opportunities',
      features: ['Premium job access', 'Networking opportunities', 'Company insights', 'Direct recruiter contact'],
      connected: false,
      status: 'disconnected',
      logo: '💼',
      stats: { applicationsToday: 0, totalApplications: 0, responseRate: 0, lastActivity: 'Never' }
    },
    {
      id: 'indeed',
      name: 'Indeed',
      description: 'World\'s largest job search engine with millions of opportunities',
      features: ['Largest job database', 'Easy apply options', 'Company reviews', 'Salary insights'],
      connected: true,
      status: 'connected',
      logo: '🔍',
      stats: { applicationsToday: 3, totalApplications: 47, responseRate: 12.8, lastActivity: '2 hours ago' },
      credentials: { username: 'user@example.com', hasPassword: true, lastUpdated: '2 days ago' }
    },
    {
      id: 'dice',
      name: 'Dice',
      description: 'Tech-focused job board for IT and engineering professionals',
      features: ['Tech-focused roles', 'High salary positions', 'Contract opportunities', 'Skill matching'],
      connected: false,
      status: 'disconnected',
      logo: '🎲',
      stats: { applicationsToday: 0, totalApplications: 0, responseRate: 0, lastActivity: 'Never' }
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      description: 'Jobs with company reviews, salaries, and interview insights',
      features: ['Company reviews', 'Salary data', 'Interview insights', 'Culture ratings'],
      connected: false,
      status: 'disconnected',
      logo: '🏢',
      stats: { applicationsToday: 0, totalApplications: 0, responseRate: 0, lastActivity: 'Never' }
    },
    {
      id: 'ziprecruiter',
      name: 'ZipRecruiter',
      description: 'AI-powered job matching and instant applications',
      features: ['AI job matching', 'One-click apply', 'Recruiter connections', 'Mobile optimized'],
      connected: false,
      status: 'disconnected',
      logo: '📮',
      stats: { applicationsToday: 0, totalApplications: 0, responseRate: 0, lastActivity: 'Never' }
    }
  ]);

  const [selectedPortal, setSelectedPortal] = useState<JobPortal | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [automationSettings, setAutomationSettings] = useState({
    autoApplyEnabled: true,
    maxApplicationsPerDay: 10,
    workingHours: { start: '09:00', end: '17:00' },
    enableWeekends: false,
    pauseAfterApplications: 5
  });

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      // Fetch user's connected portals from backend
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:8000/job-portal-credentials', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update portals with real data from backend
        setPortals(prevPortals =>
          prevPortals.map(portal => {
            const connected = data.some((cred: any) => cred.platform === portal.id);
            return {
              ...portal,
              connected,
              status: connected ? 'connected' : 'disconnected'
            };
          })
        );
      }
    } catch (error) {
      console.error('Failed to fetch portal data:', error);
    }
  };

  const handleConnect = async (portal: JobPortal) => {
    setSelectedPortal(portal);
    setShowCredentialsModal(true);
  };

  const handleDisconnect = async (portalId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/job-portal-credentials/${portalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPortals(portals.map(portal =>
          portal.id === portalId
            ? { ...portal, connected: false, status: 'disconnected', credentials: undefined }
            : portal
        ));
      }
    } catch (error) {
      console.error('Failed to disconnect portal:', error);
    }
  };

  const connectedPortals = portals.filter(p => p.connected);
  const totalApplicationsToday = connectedPortals.reduce((sum, p) => sum + (p.stats?.applicationsToday || 0), 0);
  const totalApplicationsOverall = connectedPortals.reduce((sum, p) => sum + (p.stats?.totalApplications || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🌐 Job Portal Integrations</h1>
              <p className="text-gray-600 mt-1">Connect with top job platforms and let AI handle your applications 24/7</p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{connectedPortals.length}</div>
                <div className="text-gray-500">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalApplicationsToday}</div>
                <div className="text-gray-500">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalApplicationsOverall}</div>
                <div className="text-gray-500">Total Apps</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Portal Overview', icon: '🏢' },
              { id: 'credentials', label: 'Manage Credentials', icon: '🔐' },
              { id: 'automation', label: 'Automation Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {portals.map((portal) => (
              <div key={portal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {/* Portal Header */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{portal.logo}</div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{portal.name}</h3>
                        <p className="text-sm text-gray-600">{portal.description}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      portal.status === 'connected' ? 'bg-green-500' :
                      portal.status === 'connecting' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}></div>
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    portal.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {portal.connected ? '✅ Connected & Active' : '⚪ Not Connected'}
                  </div>
                </div>

                {/* Stats Section (only for connected portals) */}
                {portal.connected && portal.stats && (
                  <div className="px-6 py-4 bg-blue-50 border-b">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{portal.stats.applicationsToday}</div>
                        <div className="text-xs text-gray-600">Today</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{portal.stats.totalApplications}</div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-sm text-gray-600">
                        {portal.stats.responseRate}% response rate • Last activity: {portal.stats.lastActivity}
                      </div>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Key Features:</h4>
                  <ul className="space-y-2">
                    {portal.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-3">
                    {portal.connected ? (
                      <>
                        <button
                          onClick={() => handleDisconnect(portal.id)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                        >
                          🔌 Disconnect
                        </button>
                        <button
                          onClick={() => setSelectedPortal(portal)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                        >
                          ⚙️ Settings
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(portal)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                      >
                        🔗 Connect Portal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 Manage Portal Credentials</h3>
              <p className="text-gray-600 mb-6">Your credentials are encrypted and stored securely. We only use them for automated job applications.</p>

              <div className="space-y-4">
                {portals.filter(p => p.connected).map((portal) => (
                  <div key={portal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{portal.logo}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{portal.name}</h4>
                        <p className="text-sm text-gray-600">
                          Username: {portal.credentials?.username} •
                          Password: {'•'.repeat(8)} •
                          Updated: {portal.credentials?.lastUpdated}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConnect(portal)}
                      className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Update Credentials
                    </button>
                  </div>
                ))}
              </div>

              {portals.filter(p => p.connected).length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🔐</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Connected Portals</h3>
                  <p className="text-gray-600">Connect to job portals first to manage credentials</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 24/7 Automation Settings</h3>
              <p className="text-gray-600 mb-6">Configure how AI applies to jobs automatically without your intervention</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Auto Apply Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Application Limits</h4>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Enable Auto Apply</label>
                    <button
                      onClick={() => setAutomationSettings({...automationSettings, autoApplyEnabled: !automationSettings.autoApplyEnabled})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        automationSettings.autoApplyEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        automationSettings.autoApplyEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div>
                    <label className="text-sm text-gray-700">Max applications per day</label>
                    <input
                      type="number"
                      value={automationSettings.maxApplicationsPerDay}
                      onChange={(e) => setAutomationSettings({...automationSettings, maxApplicationsPerDay: parseInt(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>

                {/* Schedule Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Schedule</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-700">Start time</label>
                      <input
                        type="time"
                        value={automationSettings.workingHours.start}
                        onChange={(e) => setAutomationSettings({
                          ...automationSettings,
                          workingHours: {...automationSettings.workingHours, start: e.target.value}
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">End time</label>
                      <input
                        type="time"
                        value={automationSettings.workingHours.end}
                        onChange={(e) => setAutomationSettings({
                          ...automationSettings,
                          workingHours: {...automationSettings.workingHours, end: e.target.value}
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Apply on weekends</label>
                    <button
                      onClick={() => setAutomationSettings({...automationSettings, enableWeekends: !automationSettings.enableWeekends})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        automationSettings.enableWeekends ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        automationSettings.enableWeekends ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Save Automation Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credentials Modal */}
      {showCredentialsModal && selectedPortal && (
        <CredentialsModal
          portal={selectedPortal}
          onClose={() => setShowCredentialsModal(false)}
          onSave={() => {
            setShowCredentialsModal(false);
            fetchPortalData();
          }}
        />
      )}
    </div>
  );
};

// Credentials Modal Component
const CredentialsModal: React.FC<{
  portal: JobPortal;
  onClose: () => void;
  onSave: () => void;
}> = ({ portal, onClose, onSave }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/job-portal-credentials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: portal.id,
          username: credentials.username,
          password: credentials.password,
          email: credentials.email
        }),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Connect to {portal.name} {portal.logo}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Enter your {portal.name} credentials to enable automated job applications.
            Your credentials are encrypted and stored securely.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email/Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-yellow-400 mr-3">⚠️</div>
              <div className="text-sm text-yellow-800">
                <strong>Security Note:</strong> Your credentials are encrypted using industry-standard encryption.
                We recommend using application-specific passwords when available.
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !credentials.username || !credentials.password}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Connect Portal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPortalsPage;
