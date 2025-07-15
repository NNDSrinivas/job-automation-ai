import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="text-3xl">🚀</div>
              <span className="text-white text-xl font-bold">Job Automation AI</span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-white text-purple-900 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              Job Automation
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionize your job search with intelligent automation, AI mentors, and personalized career guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
              >
                Start Your AI Journey
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-purple-900 transition-all duration-200"
              >
                I Already Have an Account
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Automation</h3>
              <p className="text-gray-300">Automatically apply to hundreds of jobs with intelligent form filling and personalized applications.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
              <div className="text-4xl mb-4">🦅</div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Career Mentors</h3>
              <p className="text-gray-300">Get guidance from specialized AI mentors - Eagle, Wolf, Fox, Dolphin, and Lion - each with unique expertise.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Analytics & Insights</h3>
              <p className="text-gray-300">Track your success rate, optimize your strategy, and get real-time market insights.</p>
            </div>
          </div>
        </div>

        {/* Job Portals */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Integrated Job Portals</h2>
            <p className="text-gray-300">Connect with all major job platforms in one place</p>
          </div>
          <div className="flex justify-center items-center space-x-8 opacity-80">
            <div className="bg-white/20 px-6 py-3 rounded-lg">
              <span className="text-white font-semibold">LinkedIn</span>
            </div>
            <div className="bg-white/20 px-6 py-3 rounded-lg">
              <span className="text-white font-semibold">Indeed</span>
            </div>
            <div className="bg-white/20 px-6 py-3 rounded-lg">
              <span className="text-white font-semibold">Dice</span>
            </div>
            <div className="bg-white/20 px-6 py-3 rounded-lg">
              <span className="text-white font-semibold">Glassdoor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
