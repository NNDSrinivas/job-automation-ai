// src/services/resumeService.ts
export async function uploadResume(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("resume", file);
  
    const response = await fetch("http://localhost:5000/api/resume-parse", {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error("Resume upload failed");
    }
  
    return await response.json();
  }
  