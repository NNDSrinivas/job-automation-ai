import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 pt-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Configure your application preferences and account settings.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
