#!/bin/bash

# Cleanup duplicate and test files
echo "Starting cleanup of duplicate and test files..."

# Navigate to project root
cd /Users/mounikakapa/job-automation-ai

# Remove Python test files (keeping main test files that might be needed)
echo "Removing test files..."
rm -f advanced_test.py
rm -f e2e_user_testing.py
rm -f comprehensive_test.py
rm -f linkedin_integration_test.py
rm -f comprehensive_feature_test.py
rm -f simple_test.py
rm -f comprehensive_testing_guide.py
rm -f test_auto_applier.py
rm -f test_automation.py
rm -f test_background_jobs.py
rm -f test_dashboard_access.py
rm -f test_direct_api.py
rm -f test_full_system.py
rm -f test_integrations_frontend.py
rm -f test_linkedin_integration.py
rm -f test_openai_key.py
rm -f test_scrapers_quick.py
rm -f test_signup_flow.py
rm -f test_working_auto_apply.py

# Remove duplicate demo files
echo "Removing duplicate demo files..."
rm -f complete_system_demo.py
rm -f comprehensive_job_portal_setup.py
rm -f credential_based_auto_apply.py
rm -f debug_job_scraping.py
rm -f demo_auto_apply.py
rm -f demo_credential_system.py
rm -f full_dashboard_demo.py
rm -f improved_job_scraper.py
rm -f linkedin_application_tracker.py
rm -f multi_platform_auto_apply.py
rm -f multi_platform_automation_system.py
rm -f quick_job_demo.py
rm -f real_job_application_demo.py
rm -f show_credential_system.py
rm -f working_auto_apply_demo.py

# Remove HTML test files
echo "Removing HTML test files..."
rm -f job-automation-demo.html
rm -f dice_sample.html

# Clean frontend duplicates
echo "Cleaning frontend duplicates..."
cd frontend/src

# Remove duplicate App files
rm -f App-*.js App-*.tsx App-*.css
rm -f App.tsx.backup
rm -f SuperSimple.js SuperSimple.tsx
rm -f SimpleApp.js SimpleApp.tsx

# Remove test HTML files
rm -f react-test.html portal-test.html

# Clean up components directory
cd components
echo "Cleaning component duplicates..."
rm -f MinimalTest.js MinimalTest.tsx
rm -f SimpleTest.js SimpleTest.tsx
rm -f SimpleMentors.js SimpleMentors.tsx
rm -f AuthContext-Simple.js AuthContext-Simple.tsx
rm -f ProfessionalLandingPage.js ProfessionalDashboard.js
rm -f EnhancedAnalyticsDashboard.js EnhancedProfileForm.js

# Go back to project root
cd /Users/mounikakapa/job-automation-ai

# Remove backend duplicates
echo "Cleaning backend duplicates..."
cd backend
rm -f analytics_engine_backup.py
rm -f analytics_engine_old.py

# Go back to root
cd /Users/mounikakapa/job-automation-ai

echo "Cleanup completed!"
echo "Removed duplicate and test files to clean up the codebase."
