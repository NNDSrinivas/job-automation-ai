# Enhanced User Profile Management System
"""
This module provides comprehensive user profile management
including all fields required by major job boards for seamless auto-application.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from models import Base
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import json
from enum import Enum

class WorkAuthorizationStatus(str, Enum):
    US_CITIZEN = "us_citizen"
    PERMANENT_RESIDENT = "permanent_resident"
    H1B = "h1b"
    F1_OPT = "f1_opt"
    F1_CPT = "f1_cpt"
    TN_VISA = "tn_visa"
    OTHER_VISA = "other_visa"
    REQUIRE_SPONSORSHIP = "require_sponsorship"
    NO_AUTHORIZATION = "no_authorization"

class EducationLevel(str, Enum):
    HIGH_SCHOOL = "high_school"
    ASSOCIATE = "associate"
    BACHELOR = "bachelor"
    MASTER = "master"
    PHD = "phd"
    PROFESSIONAL = "professional"
    CERTIFICATE = "certificate"
    BOOTCAMP = "bootcamp"

class ExperienceLevel(str, Enum):
    ENTRY_LEVEL = "entry_level"
    JUNIOR = "junior"
    MID_LEVEL = "mid_level"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"
    DIRECTOR = "director"
    VP = "vp"
    C_LEVEL = "c_level"

class JobType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"

class WorkMode(str, Enum):
    REMOTE = "remote"
    ONSITE = "onsite"
    HYBRID = "hybrid"
    FLEXIBLE = "flexible"

# Enhanced User Profile Model
class EnhancedUserProfile(Base):
    __tablename__ = "enhanced_user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, unique=True)

    # Personal Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100))
    preferred_name = Column(String(100))
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    secondary_phone = Column(String(20))

    # Address Information
    street_address = Column(String(255))
    apartment_unit = Column(String(50))
    city = Column(String(100))
    state_province = Column(String(100))
    zip_postal_code = Column(String(20))
    country = Column(String(100), default="United States")

    # Work Authorization
    work_authorization = Column(String(50))  # WorkAuthorizationStatus enum
    visa_status = Column(String(100))
    visa_expiry_date = Column(DateTime)
    require_sponsorship = Column(Boolean, default=False)
    authorized_countries = Column(JSON)  # List of countries

    # Professional Information
    current_title = Column(String(200))
    experience_level = Column(String(50))  # ExperienceLevel enum
    years_experience = Column(Integer)
    current_company = Column(String(200))
    current_salary = Column(Integer)
    desired_salary_min = Column(Integer)
    desired_salary_max = Column(Integer)
    salary_currency = Column(String(10), default="USD")

    # Education Information
    highest_education = Column(String(50))  # EducationLevel enum
    degree_field = Column(String(200))
    school_name = Column(String(200))
    graduation_year = Column(Integer)
    gpa = Column(Float)
    additional_certifications = Column(JSON)  # List of certifications

    # Job Preferences
    preferred_job_types = Column(JSON)  # List of JobType enum
    preferred_work_modes = Column(JSON)  # List of WorkMode enum
    preferred_locations = Column(JSON)  # List of preferred locations
    willing_to_relocate = Column(Boolean, default=False)
    max_commute_distance = Column(Integer)  # in miles
    travel_percentage_ok = Column(Integer, default=0)  # 0-100%

    # Skills and Expertise
    technical_skills = Column(JSON)  # List of technical skills
    soft_skills = Column(JSON)  # List of soft skills
    programming_languages = Column(JSON)  # List with proficiency levels
    frameworks_tools = Column(JSON)  # List with proficiency levels
    industries = Column(JSON)  # List of industry experience

    # Availability
    available_start_date = Column(DateTime)
    notice_period_weeks = Column(Integer, default=2)
    available_for_interview = Column(JSON)  # Time preferences
    preferred_interview_times = Column(JSON)  # Time slots

    # Background Check & Security
    security_clearance = Column(String(100))
    background_check_consent = Column(Boolean, default=True)
    drug_test_consent = Column(Boolean, default=True)

    # Diversity & Inclusion (Optional)
    veteran_status = Column(String(50))
    disability_status = Column(String(50))
    gender_identity = Column(String(50))
    ethnicity = Column(String(100))

    # Social Media & Portfolio
    linkedin_url = Column(String(255))
    github_url = Column(String(255))
    portfolio_url = Column(String(255))
    personal_website = Column(String(255))
    other_profiles = Column(JSON)  # Additional social profiles

    # Emergency Contact
    emergency_contact_name = Column(String(200))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relationship = Column(String(100))

    # Application Preferences
    cover_letter_template = Column(Text)
    auto_apply_enabled = Column(Boolean, default=False)
    application_follow_up = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)

    # Metadata
    profile_completion_percentage = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    def calculate_completion_percentage(self) -> int:
        """Calculate profile completion percentage"""
        required_fields = [
            'first_name', 'last_name', 'email', 'phone', 'city', 'state_province',
            'work_authorization', 'current_title', 'experience_level', 'years_experience',
            'highest_education', 'technical_skills', 'available_start_date'
        ]

        completed = 0
        for field in required_fields:
            if getattr(self, field):
                completed += 1

        return int((completed / len(required_fields)) * 100)

# Pydantic Models for API
class UserProfileCreate(BaseModel):
    # Personal Information
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    middle_name: Optional[str] = Field(None, max_length=100)
    preferred_name: Optional[str] = Field(None, max_length=100)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    phone: str = Field(..., min_length=10, max_length=20)
    secondary_phone: Optional[str] = Field(None, max_length=20)

    # Address Information
    street_address: Optional[str] = Field(None, max_length=255)
    apartment_unit: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    state_province: Optional[str] = Field(None, max_length=100)
    zip_postal_code: Optional[str] = Field(None, max_length=20)
    country: str = Field(default="United States", max_length=100)

    # Work Authorization
    work_authorization: WorkAuthorizationStatus
    visa_status: Optional[str] = Field(None, max_length=100)
    visa_expiry_date: Optional[datetime] = None
    require_sponsorship: bool = Field(default=False)
    authorized_countries: Optional[List[str]] = Field(default=["United States"])

    # Professional Information
    current_title: Optional[str] = Field(None, max_length=200)
    experience_level: ExperienceLevel
    years_experience: int = Field(..., ge=0, le=50)
    current_company: Optional[str] = Field(None, max_length=200)
    current_salary: Optional[int] = Field(None, ge=0)
    desired_salary_min: Optional[int] = Field(None, ge=0)
    desired_salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: str = Field(default="USD", max_length=10)

    # Education Information
    highest_education: EducationLevel
    degree_field: Optional[str] = Field(None, max_length=200)
    school_name: Optional[str] = Field(None, max_length=200)
    graduation_year: Optional[int] = Field(None, ge=1950, le=2030)
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    additional_certifications: Optional[List[str]] = Field(default=[])

    # Job Preferences
    preferred_job_types: List[JobType] = Field(default=[JobType.FULL_TIME])
    preferred_work_modes: List[WorkMode] = Field(default=[WorkMode.REMOTE])
    preferred_locations: Optional[List[str]] = Field(default=[])
    willing_to_relocate: bool = Field(default=False)
    max_commute_distance: Optional[int] = Field(None, ge=0, le=500)
    travel_percentage_ok: int = Field(default=0, ge=0, le=100)

    # Skills and Expertise
    technical_skills: List[str] = Field(default=[])
    soft_skills: Optional[List[str]] = Field(default=[])
    programming_languages: Optional[Dict[str, str]] = Field(default={})  # {language: proficiency}
    frameworks_tools: Optional[Dict[str, str]] = Field(default={})  # {tool: proficiency}
    industries: Optional[List[str]] = Field(default=[])

    # Availability
    available_start_date: Optional[datetime] = None
    notice_period_weeks: int = Field(default=2, ge=0, le=12)
    available_for_interview: Optional[Dict[str, Any]] = Field(default={})
    preferred_interview_times: Optional[List[str]] = Field(default=[])

    # Background Check & Security
    security_clearance: Optional[str] = Field(None, max_length=100)
    background_check_consent: bool = Field(default=True)
    drug_test_consent: bool = Field(default=True)

    # Diversity & Inclusion (Optional)
    veteran_status: Optional[str] = Field(None, max_length=50)
    disability_status: Optional[str] = Field(None, max_length=50)
    gender_identity: Optional[str] = Field(None, max_length=50)
    ethnicity: Optional[str] = Field(None, max_length=100)

    # Social Media & Portfolio
    linkedin_url: Optional[str] = Field(None, max_length=255)
    github_url: Optional[str] = Field(None, max_length=255)
    portfolio_url: Optional[str] = Field(None, max_length=255)
    personal_website: Optional[str] = Field(None, max_length=255)
    other_profiles: Optional[Dict[str, str]] = Field(default={})

    # Emergency Contact
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relationship: Optional[str] = Field(None, max_length=100)

    # Application Preferences
    cover_letter_template: Optional[str] = None
    auto_apply_enabled: bool = Field(default=False)
    application_follow_up: bool = Field(default=True)
    email_notifications: bool = Field(default=True)
    sms_notifications: bool = Field(default=False)

    @validator('desired_salary_max')
    def validate_salary_range(cls, v, values):
        if v is not None and 'desired_salary_min' in values and values['desired_salary_min'] is not None:
            if v < values['desired_salary_min']:
                raise ValueError('Maximum salary must be greater than minimum salary')
        return v

    @validator('email')
    def validate_email_format(cls, v):
        if '@' not in v or '.' not in v.split('@')[1]:
            raise ValueError('Invalid email format')
        return v.lower()

class UserProfileUpdate(BaseModel):
    """Partial update model for user profile"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    work_authorization: Optional[WorkAuthorizationStatus] = None
    current_title: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    years_experience: Optional[int] = None
    technical_skills: Optional[List[str]] = None
    preferred_job_types: Optional[List[JobType]] = None
    preferred_work_modes: Optional[List[WorkMode]] = None
    available_start_date: Optional[datetime] = None
    auto_apply_enabled: Optional[bool] = None

class UserProfileResponse(BaseModel):
    """Response model for user profile"""
    id: int
    user_id: int
    first_name: str
    last_name: str
    email: str
    profile_completion_percentage: int
    last_updated: datetime

    # Include other fields as needed
    class Config:
        from_attributes = True

# Profile Management Service
class EnhancedProfileService:
    def __init__(self, db_session):
        self.db = db_session

    def create_profile(self, user_id: int, profile_data: UserProfileCreate) -> EnhancedUserProfile:
        """Create a new enhanced user profile"""
        profile = EnhancedUserProfile(
            user_id=user_id,
            **profile_data.dict()
        )

        # Calculate initial completion percentage
        profile.profile_completion_percentage = profile.calculate_completion_percentage()

        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)

        return profile

    def get_profile(self, user_id: int) -> Optional[EnhancedUserProfile]:
        """Get user profile by user ID"""
        return self.db.query(EnhancedUserProfile).filter(
            EnhancedUserProfile.user_id == user_id
        ).first()

    def update_profile(self, user_id: int, updates: UserProfileUpdate) -> Optional[EnhancedUserProfile]:
        """Update user profile with partial data"""
        profile = self.get_profile(user_id)
        if not profile:
            return None

        # Update only provided fields
        update_data = updates.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)

        # Recalculate completion percentage
        profile.profile_completion_percentage = profile.calculate_completion_percentage()
        profile.last_updated = datetime.utcnow()

        self.db.commit()
        self.db.refresh(profile)

        return profile

    def get_application_data(self, user_id: int) -> Dict[str, Any]:
        """Get formatted data for job applications"""
        profile = self.get_profile(user_id)
        if not profile:
            return {}

        return {
            'personal': {
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'full_name': f"{profile.first_name} {profile.last_name}",
                'email': profile.email,
                'phone': profile.phone,
                'address': {
                    'street': profile.street_address,
                    'city': profile.city,
                    'state': profile.state_province,
                    'zip': profile.zip_postal_code,
                    'country': profile.country
                }
            },
            'work_authorization': {
                'status': profile.work_authorization,
                'require_sponsorship': profile.require_sponsorship,
                'authorized_countries': profile.authorized_countries or []
            },
            'professional': {
                'current_title': profile.current_title,
                'experience_level': profile.experience_level,
                'years_experience': profile.years_experience,
                'current_company': profile.current_company,
                'desired_salary': {
                    'min': profile.desired_salary_min,
                    'max': profile.desired_salary_max,
                    'currency': profile.salary_currency
                }
            },
            'education': {
                'level': profile.highest_education,
                'field': profile.degree_field,
                'school': profile.school_name,
                'graduation_year': profile.graduation_year,
                'gpa': profile.gpa,
                'certifications': profile.additional_certifications or []
            },
            'skills': {
                'technical': profile.technical_skills or [],
                'soft': profile.soft_skills or [],
                'programming': profile.programming_languages or {},
                'tools': profile.frameworks_tools or []
            },
            'preferences': {
                'job_types': profile.preferred_job_types or [],
                'work_modes': profile.preferred_work_modes or [],
                'locations': profile.preferred_locations or [],
                'relocate': profile.willing_to_relocate,
                'travel_ok': profile.travel_percentage_ok,
                'start_date': profile.available_start_date,
                'notice_period': profile.notice_period_weeks
            },
            'social': {
                'linkedin': profile.linkedin_url,
                'github': profile.github_url,
                'portfolio': profile.portfolio_url,
                'website': profile.personal_website
            }
        }

    def check_profile_completeness(self, user_id: int) -> Dict[str, Any]:
        """Check profile completeness and return missing fields"""
        profile = self.get_profile(user_id)
        if not profile:
            return {'complete': False, 'missing_fields': ['profile_not_found']}

        required_fields = {
            'personal_info': ['first_name', 'last_name', 'email', 'phone'],
            'address': ['city', 'state_province'],
            'work_auth': ['work_authorization'],
            'professional': ['current_title', 'experience_level', 'years_experience'],
            'education': ['highest_education'],
            'skills': ['technical_skills'],
            'availability': ['available_start_date']
        }

        missing_by_category = {}
        total_missing = 0

        for category, fields in required_fields.items():
            missing = []
            for field in fields:
                value = getattr(profile, field)
                if not value or (isinstance(value, list) and len(value) == 0):
                    missing.append(field)

            if missing:
                missing_by_category[category] = missing
                total_missing += len(missing)

        total_required = sum(len(fields) for fields in required_fields.values())
        completion_percentage = int(((total_required - total_missing) / total_required) * 100)

        return {
            'complete': total_missing == 0,
            'completion_percentage': completion_percentage,
            'missing_by_category': missing_by_category,
            'total_missing': total_missing,
            'profile_id': profile.id
        }
