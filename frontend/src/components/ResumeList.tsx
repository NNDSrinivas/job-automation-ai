import React, { useEffect, useState } from 'react';
import Layout from './Layout';
import { ResumeInfo } from './types';

const ResumeList = () => {
  const [resumes, setResumes] = useState<ResumeInfo[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('resumes');
    if (stored) {
      setResumes(JSON.parse(stored));
    }
  }, []);

  const handleDelete = (name: string) => {
    const updated = resumes.filter((r) => r.name !== name);
    if (!updated.some((r) => r.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setResumes(updated);
    localStorage.setItem('resumes', JSON.stringify(updated));
  };

  const handleSetPrimary = (name: string) => {
    const updated = resumes.map((r) => ({
      ...r,
      isPrimary: r.name === name,
    }));
    setResumes(updated);
    localStorage.setItem('resumes', JSON.stringify(updated));
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-xl w-full bg-gray-100 p-6 rounded shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Uploaded Resumes</h2>
          {resumes.length > 0 ? (
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
          ) : (
            <p className="text-center text-gray-600">No resumes uploaded yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResumeList;
