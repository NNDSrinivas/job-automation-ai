from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from db import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    linkedin_url = Column(String)
    experience_years = Column(Integer)
    resumes = relationship("Resume", back_populates="owner")
    applications = relationship("JobApplication", back_populates="user")
    job_portal_credentials = relationship("JobPortalCredential", back_populates="user", cascade="all, delete-orphan")
    questionnaire_answers = relationship("QuestionnaireAnswer", back_populates="user", cascade="all, delete-orphan")
    automation_settings = relationship("AutomationSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    profile_picture_url = Column(String)
    certifications = Column(Text)
    education = Column(Text)

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    s3_url = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_primary = Column(Boolean, default=False)
    parsed_data = Column(JSON)  # Store parsed resume information
    file_size = Column(Integer)  # File size in bytes
    owner = relationship("User", back_populates="resumes")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String)
    description = Column(Text)
    url = Column(String, unique=True, nullable=False)
    platform = Column(String, nullable=False)  # indeed, dice, linkedin, etc.
    salary = Column(String)
    job_type = Column(String)  # full-time, part-time, contract, etc.
    posted_date = Column(DateTime)
    scraped_at = Column(DateTime, default=datetime.datetime.utcnow)
    raw_data = Column(Text)  # JSON string of original scraped data
    applications = relationship("JobApplication", back_populates="job")

class JobApplication(Base):
    __tablename__ = "job_applications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(String, default="pending")  # pending, in_progress, applied, failed
    applied_successfully = Column(Boolean, default=False)
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime)
    application_data = Column(Text)  # JSON string of application details
    error_message = Column(Text)

    # Relationships
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")

class JobPortalCredential(Base):
    __tablename__ = "job_portal_credentials"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False)  # linkedin, indeed, glassdoor, dice, etc.
    username = Column(String, nullable=False)
    encrypted_password = Column(String, nullable=False)  # encrypted password
    additional_data = Column(JSON)  # for oauth tokens, api keys, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_used = Column(DateTime)

    user = relationship("User", back_populates="job_portal_credentials")

class QuestionnaireAnswer(Base):
    __tablename__ = "questionnaire_answers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_key = Column(String, nullable=False)  # standardized question identifier
    question_text = Column(Text, nullable=False)  # actual question text
    answer = Column(Text, nullable=False)  # user's answer
    question_type = Column(String, default="text")  # text, number, boolean, select, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="questionnaire_answers")

class AutomationSetting(Base):
    __tablename__ = "automation_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    max_applications_per_day = Column(Integer, default=10)
    match_threshold = Column(Float, default=0.7)  # 0.0 to 1.0
    enabled_platforms = Column(JSON, default=list)  # list of enabled job platforms
    preferred_locations = Column(JSON, default=list)  # list of preferred job locations
    salary_range_min = Column(Integer)
    salary_range_max = Column(Integer)
    job_types = Column(JSON, default=list)  # full-time, part-time, contract, etc.
    experience_levels = Column(JSON, default=list)  # entry, mid, senior, etc.
    keywords_include = Column(JSON, default=list)  # must-have keywords
    keywords_exclude = Column(JSON, default=list)  # keywords to avoid
    is_active = Column(Boolean, default=True)
    schedule_enabled = Column(Boolean, default=False)
    schedule_start_time = Column(String)  # HH:MM format
    schedule_end_time = Column(String)  # HH:MM format
    schedule_days = Column(JSON, default=list)  # list of days: ["monday", "tuesday", ...]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="automation_settings")
