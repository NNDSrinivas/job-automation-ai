import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  React.useEffect(() => {
    if (token && email) {
      axiosInstance.get('/verify-email', { params: { token, email } })
        .then(() => {
          setStatus('Email verified! You can now log in.');
          setTimeout(() => navigate('/login'), 2000);
        })
        .catch(() => setStatus('Verification failed.'));
    }
  }, [token, email, navigate]);

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h2 className="text-xl font-bold mb-4">Email Verification</h2>
      <div>{status || 'Verifying...'}</div>
    </div>
  );
};

export default VerifyEmailPage;
