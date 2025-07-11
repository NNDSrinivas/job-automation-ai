# LinkedIn OAuth Integration
"""
This module handles LinkedIn OAuth authentication and API integration
for job searching and profile data access.
"""

import requests
import os
from typing import Dict, Optional, List
import logging
from urllib.parse import urlencode, parse_qs
import secrets
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class LinkedInOAuthClient:
    def __init__(self):
        self.client_id = os.getenv('LINKEDIN_CLIENT_ID')
        self.client_secret = os.getenv('LINKEDIN_CLIENT_SECRET')
        self.redirect_uri = os.getenv('LINKEDIN_REDIRECT_URI', 'http://localhost:8000/auth/linkedin/callback')
        self.base_url = 'https://api.linkedin.com'
        self.auth_url = 'https://www.linkedin.com/oauth/v2/authorization'
        self.token_url = 'https://www.linkedin.com/oauth/v2/accessToken'

        # OAuth scopes for job automation
        self.scopes = [
            'r_liteprofile',      # Basic profile info
            'r_emailaddress',     # Email address
            'w_member_social',    # Post on behalf of user
            'r_organization_social', # Company pages
            'rw_organization_admin'  # Manage company pages
        ]

    def get_authorization_url(self, state: str = None) -> str:
        """
        Generate LinkedIn OAuth authorization URL
        """
        if not state:
            state = secrets.token_urlsafe(32)

        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'state': state,
            'scope': ' '.join(self.scopes)
        }

        auth_url = f"{self.auth_url}?{urlencode(params)}"
        logger.info(f"Generated LinkedIn OAuth URL for state: {state}")

        return auth_url, state

    def exchange_code_for_token(self, code: str, state: str) -> Dict:
        """
        Exchange authorization code for access token
        """
        try:
            data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': self.redirect_uri,
                'client_id': self.client_id,
                'client_secret': self.client_secret
            }

            response = requests.post(self.token_url, data=data)
            response.raise_for_status()

            token_data = response.json()

            # Add expiration timestamp
            token_data['expires_at'] = datetime.utcnow() + timedelta(seconds=token_data['expires_in'])

            logger.info("Successfully exchanged LinkedIn code for access token")
            return token_data

        except Exception as e:
            logger.error(f"Error exchanging LinkedIn code for token: {str(e)}")
            raise

    def refresh_access_token(self, refresh_token: str) -> Dict:
        """
        Refresh LinkedIn access token
        """
        try:
            data = {
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'client_id': self.client_id,
                'client_secret': self.client_secret
            }

            response = requests.post(self.token_url, data=data)
            response.raise_for_status()

            token_data = response.json()
            token_data['expires_at'] = datetime.utcnow() + timedelta(seconds=token_data['expires_in'])

            logger.info("Successfully refreshed LinkedIn access token")
            return token_data

        except Exception as e:
            logger.error(f"Error refreshing LinkedIn token: {str(e)}")
            raise

    def get_profile_info(self, access_token: str) -> Dict:
        """
        Get LinkedIn profile information
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            # Get basic profile
            profile_url = f"{self.base_url}/v2/people/~"
            profile_fields = "id,firstName,lastName,profilePicture(displayImage~:playableStreams)"

            response = requests.get(
                f"{profile_url}?projection=({profile_fields})",
                headers=headers
            )
            response.raise_for_status()
            profile_data = response.json()

            # Get email address
            email_url = f"{self.base_url}/v2/emailAddress?q=members&projection=(elements*(handle~))"
            email_response = requests.get(email_url, headers=headers)
            email_response.raise_for_status()
            email_data = email_response.json()

            # Extract email
            email = None
            if email_data.get('elements'):
                email = email_data['elements'][0]['handle~']['emailAddress']

            # Combine data
            user_info = {
                'linkedin_id': profile_data.get('id'),
                'first_name': profile_data.get('firstName', {}).get('localized', {}).get('en_US', ''),
                'last_name': profile_data.get('lastName', {}).get('localized', {}).get('en_US', ''),
                'email': email,
                'profile_picture': self._extract_profile_picture(profile_data),
                'raw_profile': profile_data
            }

            logger.info(f"Successfully retrieved LinkedIn profile for user: {user_info['linkedin_id']}")
            return user_info

        except Exception as e:
            logger.error(f"Error getting LinkedIn profile: {str(e)}")
            raise

    def search_jobs(self, access_token: str, keywords: str, location: str = "", limit: int = 25) -> List[Dict]:
        """
        Search LinkedIn jobs (Note: This requires LinkedIn Jobs API access)
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            # LinkedIn Jobs API (requires special access)
            # For demo purposes, this is a placeholder
            # In practice, you'd need LinkedIn Partner API access

            params = {
                'keywords': keywords,
                'location': location,
                'start': 0,
                'count': limit
            }

            # Placeholder URL - actual LinkedIn Jobs API requires partnership
            jobs_url = f"{self.base_url}/v2/jobSearch"

            response = requests.get(jobs_url, headers=headers, params=params)

            if response.status_code == 403:
                logger.warning("LinkedIn Jobs API requires partner access")
                return self._get_linkedin_jobs_via_scraping(keywords, location, limit)

            response.raise_for_status()
            jobs_data = response.json()

            return self._format_linkedin_jobs(jobs_data)

        except Exception as e:
            logger.error(f"Error searching LinkedIn jobs: {str(e)}")
            # Fallback to web scraping method
            return self._get_linkedin_jobs_via_scraping(keywords, location, limit)

    def apply_to_linkedin_job(self, access_token: str, job_id: str, cover_letter: str = "") -> Dict:
        """
        Apply to LinkedIn job (requires special permissions)
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            # LinkedIn job application API (requires special access)
            application_data = {
                'jobPostingId': job_id,
                'coverLetter': cover_letter,
                'resume': {
                    'mediaType': 'application/pdf',
                    # Resume upload logic would go here
                }
            }

            # Placeholder URL - actual LinkedIn Application API requires partnership
            apply_url = f"{self.base_url}/v2/jobApplications"

            response = requests.post(apply_url, headers=headers, json=application_data)

            if response.status_code == 403:
                logger.warning("LinkedIn Job Application API requires partner access")
                return {
                    'status': 'redirect_required',
                    'message': 'User needs to apply manually on LinkedIn',
                    'job_url': f"https://www.linkedin.com/jobs/view/{job_id}"
                }

            response.raise_for_status()

            return {
                'status': 'success',
                'application_id': response.json().get('id'),
                'message': 'Successfully applied via LinkedIn API'
            }

        except Exception as e:
            logger.error(f"Error applying to LinkedIn job: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def get_user_connections(self, access_token: str) -> List[Dict]:
        """
        Get user's LinkedIn connections for networking insights
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            # Get connections (limited by LinkedIn API)
            connections_url = f"{self.base_url}/v2/connections?q=viewer"

            response = requests.get(connections_url, headers=headers)
            response.raise_for_status()

            connections_data = response.json()

            # Format connection data
            connections = []
            for connection in connections_data.get('elements', []):
                connections.append({
                    'id': connection.get('id'),
                    'name': self._format_name(connection),
                    'headline': connection.get('headline', ''),
                    'industry': connection.get('industry', ''),
                    'location': connection.get('location', {}).get('name', '')
                })

            return connections

        except Exception as e:
            logger.error(f"Error getting LinkedIn connections: {str(e)}")
            return []

    def _extract_profile_picture(self, profile_data: Dict) -> Optional[str]:
        """Extract profile picture URL from LinkedIn profile data"""
        try:
            picture_data = profile_data.get('profilePicture', {})
            display_image = picture_data.get('displayImage~', {})
            elements = display_image.get('elements', [])

            if elements:
                # Get the largest image
                largest_image = max(elements, key=lambda x: x.get('data', {}).get('com.linkedin.digitalmedia.mediaartifact.StillImage', {}).get('storageSize', {}).get('width', 0))
                identifiers = largest_image.get('identifiers', [])
                if identifiers:
                    return identifiers[0].get('identifier')

            return None

        except Exception:
            return None

    def _format_name(self, person_data: Dict) -> str:
        """Format LinkedIn name from API response"""
        first_name = person_data.get('firstName', {}).get('localized', {}).get('en_US', '')
        last_name = person_data.get('lastName', {}).get('localized', {}).get('en_US', '')
        return f"{first_name} {last_name}".strip()

    def _get_linkedin_jobs_via_scraping(self, keywords: str, location: str, limit: int) -> List[Dict]:
        """
        Fallback method to get LinkedIn jobs via web scraping
        (This is for demonstration - actual implementation needs careful compliance)
        """
        logger.info("Using LinkedIn web scraping fallback method")

        # This would integrate with your existing job scraper
        # For now, return placeholder data
        return [
            {
                'id': 'linkedin_job_1',
                'title': f'{keywords} Developer',
                'company': 'LinkedIn Company',
                'location': location or 'Remote',
                'description': f'Looking for a {keywords} developer...',
                'url': 'https://linkedin.com/jobs/view/123456',
                'platform': 'linkedin',
                'salary': '$80,000 - $120,000',
                'job_type': 'full-time',
                'posted_date': datetime.utcnow(),
                'scraped_at': datetime.utcnow()
            }
        ]

    def _format_linkedin_jobs(self, jobs_data: Dict) -> List[Dict]:
        """Format LinkedIn jobs API response"""
        jobs = []

        for job in jobs_data.get('elements', []):
            jobs.append({
                'id': job.get('id'),
                'title': job.get('title'),
                'company': job.get('companyDetails', {}).get('company', {}).get('name'),
                'location': job.get('formattedLocation'),
                'description': job.get('description', {}).get('text'),
                'url': f"https://www.linkedin.com/jobs/view/{job.get('id')}",
                'platform': 'linkedin',
                'salary': job.get('salaryInsights', {}).get('baseRange', {}).get('formattedText'),
                'job_type': job.get('workplaceType'),
                'posted_date': datetime.fromtimestamp(job.get('listedAt', 0) / 1000),
                'scraped_at': datetime.utcnow(),
                'raw_data': json.dumps(job)
            })

        return jobs

# Global LinkedIn client
linkedin_client = LinkedInOAuthClient()
