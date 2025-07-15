import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';

interface JobPortalCredentials {
  linkedin: { username: string; password: string; enabled: boolean };
  indeed: { username: string; password: string; enabled: boolean };
  glassdoor: { username: string; password: string; enabled: boolean };
  dice: { username: string; password: string; enabled: boolean };
}

const JobPortalSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<JobPortalCredentials>({
    linkedin: { username: '', password: '', enabled: true },
    indeed: { username: '', password: '', enabled: true },
    glassdoor: { username: '', password: '', enabled: false },
    dice: { username: '', password: '', enabled: false },
  });

  const handleCredentialChange = (platform: keyof JobPortalCredentials, field: string, value: string | boolean) => {
    setCredentials(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save each enabled credential separately
      const savePromises = Object.entries(credentials)
        .filter(([_, cred]) => cred.enabled && cred.username && cred.password)
        .map(([platform, cred]) =>
          axiosInstance.post('/job-portal-credentials', {
            platform,
            username: cred.username,
            password: cred.password,
            additional_data: {}
          })
        );

      await Promise.all(savePromises);
      toast.success('Job portal credentials saved securely!');
      navigate('/questionnaire-setup');
    } catch (error) {
      toast.error('Failed to save credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const platformInfo = {
    linkedin: { name: 'LinkedIn', color: 'bg-blue-600', icon: '💼' },
    indeed: { name: 'Indeed', color: 'bg-blue-500', icon: '🔍' },
    glassdoor: { name: 'Glassdoor', color: 'bg-green-600', icon: '🏢' },
    dice: { name: 'Dice', color: 'bg-red-600', icon: '🎲' }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 Job Portal Integration Setup
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect your job portal accounts to enable automated job applications.
            Your credentials are encrypted and stored securely.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">🔐 Account Credentials</h2>
            <p className="text-sm text-gray-600">
              We'll use these credentials to automatically log into job portals and apply to jobs on your behalf.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(platformInfo).map(([platform, info]) => (
              <div key={platform} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{info.icon}</span>
                    <h3 className="text-lg font-medium text-gray-900">{info.name}</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={credentials[platform as keyof JobPortalCredentials].enabled}
                      onChange={(e) => handleCredentialChange(platform as keyof JobPortalCredentials, 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {credentials[platform as keyof JobPortalCredentials].enabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username/Email
                      </label>
                      <input
                        type="email"
                        value={credentials[platform as keyof JobPortalCredentials].username}
                        onChange={(e) => handleCredentialChange(platform as keyof JobPortalCredentials, 'username', e.target.value)}
                        placeholder={`Your ${info.name} username or email`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={credentials[platform as keyof JobPortalCredentials].password}
                        onChange={(e) => handleCredentialChange(platform as keyof JobPortalCredentials, 'password', e.target.value)}
                        placeholder={`Your ${info.name} password`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Security Notice</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your credentials are encrypted using industry-standard AES-256 encryption before storage.
                    We recommend using application-specific passwords where available (LinkedIn, Google).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPortalSetup;
