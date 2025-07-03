// types.ts

// Resume-related
export interface ResumeInfo {
    name: string;
    content: string;
    isPrimary: boolean;
  }

  // User profile info extracted from resume
  export interface UserProfile {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    education?: string[];
    experience?: string[];
    skills?: string[];
    summary?: string;
  }

  // For JD matching
  export interface JobMatchInput {
    resume_text: string;
    job_description: string;
  }

  // For cover letter generation
  export interface CoverLetterRequest {
    resume_text: string;
    job_description: string;
    company: string;
    position: string;
  }

  // Standard API error structure
  export interface APIError {
    message: string;
    statusCode?: number;
  }
