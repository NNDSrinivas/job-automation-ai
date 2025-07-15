import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

interface JobApplication {
  id: string;
  title: string;
  company: string;
  status: 'applied' | 'viewed' | 'interview' | 'rejected' | 'offer';
  appliedDate: string;
  platform: string;
  location: string;
  salary?: string;
  jobType: string;
  matchScore: number;
}

interface PortalStats {
  totalApplications: number;
  successRate: number;
  averageMatchScore: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  lastActivity: string;
}

const PortalDashboard: React.FC = () => {
  const { portalName } = useParams<{ portalName: string }>();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('7d');
  const [statusFilter, setStatusFilter] = useState('all');

  const portalConfig = {
    linkedin: { name: 'LinkedIn', icon: '💼', color: 'blue' },
    indeed: { name: 'Indeed', icon: '🔍', color: 'green' },
    dice: { name: 'Dice', icon: '🎲', color: 'purple' },
    glassdoor: { name: 'Glassdoor', icon: '🏢', color: 'orange' },
    remoteok: { name: 'RemoteOK', icon: '🌍', color: 'cyan' },
    angellist: { name: 'AngelList', icon: '👼', color: 'pink' }
  };

  const currentPortal = portalConfig[portalName as keyof typeof portalConfig] ||
    { name: portalName, icon: '🔗', color: 'gray' };

  useEffect(() => {
    loadPortalData();
  }, [portalName, timeFilter]);

  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [applicationsRes, statsRes] = await Promise.all([
        fetch(`/api/applications/${portalName}?timeframe=${timeFilter}&status=${statusFilter}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/analytics/${portalName}/stats?timeframe=${timeFilter}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (applicationsRes.ok && statsRes.ok) {
        const applicationsData = await applicationsRes.json();
        const statsData = await statsRes.json();

        setApplications(applicationsData.applications || []);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load portal data:', error);
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'offer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return '📧';
      case 'viewed': return '👀';
      case 'interview': return '🎯';
      case 'rejected': return '❌';
      case 'offer': return '🎉';
      default: return '⚪';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading portal data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-4xl">{currentPortal.icon}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentPortal.name} Dashboard</h1>
              <p className="text-gray-600">Job application analytics and tracking</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="applied">Applied</option>
              <option value="viewed">Viewed</option>
              <option value="interview">Interview</option>
              <option value="rejected">Rejected</option>
              <option value="offer">Offer</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
                </div>
                <div className="text-2xl">💬</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interview Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.interviewRate}%</p>
                </div>
                <div className="text-2xl">🎯</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Match Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageMatchScore}%</p>
                </div>
                <div className="text-2xl">🎯</div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
            <p className="text-sm text-gray-600">Track your job applications and their current status</p>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">Applications will appear here once the automation starts working.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((application, index) => (
                    <motion.tr
                      key={application.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{application.title}</div>
                          <div className="text-sm text-gray-500">{application.company}</div>
                          <div className="text-xs text-gray-400">{application.location}</div>
                          {application.salary && (
                            <div className="text-xs text-green-600">{application.salary}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)} {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(application.appliedDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${application.matchScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{application.matchScore}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                          View Details
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          Track Status
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              🔄 Refresh Applications
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              ▶️ Resume Automation
            </button>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
              ⏸️ Pause Automation
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              📊 Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
