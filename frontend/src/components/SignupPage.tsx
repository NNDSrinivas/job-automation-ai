import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AnimatedMentors from './AnimatedMentors';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      setFormData((prev) => ({
        ...prev,
        firstName: parsed.firstName || '',
        middleName: parsed.middleName || '',
        lastName: parsed.lastName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleResumeUpload = async () => {
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    try {
      setUploading(true);
      const response = await axios.post('http://localhost:8000/upload-resume', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { resume_text, user_info } = response.data;
      localStorage.setItem('resumeText', resume_text);
      localStorage.setItem('userInfo', JSON.stringify(user_info));
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    console.log('User Registered:', formData);
    navigate('/match');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 md:p-10 relative">
      <AnimatedMentors />

      <div className="w-full max-w-lg bg-gray-100 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Create Your Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="firstName"
              placeholder="First Name"
              className="p-2 rounded border"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
            <input
              name="middleName"
              placeholder="Middle Name"
              className="p-2 rounded border"
              value={formData.middleName}
              onChange={handleInputChange}
            />
            <input
              name="lastName"
              placeholder="Last Name"
              className="p-2 rounded border"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
            <input
              name="username"
              placeholder="Username"
              className="p-2 rounded border"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            className="w-full p-2 rounded border"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          <input
            name="phone"
            type="tel"
            placeholder="Phone Number"
            className="w-full p-2 rounded border"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full p-2 rounded border"
            value={formData.password}
            onChange={handleInputChange}
            required
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            className="w-full p-2 rounded border"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="w-full border rounded p-2"
          />

          <button
            type="button"
            onClick={handleResumeUpload}
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {uploading ? 'Uploading Resume...' : 'Upload Resume'}
          </button>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Sign Up
          </button>

          {error && <p className="text-red-600 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
