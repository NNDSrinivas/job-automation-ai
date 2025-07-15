import re
import json
from typing import Dict, List, Any
from docx import Document
import PyPDF2
import openai
import os

class AIResumeAnalyzer:
    def __init__(self):
        # Set OpenAI API key (in production, use environment variable)
        openai.api_key = os.getenv('OPENAI_API_KEY', 'your-openai-key-here')

        # Define skill categories for better analysis
        self.skill_categories = {
            'programming': ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin'],
            'web_frontend': ['React', 'Vue.js', 'Angular', 'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind'],
            'web_backend': ['Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'Laravel', 'Rails'],
            'databases': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Elasticsearch'],
            'cloud': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD'],
            'mobile': ['React Native', 'Flutter', 'iOS', 'Android', 'Xamarin'],
            'data_science': ['Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'R', 'Tableau', 'Power BI'],
            'devops': ['Git', 'GitHub', 'GitLab', 'JIRA', 'Agile', 'Scrum', 'Linux', 'Bash']
        }

    def parse_resume(self, file_path: str) -> Dict[str, Any]:
        """Parse resume and extract comprehensive information"""
        try:
            # Extract text based on file type
            if file_path.endswith('.pdf'):
                text = self._extract_text_from_pdf(file_path)
            elif file_path.endswith(('.doc', '.docx')):
                text = self._extract_text_from_docx(file_path)
            elif file_path.endswith('.txt'):
                # Support text files for testing
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            else:
                raise ValueError("Unsupported file format. Supported formats: PDF, DOC, DOCX, TXT")

            # Basic extraction
            basic_info = self._extract_basic_info(text, file_path)

            # AI-powered analysis
            ai_analysis = self._analyze_with_ai(text)

            # Combine results
            parsed_data = {
                **basic_info,
                'full_text': text[:2000],  # First 2000 chars for context
                'ai_analysis': ai_analysis,
                'technical_skills': self._categorize_skills(basic_info.get('skills', [])),
                'experience_level': self._determine_experience_level(text),
                'education_level': self._extract_education_level(text)
            }

            return parsed_data

        except Exception as e:
            print(f"Error parsing resume: {e}")
            return {"error": str(e), "basic_extracted": True}

    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return ""

    def _extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            print(f"Error reading DOCX: {e}")
            return ""

    def _extract_basic_info(self, text: str, file_path: str) -> Dict[str, Any]:
        """Extract basic information using regex"""
        return {
            "name": self._extract_name(text, file_path),
            "email": self._extract_email(text),
            "phone": self._extract_phone(text),
            "location": self._extract_location(text),
            "skills": self._extract_skills(text),
            "summary": self._extract_summary(text),
            "experience": self._extract_experience(text),
            "education": self._extract_education(text)
        }

    def _extract_name(self, text: str, file_path: str) -> str:
        """Extract name from resume"""
        # Try to get from filename first
        import os
        filename = os.path.basename(file_path)
        if "_Resume" in filename or "_CV" in filename:
            name_part = filename.split("_Resume")[0].split("_CV")[0].replace("_", " ")
            if name_part and len(name_part.split()) <= 4:  # Reasonable name length
                return name_part.strip()

        # Try to extract from first few lines
        lines = text.split('\n')[:5]
        for line in lines:
            line = line.strip()
            # Look for lines that might be names (2-4 words, proper case)
            words = line.split()
            if 2 <= len(words) <= 4 and all(word.istitle() for word in words if word.isalpha()):
                return line

        return "Name not found"

    def _extract_email(self, text: str) -> str:
        """Extract email address"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group(0) if match else ""

    def _extract_phone(self, text: str) -> str:
        """Extract phone number"""
        phone_patterns = [
            r'\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
            r'\+?([0-9]{1,3})[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})',
        ]

        for pattern in phone_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        return ""

    def _extract_location(self, text: str) -> str:
        """Extract location/address"""
        # Look for common location patterns
        location_patterns = [
            r'([A-Z][a-z]+,\s*[A-Z]{2})',  # City, ST
            r'([A-Z][a-z]+\s*[A-Z][a-z]*,\s*[A-Z]{2}\s*\d{5})',  # City, ST ZIP
        ]

        for pattern in location_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)

        # Look for lines containing location keywords
        lines = text.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['address', 'location', 'city', 'state']):
                return line.strip()

        return ""

    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical skills"""
        skills = []
        text_lower = text.lower()

        for category, skill_list in self.skill_categories.items():
            for skill in skill_list:
                if skill.lower() in text_lower:
                    skills.append(skill)

        # Look for additional skills in skills section
        skills_section = re.search(r'skills?\s*:?\s*(.*?)(?=\n\s*\n|\n[A-Z]|\Z)', text, re.IGNORECASE | re.DOTALL)
        if skills_section:
            skill_text = skills_section.group(1)
            # Extract comma or pipe separated values
            additional_skills = re.findall(r'[A-Za-z][A-Za-z0-9+#\.\-\s]*[A-Za-z0-9+#]', skill_text)
            skills.extend([skill.strip() for skill in additional_skills if len(skill.strip()) > 2])

        return list(set(skills))  # Remove duplicates

    def _extract_summary(self, text: str) -> str:
        """Extract professional summary"""
        summary_keywords = ['summary', 'objective', 'profile', 'about']
        lines = text.split('\n')

        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in summary_keywords):
                # Get next few lines as summary
                summary_lines = []
                for j in range(i+1, min(i+5, len(lines))):
                    if lines[j].strip() and not lines[j].isupper():
                        summary_lines.append(lines[j].strip())
                    elif lines[j].strip() == "":
                        continue
                    else:
                        break

                if summary_lines:
                    return ' '.join(summary_lines)

        # If no explicit summary, use first paragraph
        paragraphs = text.split('\n\n')
        if len(paragraphs) > 1:
            return paragraphs[1][:200] + "..." if len(paragraphs[1]) > 200 else paragraphs[1]

        return ""

    def _extract_experience(self, text: str) -> List[Dict[str, str]]:
        """Extract work experience"""
        experience = []
        # Look for experience section
        exp_pattern = r'(experience|employment|work history)\s*:?\s*(.*?)(?=\n\s*\n[A-Z]|\n\s*education|\n\s*skills|\Z)'
        match = re.search(exp_pattern, text, re.IGNORECASE | re.DOTALL)

        if match:
            exp_text = match.group(2)
            # Simple extraction - can be improved
            jobs = re.findall(r'([A-Z][^0-9\n]*?)\s*[-–]\s*([^0-9\n]*?)\s*(\d{4}.*?\d{4}|\d{4}.*?present)', exp_text, re.IGNORECASE)

            for job in jobs:
                experience.append({
                    'title': job[0].strip(),
                    'company': job[1].strip(),
                    'duration': job[2].strip()
                })

        return experience

    def _extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information"""
        education = []
        edu_pattern = r'education\s*:?\s*(.*?)(?=\n\s*\n[A-Z]|\n\s*experience|\n\s*skills|\Z)'
        match = re.search(edu_pattern, text, re.IGNORECASE | re.DOTALL)

        if match:
            edu_text = match.group(1)
            # Extract degree, school, year
            degrees = re.findall(r'([^0-9\n]*?(?:degree|bachelor|master|phd|certificate).*?)\s*[-–]\s*([^0-9\n]*?)\s*(\d{4})', edu_text, re.IGNORECASE)

            for degree in degrees:
                education.append({
                    'degree': degree[0].strip(),
                    'school': degree[1].strip(),
                    'year': degree[2].strip()
                })

        return education

    def _categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Categorize skills by type"""
        categorized = {category: [] for category in self.skill_categories.keys()}

        for skill in skills:
            for category, skill_list in self.skill_categories.items():
                if skill in skill_list:
                    categorized[category].append(skill)
                    break

        return {k: v for k, v in categorized.items() if v}  # Remove empty categories

    def _determine_experience_level(self, text: str) -> str:
        """Determine experience level"""
        text_lower = text.lower()

        # Count years of experience mentioned
        years_pattern = r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)'
        years_matches = re.findall(years_pattern, text_lower)

        if years_matches:
            max_years = max(int(year) for year in years_matches)
            if max_years >= 8:
                return "Senior"
            elif max_years >= 3:
                return "Mid-level"
            else:
                return "Junior"

        # Look for seniority keywords
        if any(word in text_lower for word in ['senior', 'lead', 'principal', 'architect']):
            return "Senior"
        elif any(word in text_lower for word in ['junior', 'entry', 'associate', 'intern']):
            return "Junior"
        else:
            return "Mid-level"

    def _extract_education_level(self, text: str) -> str:
        """Extract highest education level"""
        text_lower = text.lower()

        if any(word in text_lower for word in ['phd', 'doctorate', 'doctoral']):
            return "Doctorate"
        elif any(word in text_lower for word in ['master', 'mba', 'ms', 'ma']):
            return "Master's"
        elif any(word in text_lower for word in ['bachelor', 'bs', 'ba', 'bsc']):
            return "Bachelor's"
        elif any(word in text_lower for word in ['associate', 'aa', 'as']):
            return "Associate"
        else:
            return "High School"

    def _analyze_with_ai(self, text: str) -> Dict[str, Any]:
        """Use AI to analyze resume content"""
        try:
            # Simplified AI analysis without OpenAI API call for now
            # In production, you would use OpenAI API here

            prompt = f"""
            Analyze this resume and provide:
            1. Top 3 strengths
            2. Top 3 improvement suggestions
            3. Job market compatibility score (0-100)
            4. Recommended job roles

            Resume text: {text[:1500]}
            """

            # Mock AI response for now - replace with actual OpenAI call
            return {
                "strengths": self._generate_ai_strengths(text),
                "suggestions": self._generate_ai_suggestions(text),
                "job_match_score": self._calculate_job_match_score(text),
                "recommended_roles": self._suggest_job_roles(text)
            }

        except Exception as e:
            print(f"AI analysis error: {e}")
            return {
                "strengths": ["Professional formatting", "Clear structure"],
                "suggestions": ["Add more quantified achievements", "Include relevant certifications"],
                "job_match_score": 75,
                "recommended_roles": ["Software Developer", "Software Engineer"]
            }

    def _generate_ai_strengths(self, text: str) -> List[str]:
        """Generate AI-powered strengths analysis"""
        strengths = []
        text_lower = text.lower()

        # Technical skills analysis
        skill_count = len(self._extract_skills(text))
        if skill_count >= 10:
            strengths.append(f"Extensive technical skillset with {skill_count}+ technologies")
        elif skill_count >= 5:
            strengths.append(f"Solid technical foundation with {skill_count} relevant skills")

        # Experience analysis
        if 'years' in text_lower:
            years_mentioned = re.findall(r'(\d+)\+?\s*years?', text_lower)
            if years_mentioned:
                max_years = max(int(y) for y in years_mentioned)
                if max_years >= 5:
                    strengths.append(f"Experienced professional with {max_years}+ years")

        # Education analysis
        if any(degree in text_lower for degree in ['bachelor', 'master', 'phd']):
            strengths.append("Strong educational background")

        # Leadership indicators
        if any(word in text_lower for word in ['lead', 'manage', 'team', 'mentor']):
            strengths.append("Demonstrated leadership and team management experience")

        # Quantified achievements
        if re.search(r'\d+%|\$\d+|\d+[kKmM]\+', text):
            strengths.append("Includes quantified achievements and measurable results")

        # Certifications
        if any(word in text_lower for word in ['certified', 'certification', 'aws', 'azure', 'google cloud']):
            strengths.append("Industry certifications and continuous learning")

        return strengths[:3] if strengths else ["Professional presentation", "Clear formatting", "Relevant experience"]

    def _generate_ai_suggestions(self, text: str) -> List[str]:
        """Generate AI-powered improvement suggestions"""
        suggestions = []
        text_lower = text.lower()

        # Check for common missing elements
        if 'summary' not in text_lower and 'objective' not in text_lower:
            suggestions.append("Add a professional summary highlighting your key strengths")

        # Check for quantified achievements
        if not re.search(r'\d+%|\$\d+|\d+[kKmM]\+', text):
            suggestions.append("Include quantified achievements (percentages, dollar amounts, metrics)")

        # Check for technical skills section
        skill_count = len(self._extract_skills(text))
        if skill_count < 5:
            suggestions.append("Expand technical skills section with relevant technologies")

        # Check for certifications
        if 'certif' not in text_lower:
            suggestions.append("Consider adding relevant industry certifications")

        # Check for projects
        if 'project' not in text_lower:
            suggestions.append("Include notable projects with technologies used and outcomes")

        # Check for action verbs
        action_verbs = ['developed', 'implemented', 'designed', 'created', 'optimized', 'improved']
        if not any(verb in text_lower for verb in action_verbs):
            suggestions.append("Use more action verbs to describe accomplishments")

        return suggestions[:3] if suggestions else ["Consider updating formatting", "Add more specific details", "Include relevant keywords"]

    def _calculate_job_match_score(self, text: str) -> int:
        """Calculate job market compatibility score"""
        score = 60  # Base score

        # Technical skills boost
        skill_count = len(self._extract_skills(text))
        score += min(skill_count * 3, 20)  # Max 20 points for skills

        # Experience boost
        if any(word in text.lower() for word in ['years', 'experience']):
            score += 10

        # Education boost
        if any(degree in text.lower() for degree in ['bachelor', 'master', 'phd']):
            score += 5

        # Quantified achievements boost
        if re.search(r'\d+%|\$\d+|\d+[kKmM]\+', text):
            score += 10

        # Certifications boost
        if any(word in text.lower() for word in ['certified', 'certification']):
            score += 5

        return min(score, 95)  # Cap at 95

    def _suggest_job_roles(self, text: str) -> List[str]:
        """Suggest relevant job roles based on resume content"""
        skills = self._extract_skills(text)
        text_lower = text.lower()
        roles = []

        # Categorize based on skills
        if any(skill in skills for skill in ['React', 'Vue.js', 'Angular', 'JavaScript']):
            roles.append("Frontend Developer")

        if any(skill in skills for skill in ['Node.js', 'Python', 'Java', 'Spring Boot']):
            roles.append("Backend Developer")

        if any(skill in skills for skill in ['React', 'Node.js', 'Python', 'JavaScript']):
            roles.append("Full Stack Developer")

        if any(skill in skills for skill in ['AWS', 'Docker', 'Kubernetes', 'Jenkins']):
            roles.append("DevOps Engineer")

        if any(skill in skills for skill in ['Pandas', 'NumPy', 'TensorFlow', 'PyTorch']):
            roles.append("Data Scientist")

        if any(skill in skills for skill in ['React Native', 'Flutter', 'iOS', 'Android']):
            roles.append("Mobile Developer")

        # Check for leadership terms
        if any(word in text_lower for word in ['lead', 'senior', 'architect', 'principal']):
            roles = [f"Senior {role}" for role in roles]

        return roles[:3] if roles else ["Software Engineer", "Software Developer", "Technical Specialist"]

# Global instance
resume_analyzer = AIResumeAnalyzer()

def parse_resume(file_path: str) -> dict:
    """Main function to parse resume - maintains backward compatibility"""
    return resume_analyzer.parse_resume(file_path)
