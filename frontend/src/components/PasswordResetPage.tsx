import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const PasswordResetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    try {
      await axiosInstance.post('/reset-password', { email, token, new_password: newPassword });
      setStatus('Password reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setStatus('Failed to reset password.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="New password"
          className="border rounded px-3 py-2 w-full"
          required
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Reset Password</button>
      </form>
      {status && <div className="mt-4 text-green-600">{status}</div>}
    </div>
  );
};

export default PasswordResetPage;
