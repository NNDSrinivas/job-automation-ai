// Professional Job Search and Management Service
import { apiClient, API_ENDPOINTS } from '../config/api';

// Add API_BASE_URL for direct fetch calls
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://your-domain.com/api';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url?: string;
  portal_url?: string;
  apply_url?: string;
  platform?: string;
  portal?: string;
  portal_display_name?: string;
  salary?: string;
  salary_range?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  job_type: string;
  posted_date: string;
  match_score?: number;
  application_status?: 'not_applied' | 'applied' | 'in_progress' | 'rejected' | 'interview';
  skills_required: string[];
  experience_level: string;
  remote_option?: boolean;
  remote_ok?: boolean;
  company_logo?: string;
  rating?: number;
  requirements?: string;
  urgent?: boolean;
  easy_apply?: boolean;
  company_size?: string;
  glassdoor_rating?: number;
  salary_insights?: boolean;
  remote_friendly?: boolean;
  contract_opportunity?: boolean;
  skill_analysis?: {
    match_percentage: number;
    matched_skills: string[];
    missing_skills: string[];
    skill_gaps: string[];
  };
}

export interface JobSearchFilters {
  keywords?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  company_size?: string;
  remote_ok?: boolean;
  posted_days?: number;
  portals?: string[];
  page?: number;
  limit?: number;
  sort_by?: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  status: string;
  applied_date: string;
  last_updated: string;
  cover_letter_id?: string;
  resume_id: string;
  notes?: string;
  interview_scheduled?: string;
}

export class JobService {
  // Search jobs across multiple platforms using enhanced backend
  static async searchJobs(filters: JobSearchFilters = {}): Promise<{
    jobs: Job[];
    pagination: any;
    filters_applied: any;
  }> {
    try {
      const params = new URLSearchParams();
      
      // Add all filter parameters
      if (filters.keywords) params.append('keywords', filters.keywords);
      if (filters.location) params.append('location', filters.location);
      if (filters.job_type) params.append('job_type', filters.job_type);
      if (filters.experience_level) params.append('experience_level', filters.experience_level);
      if (filters.salary_min) params.append('salary_min', filters.salary_min.toString());
      if (filters.salary_max) params.append('salary_max', filters.salary_max.toString());
      if (filters.company_size) params.append('company_size', filters.company_size);
      if (filters.remote_ok !== undefined) params.append('remote_ok', filters.remote_ok.toString());
      if (filters.posted_days) params.append('posted_days', filters.posted_days.toString());
      if (filters.portals && filters.portals.length > 0) {
        params.append('portals', filters.portals.join(','));
      }
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sort_by) params.append('sort_by', filters.sort_by);

      const response = await fetch(`${API_BASE_URL}/api/jobs/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Job search response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error searching jobs:', error);
      throw new Error('Failed to search jobs. Please try again.');
    }
  }

  // Get available job portals
  static async getJobPortals(): Promise<any[]> {
    try {
      console.log('🔍 Fetching job portals...');
      const response = await fetch(`${API_BASE_URL}/api/jobs/portals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch portals: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Portals response:', data);
      return data.portals; // Extract portals array from response
    } catch (error) {
      console.error('❌ Error fetching job portals:', error);
      throw new Error('Failed to fetch job portals.');
    }
  }

  // Get available filter options
  static async getFilterOptions(): Promise<any> {
    try {
      console.log('🔍 Fetching filter options...');
      const response = await fetch(`${API_BASE_URL}/api/jobs/filters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch filters: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Filters response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching filter options:', error);
      throw new Error('Failed to fetch filter options.');
    }
  }

  // Get job recommendations based on profile
  static async getRecommendations(limit: number = 20): Promise<Job[]> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.jobs}/recommendations?limit=${limit}`);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw new Error('Failed to load job recommendations.');
    }
  }

  // Scrape jobs from specific platforms
  static async scrapeJobs(platforms: string[], keywords: string): Promise<{
    total_scraped: number;
    new_jobs: number;
    platforms_scraped: string[];
  }> {
    try {
      return await apiClient.post(API_ENDPOINTS.jobScrape, {
        platforms,
        keywords
      });
    } catch (error) {
      console.error('Job scraping failed:', error);
      throw new Error('Failed to scrape jobs.');
    }
  }

  // Match jobs with user profile/resume
  static async matchJobs(jobIds: string[]): Promise<Array<{
    job_id: string;
    match_score: number;
    matching_skills: string[];
    missing_skills: string[];
    recommendations: string[];
  }>> {
    try {
      return await apiClient.post(API_ENDPOINTS.jobMatch, { job_ids: jobIds });
    } catch (error) {
      console.error('Job matching failed:', error);
      throw new Error('Failed to match jobs.');
    }
  }

  // Get job details
  static async getJobDetails(jobId: string): Promise<Job> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.jobs}/${jobId}`);
    } catch (error) {
      console.error('Failed to get job details:', error);
      throw new Error('Failed to load job details.');
    }
  }

  // Save job for later
  static async saveJob(jobId: string): Promise<{ success: boolean }> {
    try {
      return await apiClient.post(`${API_ENDPOINTS.jobs}/${jobId}/save`);
    } catch (error) {
      console.error('Failed to save job:', error);
      throw new Error('Failed to save job.');
    }
  }

  // Get saved jobs
  static async getSavedJobs(): Promise<Job[]> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.jobs}/saved`);
    } catch (error) {
      console.error('Failed to get saved jobs:', error);
      throw new Error('Failed to load saved jobs.');
    }
  }

  // Apply to job
  static async applyToJob(jobId: string, resumeId: string, coverLetterId?: string): Promise<{
    application_id: string;
    status: string;
    message: string;
  }> {
    try {
      return await apiClient.post(API_ENDPOINTS.applyToJob, {
        job_id: jobId,
        resume_id: resumeId,
        cover_letter_id: coverLetterId
      });
    } catch (error) {
      console.error('Job application failed:', error);
      throw new Error('Failed to apply to job.');
    }
  }

  // Bulk apply to multiple jobs
  static async bulkApply(jobIds: string[], resumeId: string, generateCoverLetters: boolean = true): Promise<{
    successful_applications: number;
    failed_applications: number;
    application_ids: string[];
    errors: string[];
  }> {
    try {
      return await apiClient.post(API_ENDPOINTS.bulkApply, {
        job_ids: jobIds,
        resume_id: resumeId,
        generate_cover_letters: generateCoverLetters
      });
    } catch (error) {
      console.error('Bulk application failed:', error);
      throw new Error('Failed to apply to jobs.');
    }
  }

  // Get applications
  static async getApplications(): Promise<JobApplication[]> {
    try {
      return await apiClient.get(API_ENDPOINTS.applications);
    } catch (error) {
      console.error('Failed to get applications:', error);
      throw new Error('Failed to load applications.');
    }
  }

  // Update application status
  static async updateApplicationStatus(applicationId: string, status: string, notes?: string): Promise<{ success: boolean }> {
    try {
      return await apiClient.put(`${API_ENDPOINTS.applications}/${applicationId}`, {
        status,
        notes
      });
    } catch (error) {
      console.error('Failed to update application:', error);
      throw new Error('Failed to update application status.');
    }
  }

  // Get application analytics
  static async getApplicationAnalytics(): Promise<{
    total_applications: number;
    response_rate: number;
    interview_rate: number;
    platforms_breakdown: Record<string, number>;
    monthly_stats: Array<{ month: string; applications: number; responses: number }>;
  }> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.analytics}/applications`);
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw new Error('Failed to load application analytics.');
    }
  }
}
