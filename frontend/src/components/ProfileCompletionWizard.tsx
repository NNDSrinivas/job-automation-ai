import React, { useState, useRef } from "react";

type Question = {
  key: string;
  text: string;
  type: string;
};

type Answers = { [key: string]: string };

// Stepper steps
const steps = [
  "Upload Resume",
  "Answer Questionnaire",
  "Profile Picture",
  "Certifications",
  "Education"
];

export default function ProfileCompletionWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [certifications, setCertifications] = useState<string>("");
  const [education, setEducation] = useState<string>("");
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const profilePicRef = useRef<HTMLInputElement | null>(null);

  // Mentor bot UI
  const MentorBot: React.FC<{ message: string }> = ({ message }) => (
    <div className="mentor-bot" style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
      <img src="/mentor-bot.png" alt="Mentor Bot" style={{ width: 48, borderRadius: "50%", marginRight: 12 }} />
      <span style={{ background: "#f5f5f5", padding: "8px 16px", borderRadius: 8 }}>{message}</span>
    </div>
  );

  // Step 1: Resume Upload
  const ResumeStep = () => (
    <div>
      <MentorBot message="Let's start by uploading your resume. I'll help auto-fill your info!" />
      <h2>Upload Your Resume</h2>
      <input type="file" accept=".pdf,.doc,.docx" ref={resumeInputRef} onChange={e => {
        const files = e.target.files;
        if (files && files.length > 0) setResumeFile(files[0]);
        else setResumeFile(null);
      }} />
      <button disabled={loading} onClick={handleResumeUpload}>Upload & Next</button>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );

  // Step 2: Questionnaire
  const QuestionnaireStep = () => (
    <div>
      <MentorBot message="Please answer these questions to complete your profile." />
      <h2>Answer Profile Questions</h2>
      {questions.length === 0 ? (
        <button disabled={loading} onClick={fetchQuestions}>Load Questions</button>
      ) : (
        <form onSubmit={handleQuestionnaireSubmit}>
          {questions.map((q: Question) => (
            <div key={q.key} className="question">
              <label>{q.text}</label>
              {q.type === "text" && (
                <input type="text" value={answers[q.key] || ""} onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))} />
              )}
              {q.type === "number" && (
                <input type="number" value={answers[q.key] || ""} onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))} />
              )}
              {q.type === "boolean" && (
                <select value={answers[q.key] || ""} onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              )}
              {q.type === "file" && (
                <input type="file" disabled />
              )}
              {q.type === "select" && (
                <select value={answers[q.key] || ""} onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="Asian">Asian</option>
                  <option value="Black">Black</option>
                  <option value="White">White</option>
                  <option value="Latino">Latino</option>
                  <option value="Other">Other</option>
                </select>
              )}
            </div>
          ))}
          <button disabled={loading} type="submit">Submit & Next</button>
        </form>
      )}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );

  // Step 3: Profile Picture
  const ProfilePictureStep = () => (
    <div>
      <MentorBot message="Add a professional profile picture (optional)." />
      <h2>Upload Profile Picture</h2>
      <input type="file" accept="image/*" ref={profilePicRef} onChange={e => {
        const files = e.target.files;
        if (files && files.length > 0) setProfilePic(files[0]);
        else setProfilePic(null);
      }} />
      <button disabled={loading} onClick={handleProfilePicUpload}>Upload & Next</button>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );

  // Step 4: Certifications
  const CertificationsStep = () => (
    <div>
      <MentorBot message="List any certifications you have." />
      <h2>Add Certifications</h2>
      <input type="text" placeholder="Certifications" value={certifications} onChange={e => setCertifications(e.target.value)} />
      <button disabled={loading} onClick={handleCertificationsSubmit}>Submit & Next</button>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );

  // Step 5: Education
  const EducationStep = () => (
    <div>
      <MentorBot message="Add your education details." />
      <h2>Add Education Details</h2>
      <input type="text" placeholder="Education" value={education} onChange={e => setEducation(e.target.value)} />
      <button disabled={loading} onClick={handleEducationSubmit}>Submit & Finish</button>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );

  // API handlers
  async function handleResumeUpload() {
    setLoading(true); setError(""); setSuccess("");
    if (!resumeFile) { setError("Please select a resume file."); setLoading(false); return; }
    const formData = new FormData();
    formData.append("file", resumeFile);
    try {
      const res = await fetch("/upload-resume", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Resume upload failed");
      setSuccess("Resume uploaded and parsed!");
      setStep(step + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  async function fetchQuestions() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/questionnaire-questions");
      if (!res.ok) throw new Error("Failed to load questions");
      const data = await res.json();
      setQuestions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  async function handleQuestionnaireSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(""); setSuccess("");
    try {
      for (const q of questions) {
        if (q.type === "file") continue;
        await fetch("/questionnaire-answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_key: q.key,
            question_text: q.text,
            answer: answers[q.key] || "",
            question_type: q.type
          })
        });
      }
      setSuccess("Answers submitted!");
      setStep(step + 1);
    } catch (e) {
      setError("Failed to submit answers");
    } finally { setLoading(false); }
  }

  async function handleProfilePicUpload() {
    setLoading(true); setError(""); setSuccess("");
    if (!profilePic) { setError("Please select a profile picture."); setLoading(false); return; }
    const formData = new FormData();
    formData.append("file", profilePic);
    try {
      const res = await fetch("/profile/picture", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Profile picture upload failed");
      setSuccess("Profile picture uploaded!");
      setStep(step + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  async function handleCertificationsSubmit() {
    setLoading(true); setError(""); setSuccess("");
    if (!certifications) { setError("Please enter certifications."); setLoading(false); return; }
    const formData = new FormData();
    formData.append("certifications", certifications);
    try {
      const res = await fetch("/profile/certifications", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Certifications upload failed");
      setSuccess("Certifications added!");
      setStep(step + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  async function handleEducationSubmit() {
    setLoading(true); setError(""); setSuccess("");
    if (!education) { setError("Please enter education details."); setLoading(false); return; }
    const formData = new FormData();
    formData.append("education", education);
    try {
      const res = await fetch("/profile/education", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Education upload failed");
      setSuccess("Education added!");
      setStep(step + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  // Render step
  const renderStep = () => {
    switch (step) {
      case 0:
        return <ResumeStep />;
      case 1:
        return <QuestionnaireStep />;
      case 2:
        return <ProfilePictureStep />;
      case 3:
        return <CertificationsStep />;
      case 4:
        return <EducationStep />;
      default:
        return <div>
          <MentorBot message="Profile setup complete! You're ready to apply for jobs." />
          <h2>Profile setup complete!</h2>
        </div>;
    }
  };

  // Progress bar
  const progress = Math.round((step / steps.length) * 100);

  return (
    <div className="profile-wizard" style={{ maxWidth: 500, margin: "0 auto", padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #eee" }}>
      <h1 style={{ textAlign: "center" }}>Complete Your Profile</h1>
      <div className="stepper" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        {steps.map((s, i) => (
          <span key={i} style={{ fontWeight: i === step ? "bold" : "normal", color: i === step ? "#007bff" : "#888" }}>{s}</span>
        ))}
      </div>
      <div className="progress-bar" style={{ height: 8, background: "#eee", borderRadius: 4, marginBottom: 24 }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "#007bff", borderRadius: 4, transition: "width 0.3s" }} />
      </div>
      <div className="step-content">{renderStep()}</div>
    </div>
  );
}
