// Enhanced Analytics Dashboard Component
// This component provides comprehensive analytics with real-time updates

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';

interface AnalyticsData {
  user_metrics: {
    total_applications: number;
    successful_applications: number;
    pending_applications: number;
    failed_applications: number;
    success_rate: number;
    avg_response_time: number;
  };
  top_platforms: Array<{ platform: string; count: number; success_rate: number }>;
  top_companies: Array<{ company: string; applications: number; success_rate: number }>;
  skill_demand: Record<string, number>;
  salary_insights: Record<string, any>;
  market_trends: any;
  profile_completion: {
    completion_percentage: number;
    missing_by_category: Record<string, string[]>;
    complete: boolean;
  };
  period_days: number;
  generated_at: string;
}

interface TaskStatus {
  task_id: string;
  status: string;
  progress: number;
  started_at: string;
  type: string;
  result: any;
}

const EnhancedAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activeTasks, setActiveTasks] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!user?.id) return;

    const wsUrl = `ws://localhost:8000/ws/${user.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      toast.success('Real-time updates connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWebsocket(ws);

    return () => {
      ws.close();
    };
  }, [user?.id]);

  const handleWebSocketMessage = (message: any) => {
    setRealTimeUpdates(prev => [{
      ...message,
      id: Date.now() + Math.random()
    }, ...prev.slice(0, 19)]); // Keep last 20 updates

    switch (message.type) {
      case 'analytics_update':
        setAnalytics(message.data);
        break;
      case 'job_search_progress':
        toast.info(`Job search: ${message.status} - ${message.progress}%`);
        break;
      case 'application_progress':
        toast.info(`Application: ${message.status} - ${message.message}`);
        break;
      case 'application_complete':
        if (message.success) {
          toast.success(`Successfully applied to ${message.job_id}`);
        } else {
          toast.error(`Application failed: ${message.message}`);
        }
        break;
      case 'task_status_update':
        setActiveTasks(prev =>
          prev.map(task =>
            task.task_id === message.task_id
              ? { ...task, status: message.status, progress: message.progress || task.progress }
              : task
          )
        );
        break;
      case 'error':
        toast.error(`Error: ${message.error}`);
        break;
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    fetchAnalytics();
    fetchActiveTasks();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTasks = async () => {
    try {
      const response = await axiosInstance.get('/tasks/monitor');
      setActiveTasks(response.data.active_tasks || []);
    } catch (error) {
      console.error('Error fetching active tasks:', error);
    }
  };

  const refreshAnalytics = () => {
    fetchAnalytics();
    fetchActiveTasks();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Analytics Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Real-time connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={refreshAnalytics}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Profile Completion Alert */}
        {analytics?.profile_completion && !analytics.profile_completion.complete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Profile {analytics.profile_completion.completion_percentage}% Complete
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Complete your profile to improve application success rates.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.user_metrics.total_applications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.user_metrics.success_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.user_metrics.avg_response_time.toFixed(1)} days</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{activeTasks.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Tasks */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Tasks</h2>
            {activeTasks.length === 0 ? (
              <p className="text-gray-500">No active tasks</p>
            ) : (
              <div className="space-y-4">
                {activeTasks.map(task => (
                  <div key={task.task_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{task.type || 'Unknown Task'}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                        task.status === 'FAILURE' ? 'bg-red-100 text-red-800' :
                        task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Started: {new Date(task.started_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-time Updates */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Real-time Updates</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {realTimeUpdates.length === 0 ? (
                <p className="text-gray-500">No recent updates</p>
              ) : (
                realTimeUpdates.map(update => (
                  <div key={update.id} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{update.type.replace('_', ' ').toUpperCase()}</span>
                      <span className="text-gray-500">{new Date(update.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {update.message && (
                      <p className="text-gray-600 mt-1">{update.message}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Platforms */}
          {analytics?.top_platforms && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top Platforms</h2>
              <div className="space-y-4">
                {analytics.top_platforms.slice(0, 5).map((platform, index) => (
                  <div key={platform.platform} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{platform.platform}</p>
                        <p className="text-sm text-gray-500">{platform.count} applications</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{platform.success_rate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Demand */}
          {analytics?.skill_demand && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">In-Demand Skills</h2>
              <div className="space-y-3">
                {Object.entries(analytics.skill_demand)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 8)
                  .map(([skill, demand]) => (
                    <div key={skill} className="flex items-center justify-between">
                      <span className="text-gray-900 capitalize">{skill}</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (demand as number) * 10)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{demand}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;
