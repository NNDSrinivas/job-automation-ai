// Professional Resume Service with Advanced Features
import { apiClient, API_ENDPOINTS } from '../config/api';

export interface ResumeData {
  id: string;
  filename: string;
  content: string;
  parsed_data: any;
  is_primary: boolean;
  created_at: string;
  skill_match_score?: number;
  optimization_suggestions?: string[];
}

export interface ResumeUploadResponse {
  id: string;
  message: string;
  parsed_data: any;
  skill_analysis: {
    technical_skills: string[];
    soft_skills: string[];
    experience_level: string;
    missing_skills: string[];
  };
}

export class ResumeService {
  // Upload and parse resume with AI analysis
  static async uploadResume(file: File): Promise<ResumeUploadResponse> {
    try {
      return await apiClient.uploadFile(API_ENDPOINTS.uploadResume, file, 'resume');
    } catch (error) {
      console.error('Resume upload failed:', error);
      throw new Error('Failed to upload resume. Please try again.');
    }
  }

  // Get all user resumes
  static async getResumes(): Promise<ResumeData[]> {
    try {
      return await apiClient.get(API_ENDPOINTS.getResumes);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      throw new Error('Failed to load resumes.');
    }
  }

  // Set primary resume
  static async setPrimaryResume(resumeId: string): Promise<{ success: boolean }> {
    try {
      return await apiClient.post(API_ENDPOINTS.setPrimaryResume, { resume_id: resumeId });
    } catch (error) {
      console.error('Failed to set primary resume:', error);
      throw new Error('Failed to set primary resume.');
    }
  }

  // Delete resume
  static async deleteResume(resumeId: string): Promise<{ success: boolean }> {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.deleteResume}/${resumeId}`);
    } catch (error) {
      console.error('Failed to delete resume:', error);
      throw new Error('Failed to delete resume.');
    }
  }

  // AI-powered resume optimization
  static async optimizeResume(resumeId: string, targetJobDescription: string): Promise<{
    optimized_content: string;
    suggestions: string[];
    improvement_score: number;
  }> {
    try {
      return await apiClient.post(API_ENDPOINTS.optimizeResume, {
        resume_id: resumeId,
        job_description: targetJobDescription
      });
    } catch (error) {
      console.error('Resume optimization failed:', error);
      throw new Error('Failed to optimize resume.');
    }
  }

  // Parse resume from text/URL
  static async parseResumeFromText(content: string): Promise<any> {
    try {
      return await apiClient.post(API_ENDPOINTS.parseResume, { content });
    } catch (error) {
      console.error('Resume parsing failed:', error);
      throw new Error('Failed to parse resume content.');
    }
  }
}

// Export individual functions for easier importing
export const uploadResume = ResumeService.uploadResume;
export const getResumes = ResumeService.getResumes;
export const setPrimaryResume = ResumeService.setPrimaryResume;
export const deleteResume = ResumeService.deleteResume;
export const optimizeResume = ResumeService.optimizeResume;
export const parseResumeFromText = ResumeService.parseResumeFromText;

export default ResumeService;