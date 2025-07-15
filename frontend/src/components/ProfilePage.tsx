import React, { useEffect, useState } from 'react';

interface UserInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  education?: string[];
  experience?: string[];
}

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      try {
        setUserInfo(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse user info:', err);
      }
    }
  }, []);

  const hasData = userInfo.location || userInfo.skills?.length || userInfo.education?.length || userInfo.experience?.length;

  const handleSave = () => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: 'skills' | 'education' | 'experience', index: number, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: prev[field]?.map((item, i) => i === index ? value : item) || []
    }));
  };

  const addArrayItem = (field: 'skills' | 'education' | 'experience') => {
    setUserInfo(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const removeArrayItem = (field: 'skills' | 'education' | 'experience', index: number) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center">
                <svg className="h-10 w-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {userInfo.firstName && userInfo.lastName
                    ? `${userInfo.firstName} ${userInfo.lastName}`
                    : 'Your Profile'
                  }
                </h1>
                <p className="text-purple-100">
                  {userInfo.email || 'Manage your professional information'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {!hasData && !isEditing ? (
            <div className="text-center py-12">
              <div className="h-24 w-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Complete your profile</h3>
              <p className="text-gray-500 mb-6">Add your professional information to get better job matches</p>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userInfo.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="py-2 text-gray-900">{userInfo.firstName || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userInfo.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="py-2 text-gray-900">{userInfo.lastName || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={userInfo.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="py-2 text-gray-900">{userInfo.email || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={userInfo.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="py-2 text-gray-900">{userInfo.phone || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userInfo.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, State, Country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    ) : (
                      <p className="py-2 text-gray-900">{userInfo.location || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('skills')}
                      className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                    >
                      + Add Skill
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    {(userInfo.skills || ['']).map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                          placeholder="Enter a skill"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          onClick={() => removeArrayItem('skills', index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {userInfo.skills?.filter(skill => skill.trim()).map((skill, index) => (
                      <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    )) || <p className="text-gray-500">No skills added yet</p>}
                  </div>
                )}
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('education')}
                      className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                    >
                      + Add Education
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    {(userInfo.education || ['']).map((edu, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={edu}
                          onChange={(e) => handleArrayChange('education', index, e.target.value)}
                          placeholder="e.g., BS Computer Science - MIT (2020)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          onClick={() => removeArrayItem('education', index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userInfo.education?.filter(edu => edu.trim()).map((edu, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900">{edu}</p>
                      </div>
                    )) || <p className="text-gray-500">No education information added yet</p>}
                  </div>
                )}
              </div>

              {/* Experience */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
                  {isEditing && (
                    <button
                      onClick={() => addArrayItem('experience')}
                      className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                    >
                      + Add Experience
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    {(userInfo.experience || ['']).map((exp, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={exp}
                          onChange={(e) => handleArrayChange('experience', index, e.target.value)}
                          placeholder="e.g., Software Engineer at Google (2020-2023)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          onClick={() => removeArrayItem('experience', index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userInfo.experience?.filter(exp => exp.trim()).map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900">{exp}</p>
                      </div>
                    )) || <p className="text-gray-500">No work experience added yet</p>}
                  </div>
                )}
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {/* Call to Action for Resume Upload */}
              {!isEditing && (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Enhance Your Profile</h4>
                  <p className="text-gray-600 mb-4">Upload your resume to automatically populate your profile and enable AI job applications</p>
                  <button
                    onClick={() => window.location.href = '/resume-manager'}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Manage Resumes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
