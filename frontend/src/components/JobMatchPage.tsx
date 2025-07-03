// src/components/JobMatchPage.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedMentors from './AnimatedMentors';
import { ResumeInfo } from './types'; // Adjust path if types.ts is located elsewhere

const JobMatchPage = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [error, setError] = useState('');

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
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/match-job', {
        resume_text: resumeText,
        job_description: jobDescription,
      });

      setMatchScore(response.data.score);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to match resume with job.');
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto bg-gray-100 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Job Match</h2>
        <AnimatedMentors />

        <textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="w-full mb-4 p-3 rounded border"
        />

        <button
          onClick={handleMatch}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Match Resume
        </button>

        {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
        {matchScore !== null && (
          <div className="mt-6 text-center">
            <p className="text-xl font-semibold text-green-700">Match Score: {matchScore}%</p>
            <p className="text-gray-700 mt-2">
              {matchScore > 80
                ? 'Great match! 🎯'
                : matchScore > 50
                ? 'Decent match, could use some tweaking.'
                : 'Not a strong match. Consider editing your resume or choosing a better fit.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobMatchPage;
