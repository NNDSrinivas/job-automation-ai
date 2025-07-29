import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Get API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  via: string;
  apply_link: string;
  posted_at: string;
  salary: string;
  job_type: string;
  platform: string;
  // Enhanced fields for skill matching
  match_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  loading_match?: boolean;
}

interface JobSearchResponse {
  jobs: Job[];
  total: number;
  search_params: {
    keywords: string;
    location: string;
    engine: string;
    num_results: number;
  };
  metadata: {
    powered_by: string;
    engine: string;
    real_time: boolean;
  };
}

const JobListPage: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('Remote');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<JobSearchResponse | null>(null);
  const [currentUserId] = useState<number>(1); // TODO: Get from auth context

  const fetchJobMatch = async (job: Job): Promise<void> => {
    try {
      // Get resume text from localStorage or use a default
      const resumeText = localStorage.getItem("primary_resume_text") || 
        "Senior Software Engineer with 5+ years of experience in full-stack development. Proficient in JavaScript, TypeScript, React, Node.js, Python, Django, FastAPI, AWS, Docker, Kubernetes, PostgreSQL, MongoDB, Git, and Agile methodologies. Strong problem-solving skills and experience with microservices architecture.";

      const response = await axios.post(`${API_BASE_URL}/api/jobs/match`, {
        job_id: job.id || `job_${Date.now()}_${Math.random()}`,
        job_title: job.title,
        job_description: job.description,
        company: job.company,
        user_id: currentUserId,
        resume_text: resumeText
      });

      const matchData = response.data;
      
      // Update the job with match data
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === job.id 
            ? {
                ...j,
                match_score: matchData.match_score,
                matched_skills: matchData.matched_skills?.map((s: any) => s.skill) || [],
                missing_skills: matchData.missing_skills?.map((s: any) => s.skill) || [],
                loading_match: false
              }
            : j
        )
      );
    } catch (error) {
      console.error(`Failed to get match data for job ${job.id}:`, error);
      // Update job to remove loading state with fallback match score
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === job.id ? { 
            ...j, 
            loading_match: false,
            match_score: Math.round(calculateMatchPercentage(j)) // Fallback to simple calculation
          } : j
        )
      );
    }
  };

  const fetchJobs = async () => {
    if (!keywords.trim()) {
      toast.error('Please enter keywords to search');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/jobs/search`, {
        keywords,
        location,
        engine: 'google_jobs',
        num_results: 10,
      });
      
      setSearchResponse(res.data);
      const fetchedJobs = (res.data.jobs || []).map((job: Job, index: number) => ({
        ...job,
        id: job.id || `job_${Date.now()}_${index}`, // Ensure each job has a unique ID
        loading_match: true // Start with loading state for match data
      }));
      setJobs(fetchedJobs);
      
      if (fetchedJobs.length > 0) {
        toast.success(`Found ${res.data.total} jobs from ${res.data.search_params.engine}`);
        
        // Fetch match data for each job in parallel
        fetchedJobs.forEach(job => {
          fetchJobMatch(job);
        });
      } else {
        toast.warning('No jobs found. Try different keywords or location.');
      }
    } catch (error) {
      console.error('Job search error:', error);
      toast.error('Failed to fetch jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchJobs();
    }
  };

  const calculateMatchPercentage = (job: Job): number => {
    // Simple match calculation based on keyword presence in title/description
    const searchTerms = keywords.toLowerCase().split(' ');
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    
    let matches = 0;
    searchTerms.forEach(term => {
      if (term.length > 2 && jobText.includes(term)) {
        matches++;
      }
    });
    
    return Math.min(100, Math.max(60, (matches / searchTerms.length) * 100));
  };

  const getMatchColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🚀 Real-Time Job Search</h1>
        <p className="text-gray-600">Powered by SerpAPI • Search jobs from Google Jobs, LinkedIn, and Indeed</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords *
            </label>
            <input
              type="text"
              placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              placeholder="e.g., Remote, New York, San Francisco"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchJobs}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition duration-200 font-medium"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Searching...
                </div>
              ) : (
                '🔍 Search Jobs'
              )}
            </button>
          </div>
        </div>

        {/* Search Results Summary */}
        {searchResponse && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  ✅ Found {searchResponse.total} jobs
                </h3>
                <p className="text-green-700 text-sm">
                  Platform: {searchResponse.search_params.engine} • Real-time results from {searchResponse.metadata.powered_by}
                </p>
              </div>
              <div className="text-green-600">
                🎯 {searchResponse.metadata.real_time ? 'Live' : 'Cached'} Results
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for jobs...</p>
          </div>
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-6">
          {jobs.map((job, idx) => {
            // Use real AI match score if available, otherwise fallback to simple calculation
            const aiMatchScore = job.match_score;
            const fallbackMatchScore = Math.round(calculateMatchPercentage(job));
            const displayMatchScore = aiMatchScore || fallbackMatchScore;
            const isAiMatch = Boolean(aiMatchScore);
            const matchColorClass = getMatchColor(displayMatchScore);
            
            return (
              <div key={job.id || idx} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition duration-200">
                {/* Job Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{job.title}</h2>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <span className="flex items-center">
                        🏢 {job.company}
                      </span>
                      <span className="flex items-center">
                        📍 {job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center text-green-600 font-medium">
                          💰 {job.salary}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* AI Match Percentage */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${matchColorClass} relative`}>
                      {job.loading_match ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                          Analyzing...
                        </div>
                      ) : (
                        <>
                          {isAiMatch ? '🤖' : '🎯'} {displayMatchScore}% Match
                          {isAiMatch && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1">
                              AI
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      via {job.via || job.platform}
                    </div>
                  </div>
                </div>

                {/* AI Skills Analysis */}
                {job.matched_skills || job.missing_skills ? (
                  <div className="mb-4 bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.matched_skills && job.matched_skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-green-700 mb-2">✅ Matched Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {job.matched_skills.slice(0, 6).map((skill, idx) => (
                              <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                            {job.matched_skills.length > 6 && (
                              <span className="text-green-600 text-xs">+{job.matched_skills.length - 6} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {job.missing_skills && job.missing_skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-orange-700 mb-2">⚠️ Missing Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {job.missing_skills.slice(0, 6).map((skill, idx) => (
                              <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                            {job.missing_skills.length > 6 && (
                              <span className="text-orange-600 text-xs">+{job.missing_skills.length - 6} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Job Description Preview */}
                <div className="mb-4">
                  <p className="text-gray-700 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Job Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>📅 Posted: {job.posted_at || 'Recently'}</span>
                    {job.job_type && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        📋 {job.job_type}
                      </span>
                    )}
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      🔍 {job.platform}
                    </span>
                  </div>
                  
                  {job.apply_link && (
                    <a
                      href={job.apply_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200 font-medium"
                    >
                      Apply Now →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : searchResponse && jobs.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-yellow-800 mb-2">No Jobs Found</h3>
          <p className="text-yellow-700 mb-4">
            No jobs found for "{keywords}" in "{location}". Try:
          </p>
          <ul className="text-yellow-700 text-left max-w-md mx-auto space-y-1">
            <li>• Using different or broader keywords</li>
            <li>• Changing the location (try "Remote" or major cities)</li>
            <li>• Checking if your SerpAPI key is configured</li>
            <li>• Trying different search terms</li>
          </ul>
        </div>
      ) : null}

      {/* Getting Started Message */}
      {!searchResponse && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Ready to Find Your Next Job?</h3>
          <p className="text-blue-700 mb-4">
            Search for real-time job opportunities from top platforms using our AI-powered job search.
          </p>
          <p className="text-blue-600 text-sm">
            Enter keywords above and click "Search Jobs" to get started!
          </p>
        </div>
      )}
    </div>
  );
};

export default JobListPage;
