from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
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

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    s3_url = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
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
