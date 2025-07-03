import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-center">
      <h1 className="text-4xl font-bold mb-6">AI Job Application Assistant</h1>
      <p className="mb-8 text-lg text-gray-600 max-w-xl">
        Upload your resume, answer a few quick questions, and let AI apply to jobs that match your profile — automatically!
      </p>
      <button
        onClick={() => navigate("/signup")}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg"
      >
        Get Started
      </button>
    </div>
  );
}
