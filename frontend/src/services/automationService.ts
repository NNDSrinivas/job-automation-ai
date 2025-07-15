// Professional Automation Service - Core AI Features
import { apiClient, API_ENDPOINTS } from '../config/api';

export interface AutomationSettings {
  id?: string;
  enabled: boolean;
  platforms: string[];
  job_criteria: {
    keywords: string[];
    locations: string[];
    job_types: string[];
    experience_levels: string[];
    salary_min?: number;
    salary_max?: number;
    remote_only: boolean;
  };
  application_limits: {
    daily_limit: number;
    weekly_limit: number;
    monthly_limit: number;
  };
  auto_cover_letter: boolean;
  auto_follow_up: boolean;
  blacklisted_companies: string[];
  schedule: {
    days_of_week: number[]; // 0-6, Sunday to Saturday
    start_time: string; // HH:MM
    end_time: string; // HH:MM
    timezone: string;
  };
}

export interface AutomationStatus {
  is_running: boolean;
  current_session: {
    started_at: string;
    jobs_found: number;
    applications_sent: number;
    errors: number;
    current_platform: string;
    estimated_completion: string;
  } | null;
  next_scheduled_run: string | null;
  last_run: {
    completed_at: string;
    jobs_processed: number;
    applications_sent: number;
    success_rate: number;
    errors: string[];
  } | null;
}

export interface JobCredentials {
  id?: string;
  platform: string;
  username: string;
  password: string; // Will be encrypted
  is_active: boolean;
  last_verified: string | null;
  verification_status: 'pending' | 'verified' | 'failed';
}

export interface AutomationMetrics {
  total_applications: number;
  success_rate: number;
  response_rate: number;
  interview_rate: number;
  platforms_performance: Array<{
    platform: string;
    applications: number;
    success_rate: number;
    response_rate: number;
  }>;
  daily_stats: Array<{
    date: string;
    applications: number;
    responses: number;
  }>;
  top_keywords: Array<{
    keyword: string;
    applications: number;
    success_rate: number;
  }>;
}

export class AutomationService {
  // Get automation settings
  static async getSettings(): Promise<AutomationSettings> {
    try {
      return await apiClient.get(API_ENDPOINTS.automationSettings);
    } catch (error) {
      console.error('Failed to get automation settings:', error);
      throw new Error('Failed to load automation settings.');
    }
  }

  // Update automation settings
  static async updateSettings(settings: AutomationSettings): Promise<AutomationSettings> {
    try {
      return await apiClient.put(API_ENDPOINTS.automationSettings, settings);
    } catch (error) {
      console.error('Failed to update automation settings:', error);
      throw new Error('Failed to update automation settings.');
    }
  }

  // Start automation
  static async startAutomation(): Promise<{ success: boolean; message: string; session_id: string }> {
    try {
      return await apiClient.post(API_ENDPOINTS.startAutomation);
    } catch (error) {
      console.error('Failed to start automation:', error);
      throw new Error('Failed to start automation. Please check your settings and credentials.');
    }
  }

  // Stop automation
  static async stopAutomation(): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.post(API_ENDPOINTS.stopAutomation);
    } catch (error) {
      console.error('Failed to stop automation:', error);
      throw new Error('Failed to stop automation.');
    }
  }

  // Get automation status
  static async getStatus(): Promise<AutomationStatus> {
    try {
      return await apiClient.get(API_ENDPOINTS.automationStatus);
    } catch (error) {
      console.error('Failed to get automation status:', error);
      throw new Error('Failed to load automation status.');
    }
  }

  // Get automation metrics
  static async getMetrics(period: '7d' | '30d' | '90d' = '30d'): Promise<AutomationMetrics> {
    try {
      return await apiClient.get(`${API_ENDPOINTS.analytics}/automation?period=${period}`);
    } catch (error) {
      console.error('Failed to get automation metrics:', error);
      throw new Error('Failed to load automation metrics.');
    }
  }

  // Save job platform credentials
  static async saveCredentials(credentials: Omit<JobCredentials, 'id'>): Promise<JobCredentials> {
    try {
      return await apiClient.post(API_ENDPOINTS.saveCredentials, credentials);
    } catch (error) {
      console.error('Failed to save credentials:', error);
      throw new Error('Failed to save platform credentials.');
    }
  }

  // Get saved credentials
  static async getCredentials(): Promise<JobCredentials[]> {
    try {
      return await apiClient.get(API_ENDPOINTS.credentials);
    } catch (error) {
      console.error('Failed to get credentials:', error);
      throw new Error('Failed to load saved credentials.');
    }
  }

  // Test platform credentials
  static async testCredentials(credentialId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.post(API_ENDPOINTS.testCredentials, { credential_id: credentialId });
    } catch (error) {
      console.error('Failed to test credentials:', error);
      throw new Error('Failed to test platform credentials.');
    }
  }

  // Delete credentials
  static async deleteCredentials(credentialId: string): Promise<{ success: boolean }> {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.credentials}/${credentialId}`);
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      throw new Error('Failed to delete credentials.');
    }
  }

  // Get supported platforms
  static async getSupportedPlatforms(): Promise<Array<{
    id: string;
    name: string;
    logo_url: string;
    features: string[];
    is_premium: boolean;
  }>> {
    try {
      return await apiClient.get('/platforms/supported');
    } catch (error) {
      console.error('Failed to get supported platforms:', error);
      throw new Error('Failed to load supported platforms.');
    }
  }

  // Schedule automation
  static async scheduleAutomation(schedule: AutomationSettings['schedule']): Promise<{ success: boolean; next_run: string }> {
    try {
      return await apiClient.post('/automation/schedule', { schedule });
    } catch (error) {
      console.error('Failed to schedule automation:', error);
      throw new Error('Failed to schedule automation.');
    }
  }

  // Cancel scheduled automation
  static async cancelSchedule(): Promise<{ success: boolean }> {
    try {
      return await apiClient.delete('/automation/schedule');
    } catch (error) {
      console.error('Failed to cancel schedule:', error);
      throw new Error('Failed to cancel automation schedule.');
    }
  }

  // Get automation logs
  static async getLogs(limit: number = 100): Promise<Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    platform?: string;
    job_id?: string;
    details?: any;
  }>> {
    try {
      return await apiClient.get(`/automation/logs?limit=${limit}`);
    } catch (error) {
      console.error('Failed to get automation logs:', error);
      throw new Error('Failed to load automation logs.');
    }
  }

  // AI-powered job matching
  static async getAIRecommendations(preferences: {
    career_goals: string;
    preferred_industries: string[];
    skills_to_develop: string[];
    location_preferences: string[];
  }): Promise<{
    recommended_jobs: Array<{
      job_id: string;
      match_score: number;
      reasons: string[];
      growth_potential: number;
    }>;
    skill_gaps: string[];
    career_advice: string;
  }> {
    try {
      return await apiClient.post('/ai/job-recommendations', preferences);
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
      throw new Error('Failed to get AI job recommendations.');
    }
  }
}
