import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';

// Get API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface SerpAPISearchProps {
  onResults?: (results: any) => void;
}

interface SerpAPIJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_link: string;
  posted_at: string;
  salary: string;
  job_type: string;
  thumbnail: string;
  platform: string;
  via: string;
}

interface SerpAPIResponse {
  jobs: SerpAPIJob[];
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

const SerpAPISearch: React.FC<SerpAPISearchProps> = ({ onResults }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SerpAPIResponse | null>(null);
  const [formData, setFormData] = useState({
    keywords: '',
    location: '',
    engine: 'google_jobs',
    num_results: 10
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.keywords.trim()) {
      showToast('Please enter keywords to search', 'error');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const searchPayload = {
        keywords: formData.keywords,
        location: formData.location || 'United States',
        engine: formData.engine,
        num_results: formData.num_results
      };

      const response = await fetch(`${API_BASE_URL}/api/jobs/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Search failed');
      }

      const data: SerpAPIResponse = await response.json();
      setResults(data);
      
      if (onResults) {
        onResults(data);
      }

      if (data.jobs.length === 0) {
        showToast('No jobs found. Try adjusting your search criteria.', 'warning');
      } else {
        showToast(`Found ${data.total} jobs from ${data.search_params.engine}`, 'success');
      }

    } catch (error) {
      console.error('SerpAPI search error:', error);
      showToast(error instanceof Error ? error.message : 'Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (salary: string) => {
    if (!salary) return null;
    return salary;
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      'Google Jobs': '🔍',
      'LinkedIn': '💼',
      'Indeed': '🌐'
    };
    return icons[platform] || '💼';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🚀 Real-Time Job Search with SerpAPI
        </h2>
        <p className="text-gray-600">
          Search real-time jobs from LinkedIn, Indeed, and Google Jobs using SerpAPI
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords *
            </label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
              placeholder="e.g., software engineer, data scientist"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., remote, New York, NY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform
            </label>
            <select
              name="engine"
              value={formData.engine}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="google_jobs">Google Jobs</option>
              <option value="linkedin_jobs">LinkedIn</option>
              <option value="indeed_jobs">Indeed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Results
            </label>
            <input
              type="number"
              name="num_results"
              value={formData.num_results}
              onChange={handleInputChange}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Searching...
            </div>
          ) : (
            '🔍 Search Jobs with SerpAPI'
          )}
        </button>
      </form>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800">
              ✅ Found {results.total} jobs from {results.search_params.engine}
            </h3>
            <p className="text-green-700 text-sm">
              Real-time search powered by SerpAPI • {results.metadata.powered_by}
            </p>
          </div>

          {results.jobs.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ No Jobs Found</h3>
              <p className="text-yellow-700">
                No jobs found for your search criteria. This might be because:
              </p>
              <ul className="list-disc list-inside mt-2 text-yellow-700 text-sm">
                <li>SerpAPI key is not configured (add your key to .env)</li>
                <li>Search terms are too specific</li>
                <li>No jobs available for the selected platform</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              {results.jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{job.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {getPlatformIcon(job.platform)} {job.platform}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <p className="text-gray-600">
                      🏢 {job.company} • 📍 {job.location}
                    </p>
                    
                    {formatSalary(job.salary) && (
                      <p className="text-green-600 font-medium">
                        💰 {formatSalary(job.salary)}
                      </p>
                    )}
                    
                    {job.job_type && (
                      <p className="text-blue-600 text-sm">
                        📋 {job.job_type}
                      </p>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-3">
                    {job.description}
                  </p>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      📅 Posted: {job.posted_at || 'Recently'}
                    </span>
                    {job.apply_link && (
                      <a
                        href={job.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition duration-200"
                      >
                        Apply Now →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SerpAPISearch;
