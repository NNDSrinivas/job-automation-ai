import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import SignupPage from "./components/SignupPage";
import ResumeUpload from "./components/ResumeUpload";
import UserProfileForm from "./components/UserProfileForm"; // 👈 Import new component
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/upload" element={<ResumeUpload />} />
        <Route path="/profile" element={<UserProfileForm />} /> {/* 👈 New route */}
      </Routes>
    </Router>
  );
}

export default App;
