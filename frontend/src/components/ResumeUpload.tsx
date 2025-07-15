import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResumeInfo } from './types';
import { uploadResume } from '../services/resumeService';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

const ResumeUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<ResumeInfo[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const maxResumes = 5;

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('resumes');
    if (stored) {
      setResumes(JSON.parse(stored));
    }
  }, []);

  const saveResumes = (updated: ResumeInfo[]) => {
    setResumes(updated);
    localStorage.setItem('resumes', JSON.stringify(updated));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a resume file to upload.');
      toast.error('Please select a resume file to upload.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const response = await uploadResume(file);
      toast.success('Resume uploaded successfully!');

      // Store parsed data if available
      if (response.parsed_data) {
        localStorage.setItem('resumeText', JSON.stringify(response.parsed_data));
        localStorage.setItem('userInfo', JSON.stringify(response.parsed_data));
      }

      const newResume: ResumeInfo = {
        name: file.name,
        content: response.parsed_data ? JSON.stringify(response.parsed_data) : '',
        isPrimary: resumes.length === 0, // First upload is primary
      };

      const updated = [...resumes, newResume];
      saveResumes(updated);
      setFile(null);
      setError('');
      navigate('/match');
    } catch (err) {
      setError('Resume upload failed.');
      toast.error('Resume upload failed.');
    }
    setUploading(false);
  };

  const handleDelete = (name: string) => {
    const updated = resumes.filter((r) => r.name !== name);
    if (!updated.some((r) => r.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    saveResumes(updated);
  };

  const handleSetPrimary = (name: string) => {
    const updated = resumes.map((r) => ({
      ...r,
      isPrimary: r.name === name,
    }));
    saveResumes(updated);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="max-w-xl w-full bg-gray-100 p-6 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Upload Your Resume</h2>

        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="w-full mb-4"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Continue'}
        </button>

        {uploading && <Spinner />}
        {error && <div className="text-red-600 mb-2">{error}</div>}

        {resumes.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Uploaded Resumes</h3>
            <ul className="space-y-2">
              {resumes.map((r) => (
                <li
                  key={r.name}
                  className="bg-white p-3 rounded border shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{r.name}</p>
                    {r.isPrimary && <p className="text-xs text-green-600">Primary</p>}
                  </div>
                  <div className="flex gap-2">
                    {!r.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(r.name)}
                        className="text-blue-600 underline text-sm"
                      >
                        Make Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.name)}
                      className="text-red-600 underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;
