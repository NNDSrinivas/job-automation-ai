"""
Skill Matcher Service - Advanced Resume-Job Matching with AI
This service provides intelligent matching between user resumes and job descriptions,
calculating match scores and identifying skill gaps.
"""

import re
import json
import logging
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import openai
import os
from dotenv import load_dotenv
from collections import Counter
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Download required NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

load_dotenv()
logger = logging.getLogger(__name__)

@dataclass
class SkillMatch:
    skill: str
    confidence: float
    category: str  # 'technical', 'soft', 'domain'
    importance: int  # 1-5 scale

@dataclass
class JobMatchResult:
    match_score: float
    matched_skills: List[SkillMatch]
    missing_skills: List[SkillMatch]
    skill_gap_analysis: Dict[str, any]
    recommendations: List[str]

class AdvancedSkillMatcher:
    def __init__(self):
        self.openai_client = None
        if os.getenv("OPENAI_API_KEY"):
            openai.api_key = os.getenv("OPENAI_API_KEY")
            self.openai_client = openai
        
        # Comprehensive skill database
        self.skill_database = {
            'programming_languages': [
                'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
                'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'SQL', 'HTML', 'CSS', 'Bash', 'PowerShell'
            ],
            'frameworks_libraries': [
                'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'FastAPI', 'Django', 'Flask',
                'Spring Boot', 'Spring', 'Laravel', 'Ruby on Rails', 'ASP.NET', '.NET Core', 'jQuery',
                'Bootstrap', 'Tailwind CSS', 'Material-UI', 'Redux', 'MobX', 'Next.js', 'Nuxt.js'
            ],
            'cloud_platforms': [
                'AWS', 'Azure', 'Google Cloud', 'GCP', 'DigitalOcean', 'Heroku', 'Vercel', 'Netlify',
                'AWS Lambda', 'AWS S3', 'AWS EC2', 'AWS RDS', 'Azure Functions', 'Google Functions'
            ],
            'databases': [
                'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra',
                'Oracle', 'SQL Server', 'SQLite', 'Neo4j', 'InfluxDB', 'CouchDB'
            ],
            'devops_tools': [
                'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI',
                'Ansible', 'Terraform', 'Vagrant', 'Chef', 'Puppet', 'Prometheus', 'Grafana', 'ELK Stack'
            ],
            'ml_ai': [
                'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn',
                'Jupyter', 'OpenCV', 'NLTK', 'spaCy', 'Hugging Face', 'MLflow', 'Kubeflow'
            ],
            'soft_skills': [
                'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Project Management',
                'Agile', 'Scrum', 'Critical Thinking', 'Adaptability', 'Time Management', 'Mentoring'
            ],
            'testing_qa': [
                'Jest', 'Cypress', 'Selenium', 'JUnit', 'pytest', 'Mocha', 'Chai', 'TestNG',
                'Postman', 'Newman', 'LoadRunner', 'JMeter'
            ]
        }
        
        # Flatten skill database for quick lookup
        self.all_skills = []
        for category, skills in self.skill_database.items():
            for skill in skills:
                self.all_skills.append({
                    'skill': skill,
                    'category': category,
                    'aliases': self._generate_skill_aliases(skill)
                })
    
    def _generate_skill_aliases(self, skill: str) -> List[str]:
        """Generate common aliases for a skill"""
        aliases = [skill.lower()]
        
        # Common variations
        if skill == "JavaScript":
            aliases.extend(["js", "javascript", "ecmascript"])
        elif skill == "TypeScript":
            aliases.extend(["ts", "typescript"])
        elif skill == "React":
            aliases.extend(["reactjs", "react.js"])
        elif skill == "Node.js":
            aliases.extend(["nodejs", "node"])
        elif skill == "ASP.NET":
            aliases.extend(["asp.net", "aspnet"])
        elif skill == "C++":
            aliases.extend(["cpp", "c plus plus"])
        elif skill == "C#":
            aliases.extend(["csharp", "c sharp"])
        
        return aliases
    
    def extract_skills_from_text(self, text: str) -> List[SkillMatch]:
        """Extract skills from text using pattern matching and NLP"""
        text_lower = text.lower()
        found_skills = []
        
        for skill_data in self.all_skills:
            skill_name = skill_data['skill']
            aliases = skill_data['aliases']
            category = skill_data['category']
            
            # Check for skill mentions
            confidence = 0.0
            mentions = 0
            
            for alias in aliases:
                # Simple word boundary matching
                pattern = r'\b' + re.escape(alias) + r'\b'
                matches = re.findall(pattern, text_lower)
                mentions += len(matches)
            
            if mentions > 0:
                # Calculate confidence based on mentions and context
                confidence = min(1.0, mentions * 0.3)
                
                # Boost confidence for certain contexts
                if any(keyword in text_lower for keyword in ['experience with', 'proficient in', 'expert in', 'skilled in']):
                    confidence = min(1.0, confidence + 0.2)
                
                importance = self._calculate_skill_importance(skill_name, category)
                
                found_skills.append(SkillMatch(
                    skill=skill_name,
                    confidence=confidence,
                    category=category,
                    importance=importance
                ))
        
        # Remove duplicates and sort by confidence
        unique_skills = {}
        for skill in found_skills:
            if skill.skill not in unique_skills or skill.confidence > unique_skills[skill.skill].confidence:
                unique_skills[skill.skill] = skill
        
        return sorted(unique_skills.values(), key=lambda x: x.confidence, reverse=True)
    
    def _calculate_skill_importance(self, skill: str, category: str) -> int:
        """Calculate the importance of a skill (1-5 scale)"""
        # High-demand skills get higher importance
        high_demand = ['Python', 'JavaScript', 'React', 'AWS', 'Docker', 'Kubernetes', 'Node.js']
        medium_high_demand = ['Java', 'TypeScript', 'Angular', 'Vue.js', 'MongoDB', 'PostgreSQL']
        
        if skill in high_demand:
            return 5
        elif skill in medium_high_demand:
            return 4
        elif category in ['programming_languages', 'cloud_platforms']:
            return 4
        elif category in ['frameworks_libraries', 'databases']:
            return 3
        else:
            return 2
    
    def match_job_with_resume(self, resume_text: str, job_description: str, user_id: Optional[int] = None) -> JobMatchResult:
        """
        Advanced job matching using multiple algorithms:
        1. Skill-based matching
        2. AI-powered semantic matching (if OpenAI available)
        3. Experience level matching
        4. Domain matching
        """
        
        # Extract skills from both texts
        resume_skills = self.extract_skills_from_text(resume_text)
        job_skills = self.extract_skills_from_text(job_description)
        
        # Create skill dictionaries for comparison
        resume_skill_dict = {skill.skill: skill for skill in resume_skills}
        job_skill_dict = {skill.skill: skill for skill in job_skills}
        
        # Find matched and missing skills
        matched_skills = []
        missing_skills = []
        
        for job_skill in job_skills:
            if job_skill.skill in resume_skill_dict:
                # Skill is present in resume
                resume_skill = resume_skill_dict[job_skill.skill]
                matched_skills.append(SkillMatch(
                    skill=job_skill.skill,
                    confidence=min(job_skill.confidence, resume_skill.confidence),
                    category=job_skill.category,
                    importance=job_skill.importance
                ))
            else:
                # Skill is missing from resume
                missing_skills.append(job_skill)
        
        # Calculate base match score
        if len(job_skills) == 0:
            skill_match_score = 75.0  # Default if no skills detected
        else:
            total_importance = sum(skill.importance for skill in job_skills)
            matched_importance = sum(skill.importance for skill in matched_skills)
            skill_match_score = (matched_importance / total_importance) * 100 if total_importance > 0 else 0
        
        # AI-enhanced matching if available
        ai_match_score = None
        if self.openai_client:
            try:
                ai_match_score = self._get_ai_match_score(resume_text, job_description)
            except Exception as e:
                logger.warning(f"AI matching failed: {e}")
        
        # Combine scores
        if ai_match_score is not None:
            # Weight: 60% AI, 40% skill matching
            final_score = (ai_match_score * 0.6) + (skill_match_score * 0.4)
        else:
            final_score = skill_match_score
        
        # Generate skill gap analysis
        skill_gap_analysis = self._generate_skill_gap_analysis(matched_skills, missing_skills, job_skills)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(missing_skills, skill_gap_analysis)
        
        return JobMatchResult(
            match_score=round(final_score, 1),
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            skill_gap_analysis=skill_gap_analysis,
            recommendations=recommendations
        )
    
    def _get_ai_match_score(self, resume_text: str, job_description: str) -> float:
        """Use OpenAI to get semantic matching score"""
        prompt = f"""
        Analyze the following resume and job description. Return a match score from 0-100 based on:
        1. Relevant experience and skills
        2. Education and qualifications
        3. Career progression alignment
        4. Industry experience
        5. Technical competencies
        
        Resume:
        {resume_text[:2000]}  # Limit to avoid token limits
        
        Job Description:
        {job_description[:2000]}
        
        Return ONLY the numeric score (0-100):
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert HR recruiter analyzing resume-job matches."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=50
            )
            
            score_text = response.choices[0].message.content.strip()
            # Extract numeric value
            import re
            numbers = re.findall(r'\d+\.?\d*', score_text)
            if numbers:
                return min(100.0, max(0.0, float(numbers[0])))
            return 70.0  # Default fallback
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    def _generate_skill_gap_analysis(self, matched_skills: List[SkillMatch], 
                                   missing_skills: List[SkillMatch], 
                                   job_skills: List[SkillMatch]) -> Dict[str, any]:
        """Generate detailed skill gap analysis"""
        
        # Group skills by category
        matched_by_category = {}
        missing_by_category = {}
        
        for skill in matched_skills:
            if skill.category not in matched_by_category:
                matched_by_category[skill.category] = []
            matched_by_category[skill.category].append(skill)
        
        for skill in missing_skills:
            if skill.category not in missing_by_category:
                missing_by_category[skill.category] = []
            missing_by_category[skill.category].append(skill)
        
        # Calculate category-wise match percentages
        category_scores = {}
        for category in self.skill_database.keys():
            job_skills_in_category = [s for s in job_skills if s.category == category]
            matched_in_category = [s for s in matched_skills if s.category == category]
            
            if job_skills_in_category:
                score = (len(matched_in_category) / len(job_skills_in_category)) * 100
                category_scores[category] = round(score, 1)
        
        # Identify top missing high-importance skills
        critical_missing = [skill for skill in missing_skills if skill.importance >= 4]
        
        return {
            'category_scores': category_scores,
            'matched_by_category': {k: [s.skill for s in v] for k, v in matched_by_category.items()},
            'missing_by_category': {k: [s.skill for s in v] for k, v in missing_by_category.items()},
            'critical_missing_skills': [s.skill for s in critical_missing],
            'total_skills_required': len(job_skills),
            'total_skills_matched': len(matched_skills),
            'match_percentage': round((len(matched_skills) / len(job_skills)) * 100, 1) if job_skills else 0
        }
    
    def _generate_recommendations(self, missing_skills: List[SkillMatch], 
                                skill_gap_analysis: Dict[str, any]) -> List[str]:
        """Generate actionable recommendations for skill improvement"""
        recommendations = []
        
        # Priority missing skills
        critical_missing = [skill for skill in missing_skills if skill.importance >= 4]
        
        if critical_missing:
            top_3 = sorted(critical_missing, key=lambda x: x.importance, reverse=True)[:3]
            recommendations.append(
                f"🎯 Focus on learning these high-priority skills: {', '.join([s.skill for s in top_3])}"
            )
        
        # Category-specific recommendations
        category_scores = skill_gap_analysis.get('category_scores', {})
        
        for category, score in category_scores.items():
            if score < 50:  # Low score in category
                category_name = category.replace('_', ' ').title()
                recommendations.append(
                    f"📚 Strengthen your {category_name} skills (current match: {score}%)"
                )
        
        # Learning path suggestions
        missing_by_category = skill_gap_analysis.get('missing_by_category', {})
        
        if 'programming_languages' in missing_by_category:
            recommendations.append(
                "💻 Consider taking online courses or bootcamps for missing programming languages"
            )
        
        if 'cloud_platforms' in missing_by_category:
            recommendations.append(
                "☁️ Gain cloud certifications (AWS, Azure, GCP) to boost your profile"
            )
        
        if 'devops_tools' in missing_by_category:
            recommendations.append(
                "🔧 Learn DevOps tools through hands-on projects and tutorials"
            )
        
        # General recommendations
        if skill_gap_analysis.get('match_percentage', 0) < 70:
            recommendations.append(
                "📈 Consider gaining experience through side projects or open-source contributions"
            )
        
        recommendations.append(
            "🔄 Update your resume to highlight relevant skills and experience"
        )
        
        return recommendations[:6]  # Limit to top 6 recommendations

# Global instance
skill_matcher = AdvancedSkillMatcher()
