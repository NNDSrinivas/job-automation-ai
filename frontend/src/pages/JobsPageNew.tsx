import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_range?: string;
  experience_level?: string;
  posted_date?: string;
  apply_url?: string;
  is_remote?: boolean;
  employment_type?: string;
  required_skills?: string[];
  company_logo?: string;
  job_portal?: string;
}

interface Pagination {
  total_jobs: number;
  current_page: number;
  total_pages: number;
  has_next: boolean;
}

interface SearchFilters {
  location: string;
  experienceLevel: string;
  minSalary: string;
  maxSalary: string;
  employmentType: string;
  isRemote: boolean;
  companySize: string;
  industry: string;
  skills: string;
  datePosted: string;
}

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total_jobs: 0,
    current_page: 1,
    total_pages: 1,
    has_next: false
  });
  
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    experienceLevel: '',
    minSalary: '',
    maxSalary: '',
    employmentType: '',
    isRemote: false,
    companySize: '',
    industry: '',
    skills: '',
    datePosted: ''
  });

  const searchJobs = useCallback(async (query: string = searchQuery, page: number = 1, loadMore: boolean = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: query || 'software engineer',
        page: page.toString(),
        location: filters.location,
        experience_level: filters.experienceLevel,
        employment_type: filters.employmentType,
        is_remote: filters.isRemote.toString(),
        date_posted: filters.datePosted,
        skills: filters.skills
      });

      if (filters.minSalary) params.append('min_salary', filters.minSalary);
      if (filters.maxSalary) params.append('max_salary', filters.maxSalary);

      const response = await fetch(`/api/jobs/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (loadMore) {
        setJobs(prevJobs => [...prevJobs, ...(data.jobs || [])]);
      } else {
        setJobs(data.jobs || []);
      }
      
      setPagination(data.pagination || {
        total_jobs: data.jobs?.length || 0,
        current_page: page,
        total_pages: Math.ceil((data.jobs?.length || 0) / 20),
        has_next: false
      });
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Error searching jobs:', error);
      toast.error('Failed to search jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    searchJobs(searchQuery, 1, false);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    searchJobs(searchQuery, nextPage, true);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    searchJobs(searchQuery, 1, false);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      experienceLevel: '',
      minSalary: '',
      maxSalary: '',
      employmentType: '',
      isRemote: false,
      companySize: '',
      industry: '',
      skills: '',
      datePosted: ''
    });
  };

  // Initial search on component mount
  useEffect(() => {
    searchJobs('software engineer', 1, false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Filters
              </button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for jobs (e.g. Software Engineer, Data Scientist...)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="e.g. New York, Remote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  value={filters.experienceLevel}
                  onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Experience</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead/Principal</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                <select
                  value={filters.employmentType}
                  onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Posted</label>
                <select
                  value={filters.datePosted}
                  onChange={(e) => handleFilterChange('datePosted', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="3days">Last 3 days</option>
                  <option value="week">Last week</option>
                  <option value="month">Last month</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Salary</label>
                <input
                  type="number"
                  value={filters.minSalary}
                  onChange={(e) => handleFilterChange('minSalary', e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Salary</label>
                <input
                  type="number"
                  value={filters.maxSalary}
                  onChange={(e) => handleFilterChange('maxSalary', e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                <input
                  type="text"
                  value={filters.skills}
                  onChange={(e) => handleFilterChange('skills', e.target.value)}
                  placeholder="e.g. React, Python, AWS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remote"
                  checked={filters.isRemote}
                  onChange={(e) => handleFilterChange('isRemote', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remote" className="ml-2 block text-sm text-gray-900">
                  Remote Only
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Summary */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {jobs.length > 0 ? `${pagination.total_jobs.toLocaleString()} Jobs Found` : 'No Jobs Found'}
              </h2>
              {jobs.length > 0 && (
                <p className="text-gray-600 mt-1">
                  Showing {jobs.length} of {pagination.total_jobs.toLocaleString()} jobs
                </p>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && jobs.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 mx-auto text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg text-gray-600">Searching for jobs...</p>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {jobs.length > 0 && (
          <div className="grid gap-6 mb-8">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium">{job.company}</span>
                    </div>
                    <div className="flex items-center text-gray-500 mb-3">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{job.location}</span>
                      {job.is_remote && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Remote
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {job.salary_range && (
                      <div className="text-lg font-semibold text-green-600 mb-2">
                        {job.salary_range}
                      </div>
                    )}
                    {job.experience_level && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {job.experience_level}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {job.description}
                </p>

                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.required_skills.slice(0, 5).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                        {skill}
                      </span>
                    ))}
                    {job.required_skills.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-sm rounded">
                        +{job.required_skills.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    {job.posted_date && (
                      <span>Posted: {new Date(job.posted_date).toLocaleDateString()}</span>
                    )}
                    {job.job_portal && (
                      <span className="ml-4 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {job.job_portal}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                      }}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      View Details
                    </button>
                    {job.apply_url && (
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Apply Now
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && jobs.length > 0 && pagination.has_next && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Load More Jobs
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                clearFilters();
                searchJobs('', 1, false);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search & Filters
            </button>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h2>
                  <div className="flex items-center text-gray-600 mb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-medium text-lg">{selectedJob.company}</span>
                  </div>
                  <div className="flex items-center text-gray-500 mb-4">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{selectedJob.location}</span>
                    {selectedJob.is_remote && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        Remote
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {selectedJob.salary_range && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Salary</h3>
                    <p className="text-xl font-semibold text-green-600">{selectedJob.salary_range}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                  </div>
                </div>

                {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.required_skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  {selectedJob.experience_level && (
                    <div>
                      <h4 className="font-medium text-gray-900">Experience Level</h4>
                      <p className="text-gray-600">{selectedJob.experience_level}</p>
                    </div>
                  )}
                  {selectedJob.employment_type && (
                    <div>
                      <h4 className="font-medium text-gray-900">Employment Type</h4>
                      <p className="text-gray-600">{selectedJob.employment_type}</p>
                    </div>
                  )}
                  {selectedJob.posted_date && (
                    <div>
                      <h4 className="font-medium text-gray-900">Posted Date</h4>
                      <p className="text-gray-600">{new Date(selectedJob.posted_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedJob.job_portal && (
                    <div>
                      <h4 className="font-medium text-gray-900">Source</h4>
                      <p className="text-gray-600">{selectedJob.job_portal}</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {selectedJob.apply_url && (
                    <a
                      href={selectedJob.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
