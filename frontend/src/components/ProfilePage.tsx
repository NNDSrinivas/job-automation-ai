import React, { useEffect, useState } from 'react';

interface UserInfo {
  location?: string;
  skills?: string[];
  education?: string[];
  experience?: string[];
}

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({});

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

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow-md">
      <h1 className="text-3xl font-bold mb-4 text-center">Your Profile</h1>

      <div className="mb-4">
        <strong>Location:</strong>{' '}
        <span className="text-gray-700">{userInfo.location || 'N/A'}</span>
      </div>

      {(userInfo.skills?.length || 0) > 0 && (
        <div className="mb-4">
          <strong>Skills:</strong>
          <ul className="list-disc list-inside text-gray-700">
            {userInfo.skills?.map((skill, idx) => (
              <li key={idx}>{skill}</li>
            ))}
          </ul>
        </div>
      )}

      {(userInfo.education?.length || 0) > 0 && (
        <div className="mb-4">
          <strong>Education:</strong>
          <ul className="list-disc list-inside text-gray-700">
            {userInfo.education?.map((edu, idx) => (
              <li key={idx}>{edu}</li>
            ))}
          </ul>
        </div>
      )}

      {(userInfo.experience?.length || 0) > 0 && (
        <div className="mb-4">
          <strong>Experience:</strong>
          <ul className="list-disc list-inside text-gray-700">
            {userInfo.experience?.map((exp, idx) => (
              <li key={idx}>{exp}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
