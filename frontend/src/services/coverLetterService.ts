// Professional Cover Letter Service
import { apiClient, API_ENDPOINTS } from '../config/api';

export interface CoverLetterRequest {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  resumeId?: string;
}

export interface CoverLetterResponse {
  content: string;
  suggestions: string[];
}

export const generateCoverLetter = async (request: CoverLetterRequest): Promise<CoverLetterResponse> => {
  try {
    return await apiClient.post(API_ENDPOINTS.generateCoverLetter, request);
  } catch (error) {
    console.error('Cover letter generation failed:', error);
    throw new Error('Failed to generate cover letter. Please try again.');
  }
};

export default {
  generateCoverLetter
};