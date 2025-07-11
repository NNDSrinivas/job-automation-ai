import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

const RequestPasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    try {
      await axiosInstance.post('/request-password-reset', { email });
      setStatus('Password reset link sent! Check your email.');
    } catch {
      setStatus('Failed to send reset link.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Request Password Reset</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          className="border rounded px-3 py-2 w-full"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send Reset Link</button>
      </form>
      {status && <div className="mt-4 text-green-600">{status}</div>}
    </div>
  );
};

export default RequestPasswordResetPage;
