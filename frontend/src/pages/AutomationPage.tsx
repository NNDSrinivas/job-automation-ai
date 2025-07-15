import React, { useState } from 'react';

const AutomationPage: React.FC = () => {
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [settings, setSettings] = useState({
    maxApplicationsPerDay: 10,
    autoApplyEnabled: false,
    matchThreshold: 80,
    preferredJobTypes: ['Full-time', 'Remote'],
    blacklistedCompanies: ['Company A', 'Company B']
  });

  const toggleAutomation = () => {
    setIsAutomationRunning(!isAutomationRunning);
  };

  return (
    <div className="p-6 pt-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Application Automation</h1>

      {/* Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Automation Status</h2>
            <p className={`text-lg ${isAutomationRunning ? 'text-green-600' : 'text-gray-500'}`}>
              {isAutomationRunning ? 'Running' : 'Stopped'}
            </p>
          </div>
          <button
            onClick={toggleAutomation}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              isAutomationRunning
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isAutomationRunning ? 'Stop Automation' : 'Start Automation'}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Settings</h3>

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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Threshold (%)
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.matchThreshold}
                onChange={(e) => setSettings({...settings, matchThreshold: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">{settings.matchThreshold}%</div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoApplyEnabled}
                  onChange={(e) => setSettings({...settings, autoApplyEnabled: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Enable Auto Apply</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Applications sent today</span>
              <span className="font-semibold text-blue-600">8</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Success rate</span>
              <span className="font-semibold text-green-600">23%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Jobs processed</span>
              <span className="font-semibold text-purple-600">156</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationPage;
