const BASE_URL = 'http://localhost:8000'; // Update if your backend runs elsewhere

export const generateCoverLetter = async (
  resumeText: string,
  jobDescription: string,
  company: string,
  position: string
): Promise<string> => {
  try {
    const response = await fetch(`${BASE_URL}/generate-cover-letter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
        company,
        position,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate cover letter: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cover_letter;
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
};
