# Enhanced User Profile Database Migration
"""Create enhanced_user_profiles table

Revision ID: 002_enhanced_profile
Revises: 001_initial_schema
Create Date: 2025-01-11 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers
revision = '002_enhanced_profile'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

def upgrade():
    # Create enhanced_user_profiles table
    op.create_table('enhanced_user_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),

        # Personal Information
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('middle_name', sa.String(length=100), nullable=True),
        sa.Column('preferred_name', sa.String(length=100), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('secondary_phone', sa.String(length=20), nullable=True),

        # Address Information
        sa.Column('street_address', sa.String(length=255), nullable=True),
        sa.Column('apartment_unit', sa.String(length=50), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state_province', sa.String(length=100), nullable=True),
        sa.Column('zip_postal_code', sa.String(length=20), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),

        # Work Authorization
        sa.Column('work_authorization', sa.String(length=50), nullable=True),
        sa.Column('visa_status', sa.String(length=100), nullable=True),
        sa.Column('visa_expiry_date', sa.DateTime(), nullable=True),
        sa.Column('require_sponsorship', sa.Boolean(), nullable=True),
        sa.Column('authorized_countries', sa.JSON(), nullable=True),

        # Professional Information
        sa.Column('current_title', sa.String(length=200), nullable=True),
        sa.Column('experience_level', sa.String(length=50), nullable=True),
        sa.Column('years_experience', sa.Integer(), nullable=True),
        sa.Column('current_company', sa.String(length=200), nullable=True),
        sa.Column('current_salary', sa.Integer(), nullable=True),
        sa.Column('desired_salary_min', sa.Integer(), nullable=True),
        sa.Column('desired_salary_max', sa.Integer(), nullable=True),
        sa.Column('salary_currency', sa.String(length=10), nullable=True),

        # Education Information
        sa.Column('highest_education', sa.String(length=50), nullable=True),
        sa.Column('degree_field', sa.String(length=200), nullable=True),
        sa.Column('school_name', sa.String(length=200), nullable=True),
        sa.Column('graduation_year', sa.Integer(), nullable=True),
        sa.Column('gpa', sa.Float(), nullable=True),
        sa.Column('additional_certifications', sa.JSON(), nullable=True),

        # Job Preferences
        sa.Column('preferred_job_types', sa.JSON(), nullable=True),
        sa.Column('preferred_work_modes', sa.JSON(), nullable=True),
        sa.Column('preferred_locations', sa.JSON(), nullable=True),
        sa.Column('willing_to_relocate', sa.Boolean(), nullable=True),
        sa.Column('max_commute_distance', sa.Integer(), nullable=True),
        sa.Column('travel_percentage_ok', sa.Integer(), nullable=True),

        # Skills and Expertise
        sa.Column('technical_skills', sa.JSON(), nullable=True),
        sa.Column('soft_skills', sa.JSON(), nullable=True),
        sa.Column('programming_languages', sa.JSON(), nullable=True),
        sa.Column('frameworks_tools', sa.JSON(), nullable=True),
        sa.Column('industries', sa.JSON(), nullable=True),

        # Availability
        sa.Column('available_start_date', sa.DateTime(), nullable=True),
        sa.Column('notice_period_weeks', sa.Integer(), nullable=True),
        sa.Column('available_for_interview', sa.JSON(), nullable=True),
        sa.Column('preferred_interview_times', sa.JSON(), nullable=True),

        # Background Check & Security
        sa.Column('security_clearance', sa.String(length=100), nullable=True),
        sa.Column('background_check_consent', sa.Boolean(), nullable=True),
        sa.Column('drug_test_consent', sa.Boolean(), nullable=True),

        # Diversity & Inclusion (Optional)
        sa.Column('veteran_status', sa.String(length=50), nullable=True),
        sa.Column('disability_status', sa.String(length=50), nullable=True),
        sa.Column('gender_identity', sa.String(length=50), nullable=True),
        sa.Column('ethnicity', sa.String(length=100), nullable=True),

        # Social Media & Portfolio
        sa.Column('linkedin_url', sa.String(length=255), nullable=True),
        sa.Column('github_url', sa.String(length=255), nullable=True),
        sa.Column('portfolio_url', sa.String(length=255), nullable=True),
        sa.Column('personal_website', sa.String(length=255), nullable=True),
        sa.Column('other_profiles', sa.JSON(), nullable=True),

        # Emergency Contact
        sa.Column('emergency_contact_name', sa.String(length=200), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_relationship', sa.String(length=100), nullable=True),

        # Application Preferences
        sa.Column('cover_letter_template', sa.Text(), nullable=True),
        sa.Column('auto_apply_enabled', sa.Boolean(), nullable=True),
        sa.Column('application_follow_up', sa.Boolean(), nullable=True),
        sa.Column('email_notifications', sa.Boolean(), nullable=True),
        sa.Column('sms_notifications', sa.Boolean(), nullable=True),

        # Metadata
        sa.Column('profile_completion_percentage', sa.Integer(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),

        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_enhanced_user_profiles_id', 'enhanced_user_profiles', ['id'])
    op.create_index('ix_enhanced_user_profiles_user_id', 'enhanced_user_profiles', ['user_id'], unique=True)

def downgrade():
    # Drop enhanced_user_profiles table
    op.drop_index('ix_enhanced_user_profiles_user_id', table_name='enhanced_user_profiles')
    op.drop_index('ix_enhanced_user_profiles_id', table_name='enhanced_user_profiles')
    op.drop_table('enhanced_user_profiles')
