import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

interface Resume {
  id: string;
  name: string;
  uploadDate: string;
  isPrimary: boolean;
  size: string;
  parsedData?: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: string[];
    education?: string[];
    summary?: string;
  };
  aiAnalysis?: {
    strengths: string[];
    suggestions: string[];
    jobMatch: number; // percentage
  };
}

const ResumeManagerPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:8000/resumes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Transform backend data to frontend format
        const transformedResumes = data.map((resume: any) => ({
          id: resume.id,
          name: resume.name,
          uploadDate: resume.uploadDate,
          isPrimary: resume.isPrimary,
          size: resume.size,
          parsedData: resume.parsedData,
          aiAnalysis: resume.parsedData?.ai_analysis ? {
            strengths: resume.parsedData.ai_analysis.strengths || [],
            suggestions: resume.parsedData.ai_analysis.suggestions || [],
            jobMatch: resume.parsedData.ai_analysis.job_match_score || 0
          } : {
            strengths: generateAIStrengths(resume.parsedData || {}),
            suggestions: generateAISuggestions(resume.parsedData || {}),
            jobMatch: calculateJobMatch(resume.parsedData || {})
          }
        }));

        setResumes(transformedResumes);
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
      showError('Invalid file format', 'Please upload a PDF, DOC, or DOCX file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showError('File too large', 'File size must be less than 10MB');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (resumes.length >= 5) {
      alert('Maximum 5 resumes allowed. Please delete one first.');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8000/upload-resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        // Create resume object with AI analysis from backend
        const newResume: Resume = {
          id: data.db_id || Date.now().toString(),
          name: selectedFile.name,
          uploadDate: new Date().toISOString(),
          isPrimary: resumes.length === 0, // First upload is primary
          size: (selectedFile.size / 1024).toFixed(1) + ' KB',
          parsedData: data.parsed_data || data.user_info,
          aiAnalysis: data.parsed_data?.ai_analysis ? {
            strengths: data.parsed_data.ai_analysis.strengths || [],
            suggestions: data.parsed_data.ai_analysis.suggestions || [],
            jobMatch: data.parsed_data.ai_analysis.job_match_score || 0
          } : {
            strengths: generateAIStrengths(data.user_info || {}),
            suggestions: generateAISuggestions(data.user_info || {}),
            jobMatch: calculateJobMatch(data.user_info || {})
          }
        };

        setResumes(prev => [...prev, newResume]);
        setSelectedFile(null);

        // Show success message with analysis info
        if (newResume.aiAnalysis && newResume.aiAnalysis.jobMatch > 0) {
          showSuccess(
            'Resume uploaded and analyzed successfully!',
            `AI Analysis: ${newResume.aiAnalysis.jobMatch}% job match, ${newResume.aiAnalysis.strengths.length} strengths identified.`
          );
        } else {
          showSuccess('Resume uploaded successfully!', 'Basic parsing completed. AI analysis will be available soon.');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Upload failed', 'Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const setPrimary = async (resumeId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/resumes/${resumeId}/set-primary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const selectedResume = resumes.find(r => r.id === resumeId);
        setResumes(prev => prev.map(resume => ({
          ...resume,
          isPrimary: resume.id === resumeId
        })));
        showSuccess('Primary resume updated', `"${selectedResume?.name}" is now your primary resume for job applications.`);
      } else {
        throw new Error('Failed to set primary');
      }
    } catch (error) {
      console.error('Failed to set primary resume:', error);
      showError('Update failed', 'Failed to set primary resume. Please try again.');
    }
  };

  const deleteResume = async (resumeId: string) => {
    setResumeToDelete(resumeId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteResume = async () => {
    if (!resumeToDelete) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/resumes/${resumeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const deletedResume = resumes.find(r => r.id === resumeToDelete);
        const updatedResumes = resumes.filter(r => r.id !== resumeToDelete);

        // If deleted resume was primary, make first one primary
        if (updatedResumes.length > 0 && !updatedResumes.some(r => r.isPrimary)) {
          updatedResumes[0].isPrimary = true;
          await setPrimary(updatedResumes[0].id);
        }

        setResumes(updatedResumes);
        showSuccess('Resume deleted successfully', `${deletedResume?.name || 'Resume'} has been removed from your account.`);
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Failed to delete resume:', error);
      showError('Delete failed', 'Failed to delete resume. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
      setResumeToDelete(null);
    }
  };

  const generateAIStrengths = (parsedData: any): string[] => {
    const strengths: string[] = [];
    if (parsedData?.skills?.length > 0) {
      strengths.push(`Strong technical skills in ${parsedData.skills.slice(0, 3).join(', ')}`);
    }
    if (parsedData?.experience?.length > 0) {
      strengths.push('Relevant work experience');
    }
    if (parsedData?.education?.length > 0) {
      strengths.push('Good educational background');
    }
    return strengths.length > 0 ? strengths : ['Professional formatting', 'Clear structure'];
  };

  const generateAISuggestions = (parsedData: any): string[] => {
    const suggestions: string[] = [];
    if (!parsedData?.skills || parsedData.skills.length < 5) {
      suggestions.push('Add more relevant technical skills');
    }
    if (!parsedData?.summary) {
      suggestions.push('Include a professional summary');
    }
    suggestions.push('Consider adding quantified achievements');
    return suggestions;
  };

  const calculateJobMatch = (parsedData: any): number => {
    let score = 60; // Base score
    if (parsedData?.skills?.length > 0) score += Math.min(parsedData.skills.length * 5, 25);
    if (parsedData?.experience?.length > 0) score += 10;
    if (parsedData?.summary) score += 5;
    return Math.min(score, 95);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📄 Resume Manager</h1>
              <p className="text-gray-600 mt-1">Upload and manage up to 5 resumes with AI-powered analysis</p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{resumes.length}/5</div>
                <div className="text-gray-500">Resumes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {resumes.find(r => r.isPrimary)?.name ? '✓' : '⚪'}
                </div>
                <div className="text-gray-500">Primary Set</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📤 Upload New Resume</h2>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="text-4xl">📎</div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedFile.name}</h3>
                  <p className="text-gray-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading || resumes.length >= 5}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {uploading ? 'Uploading & Analyzing...' : 'Upload Resume'}
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl text-gray-400">📄</div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Drop your resume here</h3>
                  <p className="text-gray-600">or click to browse files</p>
                  <p className="text-sm text-gray-500 mt-2">Supports PDF, DOC, DOCX (max 10MB)</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>

          {resumes.length >= 5 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Maximum limit reached. Delete a resume to upload a new one.
              </p>
            </div>
          )}
        </div>

        {/* Resumes List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">📋 Your Resumes</h2>

          {resumes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resumes Uploaded</h3>
              <p className="text-gray-600">Upload your first resume to get started with AI-powered job applications</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-lg ${
                    resume.isPrimary ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">📄</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{resume.name}</h3>
                          <p className="text-sm text-gray-600">{resume.size} • {new Date(resume.uploadDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {resume.isPrimary && (
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          ⭐ Primary
                        </div>
                      )}
                    </div>

                    {/* AI Match Score */}
                    {resume.aiAnalysis && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900">AI Job Match Score</span>
                          <span className="text-lg font-bold text-blue-600">{resume.aiAnalysis.jobMatch}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${resume.aiAnalysis.jobMatch}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Parsed Data Preview */}
                  {resume.parsedData && (
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">🔍 Extracted Information</h4>
                      <div className="space-y-2 text-sm">
                        {resume.parsedData.name && (
                          <div><span className="font-medium">Name:</span> {resume.parsedData.name}</div>
                        )}
                        {resume.parsedData.email && (
                          <div><span className="font-medium">Email:</span> {resume.parsedData.email}</div>
                        )}
                        {resume.parsedData.skills && resume.parsedData.skills.length > 0 && (
                          <div>
                            <span className="font-medium">Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {resume.parsedData.skills.slice(0, 5).map((skill, index) => (
                                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {resume.parsedData.skills.length > 5 && (
                                <span className="text-gray-500 text-xs">+{resume.parsedData.skills.length - 5} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-6">
                    <div className="flex space-x-3">
                      {!resume.isPrimary && (
                        <button
                          onClick={() => setPrimary(resume.id)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                        >
                          ⭐ Set as Primary
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedResume(resume);
                          setShowAnalysisModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                      >
                        🔍 View Analysis
                      </button>
                      <button
                        onClick={() => deleteResume(resume.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis Modal */}
      {showAnalysisModal && selectedResume && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  🤖 AI Analysis: {selectedResume.name}
                </h3>
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {selectedResume.aiAnalysis && (
                <div className="space-y-6">
                  {/* Job Match Score */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📊 Job Match Score</h4>
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl font-bold text-blue-600">{selectedResume.aiAnalysis.jobMatch}%</div>
                      <div className="flex-1">
                        <div className="w-full bg-blue-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full"
                            style={{ width: `${selectedResume.aiAnalysis.jobMatch}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">💪 Strengths</h4>
                    <ul className="space-y-2">
                      {selectedResume.aiAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">💡 Improvement Suggestions</h4>
                    <ul className="space-y-2">
                      {selectedResume.aiAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-yellow-500">💡</span>
                          <span className="text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Resume"
        message={`Are you sure you want to delete "${resumes.find(r => r.id === resumeToDelete)?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeleteResume}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setResumeToDelete(null);
        }}
      />
    </div>
  );
};

export default ResumeManagerPage;
