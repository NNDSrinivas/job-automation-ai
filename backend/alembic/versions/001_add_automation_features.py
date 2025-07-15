"""Add job portal credentials, questionnaire answers, and automation settings

Revision ID: 001
Revises:
Create Date: 2025-07-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create job_portal_credentials table
    op.create_table('job_portal_credentials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('encrypted_password', sa.String(), nullable=False),
        sa.Column('additional_data', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_used', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_job_portal_credentials_id'), 'job_portal_credentials', ['id'], unique=False)

    # Create questionnaire_answers table
    op.create_table('questionnaire_answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('question_key', sa.String(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_questionnaire_answers_id'), 'questionnaire_answers', ['id'], unique=False)

    # Create automation_settings table
    op.create_table('automation_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('max_applications_per_day', sa.Integer(), nullable=True),
        sa.Column('match_threshold', sa.Float(), nullable=True),
        sa.Column('enabled_platforms', sa.JSON(), nullable=True),
        sa.Column('preferred_locations', sa.JSON(), nullable=True),
        sa.Column('salary_range_min', sa.Integer(), nullable=True),
        sa.Column('salary_range_max', sa.Integer(), nullable=True),
        sa.Column('job_types', sa.JSON(), nullable=True),
        sa.Column('experience_levels', sa.JSON(), nullable=True),
        sa.Column('keywords_include', sa.JSON(), nullable=True),
        sa.Column('keywords_exclude', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('schedule_enabled', sa.Boolean(), nullable=True),
        sa.Column('schedule_start_time', sa.String(), nullable=True),
        sa.Column('schedule_end_time', sa.String(), nullable=True),
        sa.Column('schedule_days', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_automation_settings_id'), 'automation_settings', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_automation_settings_id'), table_name='automation_settings')
    op.drop_table('automation_settings')
    op.drop_index(op.f('ix_questionnaire_answers_id'), table_name='questionnaire_answers')
    op.drop_table('questionnaire_answers')
    op.drop_index(op.f('ix_job_portal_credentials_id'), table_name='job_portal_credentials')
    op.drop_table('job_portal_credentials')
