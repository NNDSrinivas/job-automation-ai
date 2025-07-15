import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  platform: string;
  salary?: string;
  jobType?: string;
  postedDate?: string;
  matchScore?: number;
  isBookmarked?: boolean;
}

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);

  // Generate some demo jobs
  useEffect(() => {
    const demoJobs: Job[] = [
      {
        id: '1',
        title: 'Senior React Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        description: 'Build amazing React applications with TypeScript and modern tools.',
        url: 'https://example.com/job1',
        platform: 'LinkedIn',
        salary: '$120,000 - $150,000',
        jobType: 'Full-time',
        matchScore: 95,
        isBookmarked: false
      },
      {
        id: '2',
        title: 'Python Backend Engineer',
        company: 'DataFlow Inc',
        location: 'Remote',
        description: 'Work with Python, FastAPI, and PostgreSQL to build scalable APIs.',
        url: 'https://example.com/job2',
        platform: 'Indeed',
        salary: '$110,000 - $140,000',
        jobType: 'Full-time',
        matchScore: 88,
        isBookmarked: false
      },
      {
        id: '3',
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'New York, NY',
        description: 'Join our team building the next generation of fintech applications.',
        url: 'https://example.com/job3',
        platform: 'Glassdoor',
        salary: '$100,000 - $130,000',
        jobType: 'Full-time',
        matchScore: 82,
        isBookmarked: false
      }
    ];
    setJobs(demoJobs);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 w-full">
      <div className="w-full max-w-none px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
          <p className="text-gray-600 mt-2">Find and apply to jobs across multiple platforms</p>
        </div>

        {/* Jobs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-blue-600 font-medium">{job.company}</p>
                  <p className="text-gray-500 text-sm">{job.location}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {job.matchScore}% match
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{job.description}</p>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-600 font-semibold text-sm">{job.salary}</p>
                  <p className="text-gray-500 text-xs">{job.platform}</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No jobs found. Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
