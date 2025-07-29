import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, children, mobile = false }: { to: string; children: React.ReactNode; mobile?: boolean }) => (
    <Link
      to={to}
      className={`${
        mobile
          ? 'block px-3 py-2 rounded-md text-base font-medium'
          : 'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium'
      } transition-colors duration-200 ${
        isActive(to)
          ? 'bg-indigo-700 text-white'
          : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
      }`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-white text-xl font-bold hidden sm:block">Job Automation AI</span>
              <span className="text-white text-lg font-bold sm:hidden">Job AI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v10z" />
                    </svg>
                    Dashboard
                  </NavLink>
                  <NavLink to="/jobs">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 112 2v6a2 2 0 11-2 2v-2M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-6a2 2 0 00-2-2H10a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    🚀 Job Search
                  </NavLink>
                  <NavLink to="/auto-apply">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Auto Apply
                  </NavLink>
                  <NavLink to="/applications">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Applications
                  </NavLink>
                  <NavLink to="/ai-chat">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    AI Chat
                  </NavLink>
                  <NavLink to="/portals">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Portals
                  </NavLink>
                  <NavLink to="/questionnaire">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Questions
                  </NavLink>
                  <NavLink to="/resume-manager">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Resumes
                  </NavLink>
                  <NavLink to="/profile">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                  >
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </NavLink>
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 transition-colors duration-200"
                  >
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-indigo-700">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" mobile>Dashboard</NavLink>
              <NavLink to="/jobs" mobile>🚀 Job Search</NavLink>
              <NavLink to="/auto-apply" mobile>Auto Apply</NavLink>
              <NavLink to="/applications" mobile>Applications</NavLink>
              <NavLink to="/ai-chat" mobile>AI Chat</NavLink>
              <NavLink to="/portals" mobile>Portals</NavLink>
              <NavLink to="/questionnaire" mobile>Questions</NavLink>
              <NavLink to="/resume-manager" mobile>Resumes</NavLink>
              <NavLink to="/profile" mobile>Profile</NavLink>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" mobile>Login</NavLink>
              <NavLink to="/signup" mobile>Sign Up</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
