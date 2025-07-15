import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ToastProvider';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage';
import SimpleJobsPage from './pages/SimpleJobsPage';
import ProfilePage from './pages/ProfilePage';
import AutomationPage from './pages/AutomationPage';
import ApplicationsPage from './pages/ApplicationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ChatbotPage from './pages/ChatbotPage';
import QuestionnairePage from './pages/QuestionnairePage';
import JobPortalsPage from './pages/JobPortalsPage';
import ResumeManagerPage from './pages/ResumeManagerPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

// Component to handle authenticated routing
const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading authentication...</div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !isAuthenticated ? (
              <SignupPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <SimpleJobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auto-apply"
          element={
            <ProtectedRoute>
              <AutomationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automation"
          element={
            <ProtectedRoute>
              <AutomationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatbotPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <ProtectedRoute>
              <ChatbotPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/questionnaire"
          element={
            <ProtectedRoute>
              <QuestionnairePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portals"
          element={
            <ProtectedRoute>
              <JobPortalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-manager"
          element={
            <ProtectedRoute>
              <ResumeManagerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <LandingPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        {/* Catch-all route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="App">
            <AuthenticatedApp />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
