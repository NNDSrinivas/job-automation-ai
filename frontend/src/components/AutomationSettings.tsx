import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';

interface AutomationSettings {
  enabled: boolean;
  maxApplicationsPerDay: number;
  maxApplicationsPerWeek: number;
  jobMatchThreshold: number;
  salaryRange: {
    min: number;
    max: number;
  };
  jobTypes: string[];
  workModes: string[];
  keywords: string[];
  excludeKeywords: string[];
  locations: string[];
  companyTypes: string[];
  excludeCompanies: string[];
  autoApplyEnabled: boolean;
  humanReviewRequired: boolean;
  scheduleType: string;
  activeHours: {
    start: string;
    end: string;
  };
  notifications: {
    email: boolean;
    browser: boolean;
    sms: boolean;
  };
}

const AutomationSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AutomationSettings>({
    enabled: false,
    maxApplicationsPerDay: 10,
    maxApplicationsPerWeek: 50,
    jobMatchThreshold: 75,
    salaryRange: { min: 60000, max: 120000 },
    jobTypes: ['full_time'],
    workModes: ['remote', 'hybrid'],
    keywords: [],
    excludeKeywords: [],
    locations: [],
    companyTypes: [],
    excludeCompanies: [],
    autoApplyEnabled: true,
    humanReviewRequired: false,
    scheduleType: 'business_hours',
    activeHours: { start: '09:00', end: '17:00' },
    notifications: { email: true, browser: true, sms: false }
  });

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: { ...(prev[parent as keyof AutomationSettings] as any), [child]: value }
      }));
    } else {
      setSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field as keyof AutomationSettings] as string[], value]
        : (prev[field as keyof AutomationSettings] as string[]).filter(item => item !== value)
    }));
  };

  const handleKeywordAdd = (field: 'keywords' | 'excludeKeywords' | 'locations' | 'excludeCompanies', value: string) => {
    if (value.trim()) {
      setSettings(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const handleKeywordRemove = (field: 'keywords' | 'excludeKeywords' | 'locations' | 'excludeCompanies', index: number) => {
    setSettings(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert settings to backend format
      const automationData = {
        max_applications_per_day: settings.maxApplicationsPerDay,
        match_threshold: settings.jobMatchThreshold / 100, // Convert percentage to decimal
        enabled_platforms: ['linkedin', 'indeed', 'glassdoor', 'dice'], // Use all platforms for now
        preferred_locations: settings.locations,
        salary_range_min: settings.salaryRange.min || null,
        salary_range_max: settings.salaryRange.max || null,
        job_types: settings.jobTypes,
        experience_levels: ['entry', 'mid', 'senior'], // Default experience levels
        keywords_include: settings.keywords,
        keywords_exclude: settings.excludeKeywords,
        is_active: settings.autoApplyEnabled,
        schedule_enabled: settings.scheduleType !== 'always',
        schedule_start_time: settings.activeHours.start,
        schedule_end_time: settings.activeHours.end,
        schedule_days: settings.scheduleType === 'business_hours'
          ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      };

      await axiosInstance.post('/automation-settings', automationData);
      toast.success('🚀 Automation settings saved! Your job hunt is now on autopilot.');
      navigate('/dashboard');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save automation settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAutomation = async () => {
    setLoading(true);
    try {
      await axiosInstance.post('/start-automation');
      toast.success('🎯 Job automation started! We\'ll begin finding and applying to jobs for you.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to start automation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🤖 Automation Settings
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Configure your automated job application preferences. Set it once and let AI handle your job search 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Automation Control */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">🎯 Automation Control</h2>
                  <p className="text-sm text-gray-600">Enable or disable automated job applications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => handleChange('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max applications per day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxApplicationsPerDay}
                    onChange={(e) => handleChange('maxApplicationsPerDay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max applications per week
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={settings.maxApplicationsPerWeek}
                    onChange={(e) => handleChange('maxApplicationsPerWeek', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum job match score: {settings.jobMatchThreshold}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={settings.jobMatchThreshold}
                  onChange={(e) => handleChange('jobMatchThreshold', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50% (More opportunities)</span>
                  <span>95% (Perfect matches only)</span>
                </div>
              </div>
            </div>

            {/* Job Preferences */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">💼 Job Preferences</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Types</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'full_time', label: 'Full-time' },
                      { value: 'part_time', label: 'Part-time' },
                      { value: 'contract', label: 'Contract' },
                      { value: 'freelance', label: 'Freelance' }
                    ].map(type => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.jobTypes.includes(type.value)}
                          onChange={(e) => handleArrayChange('jobTypes', type.value, e.target.checked)}
                          className="mr-2 rounded"
                        />
                        {type.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Modes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'remote', label: 'Remote' },
                      { value: 'hybrid', label: 'Hybrid' },
                      { value: 'onsite', label: 'On-site' }
                    ].map(mode => (
                      <label key={mode.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.workModes.includes(mode.value)}
                          onChange={(e) => handleArrayChange('workModes', mode.value, e.target.checked)}
                          className="mr-2 rounded"
                        />
                        {mode.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum salary ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={settings.salaryRange.min}
                      onChange={(e) => handleChange('salaryRange.min', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum salary ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={settings.salaryRange.max}
                      onChange={(e) => handleChange('salaryRange.max', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Keywords and Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">🔍 Keywords & Filters</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required keywords (job must contain these)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.keywords.map((keyword, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                        {keyword}
                        <button
                          onClick={() => handleKeywordRemove('keywords', index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add keyword and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleKeywordAdd('keywords', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exclude keywords (skip jobs with these)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.excludeKeywords.map((keyword, index) => (
                      <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center">
                        {keyword}
                        <button
                          onClick={() => handleKeywordRemove('excludeKeywords', index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add exclude keyword and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleKeywordAdd('excludeKeywords', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">⏰ Schedule Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    When to apply to jobs
                  </label>
                  <select
                    value={settings.scheduleType}
                    onChange={(e) => handleChange('scheduleType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="24_7">24/7 (Recommended)</option>
                    <option value="business_hours">Business hours only</option>
                    <option value="custom">Custom hours</option>
                  </select>
                </div>

                {settings.scheduleType === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start time</label>
                      <input
                        type="time"
                        value={settings.activeHours.start}
                        onChange={(e) => handleChange('activeHours.start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End time</label>
                      <input
                        type="time"
                        value={settings.activeHours.end}
                        onChange={(e) => handleChange('activeHours.end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoApplyEnabled}
                      onChange={(e) => handleChange('autoApplyEnabled', e.target.checked)}
                      className="mr-2 rounded"
                    />
                    Automatically apply to jobs (no human review needed)
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.humanReviewRequired}
                      onChange={(e) => handleChange('humanReviewRequired', e.target.checked)}
                      className="mr-2 rounded"
                    />
                    Require human review before applying
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">🚀 Automation Status</h3>
                <div className="text-3xl font-bold mb-2">
                  {settings.enabled ? '🟢 ACTIVE' : '⭕ INACTIVE'}
                </div>
                <p className="text-sm opacity-90">
                  {settings.enabled
                    ? 'Your AI assistant is working hard for you!'
                    : 'Enable automation to start your job hunt'
                  }
                </p>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Email notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => handleChange('notifications.email', e.target.checked)}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Browser notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications.browser}
                    onChange={(e) => handleChange('notifications.browser', e.target.checked)}
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">SMS notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications.sms}
                    onChange={(e) => handleChange('notifications.sms', e.target.checked)}
                    className="rounded"
                  />
                </label>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Estimated Results</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Daily applications:</span>
                  <span className="font-medium">{settings.maxApplicationsPerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Weekly applications:</span>
                  <span className="font-medium">{settings.maxApplicationsPerWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Match threshold:</span>
                  <span className="font-medium">{settings.jobMatchThreshold}%+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expected interviews:</span>
                  <span className="font-medium text-green-600">
                    {Math.round(settings.maxApplicationsPerWeek * 0.15)}/week
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Save for Later
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : '💾 Save Settings'}
          </button>

          {settings.enabled && (
            <button
              onClick={handleStartAutomation}
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Starting...' : '🚀 Start Automation'}
            </button>
          )}
        </div>

        {/* Success Message */}
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">🎉 You're almost ready!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Once you save these settings and start automation, our AI will work 24/7 to find, match,
                  and apply to relevant jobs for you. You'll receive notifications about all applications and responses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationSettings;
