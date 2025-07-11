import React, { useState } from 'react';
import { generateCoverLetter } from '../services/coverLetterService';
import { CoverLetterRequest } from './types';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

interface Props {
  resumeText: string; // Pass this as a prop from ResumeUpload or parent
}

const CoverLetterGenerator: React.FC<Props> = ({ resumeText }) => {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const letter = await generateCoverLetter(resumeText, jobDescription, company, position);
      setCoverLetter(letter);
      toast.success('Cover letter generated!');
    } catch (err: unknown) {
      setError('Something went wrong while generating the cover letter.');
      toast.error('Something went wrong while generating the cover letter.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {loading && <Spinner />}
      {error && <div className="text-red-600 mb-2">{error}</div>}

      <h2 className="text-xl font-bold mb-4">Generate Cover Letter</h2>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Company Name"
          className="w-full border px-3 py-2 rounded"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <input
          type="text"
          placeholder="Position"
          className="w-full border px-3 py-2 rounded"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />

        <textarea
          placeholder="Paste Job Description"
          className="w-full border px-3 py-2 rounded h-32"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          disabled={loading}
        >
          Generate Cover Letter
        </button>

        {coverLetter && (
          <div className="mt-6 bg-gray-100 p-4 rounded whitespace-pre-wrap">
            <h3 className="font-semibold mb-2">Generated Cover Letter:</h3>
            <p>{coverLetter}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterGenerator;
