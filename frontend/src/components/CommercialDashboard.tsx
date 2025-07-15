import React, { useState, useEffect } from 'react';

interface DashboardData {
  summary_stats: {
    total_applications: number;
    success_rate: number;
    interview_rate: number;
    response_rate: number;
    applications_this_week: number;
    avg_response_time: number;
  };
  application_trends: Array<{ date: string; count: number; success_count: number }>;
  platform_performance: Array<{
    platform: string;
    applications: number;
    success_rate: number;
    avg_response_time: number;
  }>;
  skill_demand_analysis: Array<{ skill: string; demand: number; salary_impact: number }>;
  salary_insights: {
    avg_salary: number;
    salary_range: { min: number; max: number };
    market_comparison: number;
  };
  mentor_insights: {
    animal: string;
    message: string;
    tips: string[];
    next_action: string;
  };
}

const CommercialDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Use mock data for now - this will be replaced with real API calls
      setData({
        summary_stats: {
          total_applications: 47,
          success_rate: 18.5,
          interview_rate: 12.8,
          response_rate: 34.0,
          applications_this_week: 8,
          avg_response_time: 5.2
        },
        application_trends: [],
        platform_performance: [
          { platform: 'LinkedIn', applications: 23, success_rate: 21.7, avg_response_time: 4.2 },
          { platform: 'Indeed', applications: 15, success_rate: 13.3, avg_response_time: 6.8 },
          { platform: 'Dice', applications: 9, success_rate: 22.2, avg_response_time: 3.9 }
        ],
        skill_demand_analysis: [
          { skill: 'React', demand: 9.2, salary_impact: 15000 },
          { skill: 'Python', demand: 8.8, salary_impact: 18000 },
          { skill: 'TypeScript', demand: 8.1, salary_impact: 12000 },
          { skill: 'AWS', demand: 7.9, salary_impact: 22000 },
          { skill: 'Docker', demand: 7.2, salary_impact: 8000 },
          { skill: 'Kubernetes', demand: 6.8, salary_impact: 25000 }
        ],
        salary_insights: {
          avg_salary: 125000,
          salary_range: { min: 90000, max: 160000 },
          market_comparison: 8.3
        },
        mentor_insights: {
          animal: 'Dolphin',
          message: "Great progress this week! You're maintaining a good application pace and your response rate is above average.",
          tips: [
            "Consider applying to more startups - they often have faster response times",
            "Update your LinkedIn headline to highlight your top 3 skills",
            "Follow up on applications that are over 1 week old"
          ],
          next_action: "Review and apply to 3 new positions matching your React and Python skills"
        }
      });
    } catch (err) {
      setError('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚀 Commercial Job Hunt Dashboard</h1>
              <p className="text-gray-600">AI-Powered Job Application Intelligence & Analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg">
                🤖 Start Auto-Apply AI
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mentor Bot Section */}
        {data.mentor_insights && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border-2 border-blue-200 shadow-xl">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-3xl shadow-lg animate-pulse">
                🐬
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  🌟 Your AI {data.mentor_insights.animal} Mentor:
                </h3>
                <p className="text-lg text-gray-700 mb-4 font-medium">{data.mentor_insights.message}</p>
                <div className="bg-white rounded-xl p-5 shadow-lg border border-blue-100">
                  <h4 className="font-bold text-gray-800 mb-3 text-lg">💡 Pro AI Insights:</h4>
                  <ul className="space-y-2">
                    {data.mentor_insights.tips.map((tip, index) => (
                      <li key={index} className="text-gray-600 flex items-start">
                        <span className="text-blue-600 mr-3 text-lg">🎯</span>
                        <span className="font-medium">{tip}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-bold text-blue-800">🚀 Next AI Action: </span>
                    <span className="text-sm text-blue-700 font-medium">{data.mentor_insights.next_action}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl p-6 border-l-4 border-blue-500 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-4xl font-bold text-gray-900">{data.summary_stats.total_applications}</p>
                <p className="text-sm text-green-600 mt-1">🚀 AI Powered</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-xl p-6 border-l-4 border-green-500 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-4xl font-bold text-gray-900">{data.summary_stats.success_rate.toFixed(1)}%</p>
                <p className="text-sm text-green-600 mt-1">📈 Above Average</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-xl p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interview Rate</p>
                <p className="text-4xl font-bold text-gray-900">{data.summary_stats.interview_rate.toFixed(1)}%</p>
                <p className="text-sm text-purple-600 mt-1">🎯 Targeted</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-xl p-6 border-l-4 border-yellow-500 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-4xl font-bold text-gray-900">{data.summary_stats.applications_this_week}</p>
                <p className="text-sm text-yellow-600 mt-1">🔥 Active</p>
              </div>
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              🌐 Platform Performance
            </h3>
            <div className="space-y-6">
              {data.platform_performance.map((platform, index) => (
                <div key={index} className="border-l-4 border-gradient-to-b from-blue-500 to-purple-500 pl-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-r-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-lg text-gray-800">{platform.platform}</h4>
                    <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow">
                      {platform.applications} applications
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span className="font-medium">Success Rate</span>
                        <span className="font-bold">{platform.success_rate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${Math.min(platform.success_rate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow">
                      {platform.avg_response_time.toFixed(1)} days avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Analysis */}
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              💼 In-Demand Skills
            </h3>
            <div className="space-y-4">
              {data.skill_demand_analysis.slice(0, 6).map((skill, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-800">{skill.skill}</span>
                      <span className="text-sm text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full">
                        +${skill.salary_impact.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${Math.min(skill.demand * 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Salary Insights */}
        <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-xl p-8 mb-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">💰 AI Salary Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-6 rounded-xl shadow-lg border border-blue-100">
              <p className="text-sm font-medium text-gray-600 mb-3">Average Target Salary</p>
              <p className="text-4xl font-bold text-blue-600">${data.salary_insights.avg_salary.toLocaleString()}</p>
              <p className="text-sm text-blue-500 mt-2">🎯 AI Optimized</p>
            </div>
            <div className="text-center bg-white p-6 rounded-xl shadow-lg border border-purple-100">
              <p className="text-sm font-medium text-gray-600 mb-3">Salary Range</p>
              <p className="text-xl font-semibold text-gray-900">
                ${data.salary_insights.salary_range.min.toLocaleString()} - ${data.salary_insights.salary_range.max.toLocaleString()}
              </p>
              <p className="text-sm text-purple-500 mt-2">📊 Market Data</p>
            </div>
            <div className="text-center bg-white p-6 rounded-xl shadow-lg border border-green-100">
              <p className="text-sm font-medium text-gray-600 mb-3">Market Comparison</p>
              <p className={`text-4xl font-bold ${data.salary_insights.market_comparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.salary_insights.market_comparison >= 0 ? '+' : ''}{data.salary_insights.market_comparison.toFixed(1)}%
              </p>
              <p className="text-sm text-green-500 mt-2">📈 Competitive</p>
            </div>
          </div>
        </div>

        {/* Application Trends Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">📈 AI Analytics Dashboard</h3>
          <div className="h-64 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xl font-bold">🚀 Interactive AI Charts Coming Soon</p>
              <p className="text-base mt-2">Real-time analytics with machine learning insights</p>
              <div className="mt-4 flex justify-center space-x-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  📊 Predictive Analytics
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  🤖 AI Recommendations
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  🎯 Smart Targeting
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommercialDashboard;
