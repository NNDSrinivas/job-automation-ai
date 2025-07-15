import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Redirect from '../components/Redirect';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Test backend connection
  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
          setBackendStatus('online');
          console.log('✅ Backend is online');
        } else {
          setBackendStatus('offline');
          console.log('❌ Backend responded with error');
        }
      } catch (error) {
        setBackendStatus('offline');
        console.error('❌ Backend connection failed:', error);
      }
    };

    testBackend();
  }, []);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🎯 Already authenticated, redirecting to dashboard...');
      setRedirecting(true);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Login form submitted for:', username);
    setLoading(true);

    try {
      const success = await login(username, password);
      console.log('🔐 Login result:', success);

      if (success) {
        console.log('✅ Login successful, triggering redirect...');
        setRedirecting(true);
      } else {
        console.log('❌ Login failed, staying on login page');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show redirect component if redirecting
  if (redirecting) {
    return <Redirect to="/dashboard" delay={500} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="text-4xl">🚀</div>
            <span className="text-white text-2xl font-bold">Job Automation AI</span>
          </Link>
          <h2 className="text-3xl font-bold text-white">Welcome back!</h2>
          <p className="mt-2 text-gray-300">Sign in to your account to continue your job search journey</p>

          {/* Backend Status Indicator */}
          <div className="mt-4 flex items-center justify-center">
            <div className={`flex items-center px-3 py-1 rounded-full text-xs ${
              backendStatus === 'online' ? 'bg-green-100/20 text-green-300' :
              backendStatus === 'offline' ? 'bg-red-100/20 text-red-300' :
              'bg-yellow-100/20 text-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                backendStatus === 'online' ? 'bg-green-400' :
                backendStatus === 'offline' ? 'bg-red-400' :
                'bg-yellow-400 animate-pulse'
              }`}></div>
              {backendStatus === 'online' ? 'Server Online' :
               backendStatus === 'offline' ? 'Server Offline' :
               'Checking Server...'}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your username or email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-white"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-purple-300 hover:text-purple-200">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in to your account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-300 hover:text-purple-200 font-medium">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="bg-yellow-50/10 backdrop-blur-md rounded-lg p-4 border border-yellow-200/20">
          <p className="text-yellow-200 text-sm font-medium mb-2">🔍 Demo Credentials:</p>
          <div className="text-yellow-100 text-sm mb-3 space-y-1">
            <p><strong>Option 1:</strong> demo@jobai.com / demo123</p>
            <p><strong>Option 2:</strong> mounikak952@gmail.com / password123</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('demo@jobai.com');
                setPassword('demo123');
              }}
              className="flex-1 bg-yellow-600/20 text-yellow-200 py-2 px-3 rounded-lg hover:bg-yellow-600/30 transition-colors text-sm border border-yellow-400/20"
            >
              Use Demo
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('mounikak952@gmail.com');
                setPassword('password123');
              }}
              className="flex-1 bg-blue-600/20 text-blue-200 py-2 px-3 rounded-lg hover:bg-blue-600/30 transition-colors text-sm border border-blue-400/20"
            >
              Use User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
