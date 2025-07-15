import React, { useState, useEffect } from 'react';
import { JobService } from '../services/jobService';
import { AutomationService } from '../services/automationService';
import { ResumeService } from '../services/resumeService';

interface DashboardStats {
  totalApplications: number;
  responseRate: number;
  interviewRate: number;
  activeJobs: number;
  savedJobs: number;
  resumesUploaded: number;
}

const ProfessionalDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    responseRate: 0,
    interviewRate: 0,
    activeJobs: 0,
    savedJobs: 0,
    resumesUploaded: 0
  });
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load demo data for now
      setStats({
        totalApplications: 247,
        responseRate: 18.5,
        interviewRate: 7.2,
        activeJobs: 1240,
        savedJobs: 23,
        resumesUploaded: 3
      });

      setAutomationStatus({
        is_running: false,
        next_scheduled_run: '2024-07-14T09:00:00Z',
        last_run: {
          completed_at: '2024-07-13T15:30:00Z',
          jobs_processed: 45,
          applications_sent: 12,
          success_rate: 89.2
        }
      });

      setRecentJobs([
        {
          id: '1',
          title: 'Senior Software Engineer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          match_score: 95,
          posted_date: '2024-07-13',
          status: 'applied'
        },
        {
          id: '2',
          title: 'Full Stack Developer',
          company: 'StartupXYZ',
          location: 'Remote',
          match_score: 88,
          posted_date: '2024-07-13',
          status: 'saved'
        },
        {
          id: '3',
          title: 'Product Manager',
          company: 'BigTech Inc',
          location: 'Seattle, WA',
          match_score: 82,
          posted_date: '2024-07-12',
          status: 'interview'
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, subtitle, trend }: {
    icon: string;
    title: string;
    value: string | number;
    subtitle: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <div className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→'}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );

  const JobCard = ({ job }: { job: any }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
          <p className="text-gray-600">{job.company}</p>
          <p className="text-sm text-gray-500">{job.location}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full mb-2">
            {job.match_score}% match
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${
            job.status === 'applied' ? 'bg-blue-100 text-blue-800' :
            job.status === 'interview' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {job.status}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Posted {new Date(job.posted_date).toLocaleDateString()}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your job search overview.</p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg">
                🚀 Start Automation
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            icon="📝"
            title="Total Applications"
            value={stats.totalApplications}
            subtitle="This month"
            trend="up"
          />
          <StatCard
            icon="📈"
            title="Response Rate"
            value={`${stats.responseRate}%`}
            subtitle="Above average"
            trend="up"
          />
          <StatCard
            icon="🎯"
            title="Interview Rate"
            value={`${stats.interviewRate}%`}
            subtitle="Industry leading"
            trend="up"
          />
          <StatCard
            icon="💼"
            title="Active Jobs"
            value={stats.activeJobs.toLocaleString()}
            subtitle="Available positions"
            trend="neutral"
          />
          <StatCard
            icon="⭐"
            title="Saved Jobs"
            value={stats.savedJobs}
            subtitle="Ready to apply"
            trend="neutral"
          />
          <StatCard
            icon="📄"
            title="Resumes"
            value={stats.resumesUploaded}
            subtitle="Uploaded & optimized"
            trend="neutral"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Automation Status */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 Automation Status</h2>

              {automationStatus && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Current Status</div>
                      <div className="text-sm text-gray-600">
                        {automationStatus.is_running ? '🟢 Running' : '🟡 Scheduled'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">Next Run</div>
                      <div className="text-sm text-gray-600">
                        {new Date(automationStatus.next_scheduled_run).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {automationStatus.last_run && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-medium text-green-900 mb-2">Last Run Results</div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-green-700 font-medium">{automationStatus.last_run.jobs_processed}</div>
                          <div className="text-green-600">Jobs Processed</div>
                        </div>
                        <div>
                          <div className="text-green-700 font-medium">{automationStatus.last_run.applications_sent}</div>
                          <div className="text-green-600">Applications Sent</div>
                        </div>
                        <div>
                          <div className="text-green-700 font-medium">{automationStatus.last_run.success_rate}%</div>
                          <div className="text-green-600">Success Rate</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Job Matches */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Recent Job Matches</h2>
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
              <div className="mt-4 text-center">
                <button className="text-purple-600 hover:text-purple-800 font-medium">
                  View All Jobs →
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-200">
                  <div className="font-medium text-gray-900">📄 Upload Resume</div>
                  <div className="text-sm text-gray-600">Add a new resume version</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-200">
                  <div className="font-medium text-gray-900">🔍 Search Jobs</div>
                  <div className="text-sm text-gray-600">Find new opportunities</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-200">
                  <div className="font-medium text-gray-900">✉️ Generate Cover Letter</div>
                  <div className="text-sm text-gray-600">AI-powered personalization</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-200">
                  <div className="font-medium text-gray-900">📊 View Analytics</div>
                  <div className="text-sm text-gray-600">Track your progress</div>
                </button>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">🧠 AI Insights</h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="font-medium">Top Skill in Demand</div>
                  <div className="text-sm opacity-90">React.js - 89% of job matches</div>
                </div>
                <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="font-medium">Best Time to Apply</div>
                  <div className="text-sm opacity-90">Tuesday 9-11 AM</div>
                </div>
                <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="font-medium">Resume Optimization</div>
                  <div className="text-sm opacity-90">+23% match with keywords</div>
                </div>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Progress Tracker</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Profile Completeness</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Monthly Goal</span>
                    <span>78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
