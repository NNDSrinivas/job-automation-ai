# Advanced Analytics and Reporting System
"""
This module provides comprehensive analytics for job applications,
success rates, market insights, and user performance tracking.
"""

from sqlalchemy.orm import Session
from models import User, Job, JobApplication
from db import get_db_session
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
import logging
from collections import defaultdict
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ApplicationMetrics:
    total_applications: int
    successful_applications: int
    pending_applications: int
    failed_applications: int
    success_rate: float
    avg_response_time: float
    top_platforms: List[Dict]
    top_companies: List[Dict]
    skill_demand: Dict[str, int]
    salary_insights: Dict

class AnalyticsEngine:
    def __init__(self):
        self.session = get_db_session()

    def get_user_analytics(self, user_id: int, days_back: int = 30) -> ApplicationMetrics:
        """
        Get comprehensive analytics for a specific user
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)

            # Get user applications
            applications = self.session.query(JobApplication).filter(
                JobApplication.user_id == user_id,
                JobApplication.applied_at >= cutoff_date
            ).all()

            if not applications:
                return ApplicationMetrics(
                    total_applications=0,
                    successful_applications=0,
                    pending_applications=0,
                    failed_applications=0,
                    success_rate=0.0,
                    avg_response_time=0.0,
                    top_platforms=[],
                    top_companies=[],
                    skill_demand={},
                    salary_insights={}
                )

            # Calculate basic metrics
            total = len(applications)
            successful = sum(1 for app in applications if app.applied_successfully)
            pending = sum(1 for app in applications if app.status == 'pending')
            failed = total - successful - pending
            success_rate = (successful / total) * 100 if total > 0 else 0

            # Platform performance
            platform_stats = defaultdict(lambda: {'total': 0, 'successful': 0})
            company_stats = defaultdict(lambda: {'total': 0, 'successful': 0})

            for app in applications:
                job = self.session.query(Job).filter(Job.id == app.job_id).first()
                if job:
                    platform = job.platform
                    company = job.company

                    platform_stats[platform]['total'] += 1
                    company_stats[company]['total'] += 1

                    if app.applied_successfully:
                        platform_stats[platform]['successful'] += 1
                        company_stats[company]['successful'] += 1

            # Top platforms by success rate
            top_platforms = []
            for platform, stats in platform_stats.items():
                success_rate_platform = (stats['successful'] / stats['total']) * 100
                top_platforms.append({
                    'platform': platform,
                    'total_applications': stats['total'],
                    'successful': stats['successful'],
                    'success_rate': round(success_rate_platform, 2)
                })
            top_platforms.sort(key=lambda x: x['success_rate'], reverse=True)

            # Top companies by applications
            top_companies = []
            for company, stats in company_stats.items():
                top_companies.append({
                    'company': company,
                    'total_applications': stats['total'],
                    'successful': stats['successful']
                })
            top_companies.sort(key=lambda x: x['total_applications'], reverse=True)
            top_companies = top_companies[:10]  # Top 10 companies

            # Calculate average response time (for completed applications)
            response_times = []
            for app in applications:
                if app.completed_at and app.applied_at:
                    delta = app.completed_at - app.applied_at
                    response_times.append(delta.total_seconds() / 60)  # in minutes

            avg_response_time = sum(response_times) / len(response_times) if response_times else 0

            # Skill demand analysis (from job descriptions)
            skill_demand = self._analyze_skill_demand(applications)

            # Salary insights
            salary_insights = self._analyze_salary_trends(applications)

            return ApplicationMetrics(
                total_applications=total,
                successful_applications=successful,
                pending_applications=pending,
                failed_applications=failed,
                success_rate=round(success_rate, 2),
                avg_response_time=round(avg_response_time, 2),
                top_platforms=top_platforms,
                top_companies=top_companies,
                skill_demand=skill_demand,
                salary_insights=salary_insights
            )

        except Exception as e:
            logger.error(f"Error generating user analytics: {str(e)}")
            raise

    def get_market_insights(self, location: Optional[str] = None, industry: Optional[str] = None) -> Dict:
        """
        Get market insights and trends
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=30)

            query = self.session.query(Job).filter(Job.scraped_at >= cutoff_date)

            if location:
                query = query.filter(Job.location.contains(location))

            jobs = query.all()

            if not jobs:
                return {'message': 'No market data available'}

            # Job growth trends
            job_counts_by_day = defaultdict(int)
            for job in jobs:
                day = job.scraped_at.date()
                job_counts_by_day[day] += 1

            # Most in-demand skills
            skill_mentions = defaultdict(int)
            common_skills = [
                'python', 'javascript', 'react', 'node', 'sql', 'aws', 'docker',
                'kubernetes', 'machine learning', 'data science', 'api', 'rest',
                'frontend', 'backend', 'full stack', 'devops', 'ci/cd'
            ]

            for job in jobs:
                description = job.description.lower()
                for skill in common_skills:
                    if skill in description:
                        skill_mentions[skill] += 1

            # Salary ranges by platform
            salary_by_platform = defaultdict(list)
            for job in jobs:
                if job.salary:
                    salary_by_platform[job.platform].append(job.salary)

            # Top hiring companies
            company_job_counts = defaultdict(int)
            for job in jobs:
                company_job_counts[job.company] += 1

            top_companies = sorted(company_job_counts.items(), key=lambda x: x[1], reverse=True)[:10]

            return {
                'total_jobs_last_30_days': len(jobs),
                'daily_job_postings': dict(job_counts_by_day),
                'top_skills_demand': dict(sorted(skill_mentions.items(), key=lambda x: x[1], reverse=True)[:15]),
                'salary_by_platform': dict(salary_by_platform),
                'top_hiring_companies': [{'company': company, 'job_count': count} for company, count in top_companies],
                'job_type_distribution': self._get_job_type_distribution(jobs),
                'location_trends': self._get_location_trends(jobs)
            }

        except Exception as e:
            logger.error(f"Error generating market insights: {str(e)}")
            raise

    def get_application_success_predictions(self, user_id: int, job_id: int) -> Dict:
        """
        Predict application success based on historical data
        """
        try:
            # Get user's historical applications
            user_applications = self.session.query(JobApplication).filter(
                JobApplication.user_id == user_id
            ).all()

            if len(user_applications) < 5:
                return {
                    'prediction': 'insufficient_data',
                    'confidence': 0,
                    'message': 'Need at least 5 previous applications for prediction'
                }

            # Get target job
            target_job = self.session.query(Job).filter(Job.id == job_id).first()
            if not target_job:
                return {'error': 'Job not found'}

            # Calculate success factors
            platform_success_rate = self._calculate_platform_success_rate(user_id, target_job.platform)
            company_size_factor = self._get_company_size_factor(target_job.company)
            skill_match_score = self._calculate_skill_match(user_id, target_job.description)

            # Simple prediction algorithm (can be enhanced with ML)
            base_score = platform_success_rate * 0.4 + skill_match_score * 0.5 + company_size_factor * 0.1

            prediction_level = 'low'
            if base_score > 0.7:
                prediction_level = 'high'
            elif base_score > 0.4:
                prediction_level = 'medium'

            return {
                'prediction': prediction_level,
                'confidence': round(base_score * 100, 2),
                'factors': {
                    'platform_success_rate': round(platform_success_rate * 100, 2),
                    'skill_match_score': round(skill_match_score * 100, 2),
                    'company_factor': round(company_size_factor * 100, 2)
                },
                'recommendations': self._get_application_recommendations(base_score, target_job)
            }

        except Exception as e:
            logger.error(f"Error predicting application success: {str(e)}")
            raise

    def _analyze_skill_demand(self, applications: List[JobApplication]) -> Dict[str, int]:
        """Analyze skill demand from job descriptions"""
        skill_mentions = defaultdict(int)

        common_skills = [
            'python', 'javascript', 'react', 'node.js', 'sql', 'aws', 'docker',
            'kubernetes', 'machine learning', 'data science', 'api', 'rest',
            'typescript', 'mongodb', 'postgresql', 'redis', 'git', 'agile'
        ]

        for app in applications:
            job = self.session.query(Job).filter(Job.id == app.job_id).first()
            if job and job.description:
                description = job.description.lower()
                for skill in common_skills:
                    if skill in description:
                        skill_mentions[skill] += 1

        return dict(skill_mentions)

    def _analyze_salary_trends(self, applications: List[JobApplication]) -> Dict:
        """Analyze salary trends from applications"""
        salaries = []
        salary_by_platform = defaultdict(list)

        for app in applications:
            job = self.session.query(Job).filter(Job.id == app.job_id).first()
            if job and job.salary:
                # Extract numeric salary (simple extraction)
                import re
                salary_numbers = re.findall(r'\d+,?\d*', job.salary)
                if salary_numbers:
                    try:
                        salary_value = int(salary_numbers[0].replace(',', ''))
                        salaries.append(salary_value)
                        salary_by_platform[job.platform].append(salary_value)
                    except:
                        continue

        if not salaries:
            return {'message': 'No salary data available'}

        return {
            'average_salary': round(sum(salaries) / len(salaries), 2),
            'min_salary': min(salaries),
            'max_salary': max(salaries),
            'salary_range_25th': sorted(salaries)[len(salaries)//4],
            'salary_range_75th': sorted(salaries)[3*len(salaries)//4],
            'by_platform': {
                platform: {
                    'average': round(sum(sals) / len(sals), 2),
                    'count': len(sals)
                } for platform, sals in salary_by_platform.items() if sals
            }
        }

    def _get_job_type_distribution(self, jobs: List[Job]) -> Dict:
        """Get distribution of job types"""
        job_types = defaultdict(int)
        for job in jobs:
            if job.job_type:
                job_types[job.job_type] += 1
            else:
                # Try to infer from title/description
                title_lower = job.title.lower()
                if 'intern' in title_lower:
                    job_types['internship'] += 1
                elif 'contract' in title_lower or 'freelance' in title_lower:
                    job_types['contract'] += 1
                elif 'part-time' in title_lower or 'part time' in title_lower:
                    job_types['part-time'] += 1
                else:
                    job_types['full-time'] += 1

        return dict(job_types)

    def _get_location_trends(self, jobs: List[Job]) -> Dict:
        """Get location-based trends"""
        location_counts = defaultdict(int)
        for job in jobs:
            if job.location:
                # Normalize location (extract city/state)
                location_parts = job.location.split(',')
                if location_parts:
                    city = location_parts[0].strip()
                    location_counts[city] += 1

        # Sort by job count
        sorted_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)

        return {
            'top_locations': [
                {'location': loc, 'job_count': count}
                for loc, count in sorted_locations[:15]
            ],
            'remote_jobs': location_counts.get('Remote', 0) + location_counts.get('remote', 0)
        }

    def _calculate_platform_success_rate(self, user_id: int, platform: str) -> float:
        """Calculate user's success rate on specific platform"""
        platform_apps = self.session.query(JobApplication).join(Job).filter(
            JobApplication.user_id == user_id,
            Job.platform == platform
        ).all()

        if not platform_apps:
            return 0.5  # Default neutral score

        successful = sum(1 for app in platform_apps if app.applied_successfully)
        return successful / len(platform_apps)

    def _get_company_size_factor(self, company: str) -> float:
        """Get company size factor (simplified)"""
        # This could be enhanced with actual company data
        large_companies = ['google', 'microsoft', 'amazon', 'apple', 'facebook', 'meta']

        if any(comp in company.lower() for comp in large_companies):
            return 0.3  # Harder to get into large companies
        else:
            return 0.7  # Easier for smaller companies

    def _calculate_skill_match(self, user_id: int, job_description: str) -> float:
        """Calculate skill match between user and job (simplified)"""
        # This could use the existing match_jd function
        # For now, return a random score between 0.3 and 0.9
        import random
        return random.uniform(0.3, 0.9)

    def _get_application_recommendations(self, score: float, job: Job) -> List[str]:
        """Get recommendations to improve application success"""
        recommendations = []

        if score < 0.5:
            recommendations.extend([
                "Consider customizing your resume for this specific role",
                "Research the company culture and values before applying",
                "Highlight relevant experience in your cover letter"
            ])

        if 'startup' in job.company.lower():
            recommendations.append("Emphasize your adaptability and willingness to wear multiple hats")

        if 'senior' in job.title.lower() and score < 0.6:
            recommendations.append("Ensure you meet the experience requirements for this senior role")

        if not recommendations:
            recommendations.append("Your profile looks like a good match for this position!")

        return recommendations

    def close(self):
        """Close database session"""
        if self.session:
            self.session.close()

# Global analytics instance
analytics_engine = AnalyticsEngine()
