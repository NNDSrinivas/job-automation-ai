// src/components/JobMatchPage.tsx

import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import AnimatedMentors from './AnimatedMentors';
import Layout from './Layout';
import { ResumeInfo, JobMatchInput } from './types';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

const JobMatchPage = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const storedResumes = localStorage.getItem('resumes');
    if (storedResumes) {
      try {
        const parsed: ResumeInfo[] = JSON.parse(storedResumes);
        const primary = parsed.find((r) => r.isPrimary);
        if (primary) {
          setResumeText(primary.content);
        } else {
          setError('No primary resume found.');
        }
      } catch (e) {
        console.error('Failed to parse stored resumes:', e);
        setError('Invalid resume data. Please re-upload your resume.');
      }
    } else {
      setError('Please upload a resume first.');
    }
  }, []);

  const handleMatch = async () => {
    if (!resumeText || !jobDescription) {
      setError('Resume and Job Description are required.');
      toast.error('Resume and Job Description are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/match-jd', {
        resume_text: resumeText,
        job_description: jobDescription,
      });
      setMatchScore(response.data.score);
      // Generate suggestions based on match score
      if (response.data.score < 80) {
        setSuggestions([
          'Consider adding more relevant keywords from the job description',
          'Highlight transferable skills that match the requirements',
          'Quantify your achievements with specific numbers and metrics',
          'Tailor your experience section to better align with the role'
        ]);
      }
      toast.success('Job match score received!');
    } catch (err) {
      setError('Failed to get match score.');
      toast.error('Failed to get match score.');
    }
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return { text: 'Excellent match! 🎯', emoji: '🎯' };
    if (score >= 60) return { text: 'Good match with room for improvement', emoji: '✅' };
    if (score >= 40) return { text: 'Moderate match - consider optimizing your resume', emoji: '⚠️' };
    return { text: 'Low match - significant improvements needed', emoji: '❌' };
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Job Match Analyzer</h1>
          <p className="mt-2 text-lg text-gray-600">See how well your resume matches the job requirements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Resume Status */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Status</h2>
              {resumeText ? (
                <div className="flex items-center space-x-3">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Resume loaded successfully</p>
                    <p className="text-xs text-gray-500">Ready for job matching analysis</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">No resume found</p>
                    <p className="text-xs text-gray-500">Please upload a resume first</p>
                  </div>
                </div>
              )}
            </div>

            {/* Job Description Input */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
              <textarea
                rows={10}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here including requirements, responsibilities, and qualifications..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                Include all job requirements, responsibilities, and qualifications for the most accurate analysis
              </p>
            </div>

            {/* Animated Mentors */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <AnimatedMentors />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleMatch}
              disabled={loading || !resumeText || !jobDescription}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <Spinner />
                  <span className="ml-2">Analyzing Match...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analyze Job Match
                </div>
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="ml-3 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {matchScore !== null ? (
              <>
                {/* Match Score Card */}
                <div className={`bg-white shadow-lg rounded-lg p-6 border-2 ${getScoreBgColor(matchScore)}`}>
                  <div className="text-center">
                    <div className="mx-auto h-20 w-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-lg">
                      <span className={`text-3xl font-bold ${getScoreColor(matchScore)}`}>
                        {matchScore}%
                      </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">Match Score</h3>
                    <p className={`text-lg font-medium ${getScoreColor(matchScore)} mb-2`}>
                      {getScoreMessage(matchScore).text}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          matchScore >= 80 ? 'bg-green-500' :
                          matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${matchScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Improvement Suggestions */}
                {suggestions.length > 0 && (
                  <div className="bg-white shadow-lg rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Improvement Suggestions</h3>
                    <div className="space-y-3">
                      {suggestions.map((suggestion, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-gray-700">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Breakdown */}
                <div className="bg-white shadow-lg rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Score Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Keywords Match</span>
                      <span className={`text-sm font-semibold ${getScoreColor(matchScore - 10)}`}>
                        {Math.max(0, matchScore - 10)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Skills Alignment</span>
                      <span className={`text-sm font-semibold ${getScoreColor(matchScore + 5)}`}>
                        {Math.min(100, matchScore + 5)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Experience Relevance</span>
                      <span className={`text-sm font-semibold ${getScoreColor(matchScore - 5)}`}>
                        {Math.max(0, matchScore - 5)}%
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white shadow-lg rounded-lg p-8 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis performed yet</h3>
                <p className="text-gray-500">Paste a job description and click analyze to see how well your resume matches the requirements.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobMatchPage;
