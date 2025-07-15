// Professional Job Search and Management Service
import { apiClient, API_ENDPOINTS } from '../config/api';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  platform: string;
  salary?: string;
  job_type: string;
  posted_date: string;
  match_score?: number;
  application_status?: 'not_applied' | 'applied' | 'in_progress' | 'rejected' | 'interview';
  skills_required: string[];
  experience_level: string;
  remote_option: boolean;
}

export interface JobSearchFilters {
  keywords?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  remote_only?: boolean;
  date_posted?: 'today' | 'week' | 'month';
  platforms?: string[];
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
  // Search jobs across multiple platforms
  static async searchJobs(filters: JobSearchFilters = {}): Promise<{
    jobs: Job[];
    total_count: number;
    page: number;
    has_more: boolean;
  }> {
    try {
      return await apiClient.post(API_ENDPOINTS.jobSearch, filters);
    } catch (error) {
      console.error('Job search failed:', error);
      throw new Error('Failed to search jobs. Please try again.');
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
