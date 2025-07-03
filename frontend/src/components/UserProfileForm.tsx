import React, { useState, useEffect } from 'react';

interface UserInfo {
  location: string;
  skills: string[];
  education: string[];
  experience: string[];
}

const UserProfileForm = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    location: '',
    skills: [''],
    education: [''],
    experience: [''],
  });

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) setUserInfo(JSON.parse(stored));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: keyof UserInfo) => {
    const updated = [...(userInfo[field] as string[])];
    updated[index] = e.target.value;
    setUserInfo({ ...userInfo, [field]: updated });
  };

  const handleAdd = (field: keyof UserInfo) => {
    const updated = [...(userInfo[field] as string[]), ''];
    setUserInfo({ ...userInfo, [field]: updated });
  };

  const handleRemove = (field: keyof UserInfo, index: number) => {
    const updated = [...(userInfo[field] as string[])];
    updated.splice(index, 1);
    setUserInfo({ ...userInfo, [field]: updated });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo({ ...userInfo, location: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    alert('Profile updated successfully!');
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto bg-gray-100 p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Edit Your Profile</h2>

        <label className="block mb-2 font-semibold">Location</label>
        <input
          type="text"
          value={userInfo.location}
          onChange={handleLocationChange}
          className="w-full mb-4 p-2 border rounded"
        />

        {(['skills', 'education', 'experience'] as (keyof UserInfo)[]).map((field) => (
          <div key={field} className="mb-6">
            <label className="block mb-2 font-semibold capitalize">{field}</label>
            {(userInfo[field] as string[]).map((value, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(e, index, field)}
                  className="w-full p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(field, index)}
                  className="text-red-500 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAdd(field)}
              className="text-blue-600 underline text-sm"
            >
              + Add {field.slice(0, -1)}
            </button>
          </div>
        ))}

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
};

export default UserProfileForm;
