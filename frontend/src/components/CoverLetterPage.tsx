// src/components/CoverLetterPage.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedMentors from './AnimatedMentors';
import { ResumeInfo } from './types';

const CoverLetterPage = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedResumes = localStorage.getItem('resumes');
    if (storedResumes) {
      const parsed: ResumeInfo[] = JSON.parse(storedResumes);
      const primary = parsed.find((r: ResumeInfo) => r.isPrimary);
      if (primary) {
        setResumeText(primary.content);
      } else {
        setError('No primary resume found.');
      }
    } else {
      setError('Please upload a resume first.');
    }
  }, []);

  const handleGenerate = async () => {
    if (!resumeText || !jobDescription || !company || !position) {
      setError('All fields are required.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/generate-cover-letter', {
        resume_text: resumeText,
        job_description: jobDescription,
        company,
        position,
      });

      setCoverLetter(response.data.cover_letter);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to generate cover letter.');
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto bg-gray-100 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Generate Cover Letter</h2>
        <AnimatedMentors />

        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company name"
          className="w-full mb-4 p-3 rounded border"
        />
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Position title"
          className="w-full mb-4 p-3 rounded border"
        />
        <textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="w-full mb-4 p-3 rounded border"
        />
        <button
          onClick={handleGenerate}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
        >
          Generate Cover Letter
        </button>

        {error && <p className="text-red-600 mt-2 text-center">{error}</p>}

        {coverLetter && (
          <div className="mt-6 bg-white p-4 rounded border shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Your Cover Letter</h3>
            <pre className="whitespace-pre-wrap">{coverLetter}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterPage;
