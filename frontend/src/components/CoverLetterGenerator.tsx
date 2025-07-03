import React, { useState } from 'react';
import { generateCoverLetter } from '../services/coverLetterService';

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
    } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Cover letter generation failed:', err);
          setError(err.message || 'Something went wrong while generating the cover letter.');
        } else {
          console.error('Unexpected error during cover letter generation:', err);
          setError('Something went wrong while generating the cover letter.');
        }
      }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Cover Letter'}
        </button>

        {error && <p className="text-red-600">{error}</p>}

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
