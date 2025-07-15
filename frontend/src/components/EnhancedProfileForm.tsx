// Enhanced User Profile Form Component
// Comprehensive profile management with all job application fields

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';

interface EnhancedProfileData {
  // Personal Information
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  email: string;
  phone: string;
  secondary_phone?: string;

  // Address Information
  street_address?: string;
  apartment_unit?: string;
  city?: string;
  state_province?: string;
  zip_postal_code?: string;
  country: string;

  // Work Authorization
  work_authorization: string;
  visa_status?: string;
  visa_expiry_date?: string;
  require_sponsorship: boolean;
  authorized_countries: string[];

  // Professional Information
  current_title?: string;
  experience_level: string;
  years_experience: number;
  current_company?: string;
  current_salary?: number;
  desired_salary_min?: number;
  desired_salary_max?: number;
  salary_currency: string;

  // Education Information
  highest_education: string;
  degree_field?: string;
  school_name?: string;
  graduation_year?: number;
  gpa?: number;
  additional_certifications: string[];

  // Job Preferences
  preferred_job_types: string[];
  preferred_work_modes: string[];
  preferred_locations: string[];
  willing_to_relocate: boolean;
  max_commute_distance?: number;
  travel_percentage_ok: number;

  // Skills and Expertise
  technical_skills: string[];
  soft_skills: string[];
  programming_languages: Record<string, string>;
  frameworks_tools: Record<string, string>;
  industries: string[];

  // Availability
  available_start_date?: string;
  notice_period_weeks: number;
  available_for_interview: Record<string, any>;
  preferred_interview_times: string[];

  // Background Check & Security
  security_clearance?: string;
  background_check_consent: boolean;
  drug_test_consent: boolean;

  // Social Media & Portfolio
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  personal_website?: string;
  other_profiles: Record<string, string>;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  // Application Preferences
  cover_letter_template?: string;
  auto_apply_enabled: boolean;
  application_follow_up: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

const workAuthOptions = [
  { value: 'us_citizen', label: 'US Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'h1b', label: 'H1B Visa' },
  { value: 'f1_opt', label: 'F1 OPT' },
  { value: 'f1_cpt', label: 'F1 CPT' },
  { value: 'tn_visa', label: 'TN Visa' },
  { value: 'other_visa', label: 'Other Visa' },
  { value: 'require_sponsorship', label: 'Require Sponsorship' },
];

const experienceLevels = [
  { value: 'entry_level', label: 'Entry Level' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid_level', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
];

const educationLevels = [
  { value: 'high_school', label: 'High School' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: 'Bachelor\'s Degree' },
  { value: 'master', label: 'Master\'s Degree' },
  { value: 'phd', label: 'PhD' },
  { value: 'professional', label: 'Professional Degree' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'bootcamp', label: 'Bootcamp' },
];

const jobTypes = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
];

const workModes = [
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'flexible', label: 'Flexible' },
];

const EnhancedProfileForm: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EnhancedProfileData>({
    // Initialize with default values
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: 'United States',
    work_authorization: 'us_citizen',
    require_sponsorship: false,
    authorized_countries: ['United States'],
    experience_level: 'mid_level',
    years_experience: 0,
    salary_currency: 'USD',
    highest_education: 'bachelor',
    additional_certifications: [],
    preferred_job_types: ['full_time'],
    preferred_work_modes: ['remote'],
    preferred_locations: [],
    willing_to_relocate: false,
    travel_percentage_ok: 0,
    technical_skills: [],
    soft_skills: [],
    programming_languages: {},
    frameworks_tools: {},
    industries: [],
    notice_period_weeks: 2,
    available_for_interview: {},
    preferred_interview_times: [],
    background_check_consent: true,
    drug_test_consent: true,
    other_profiles: {},
    auto_apply_enabled: false,
    application_follow_up: true,
    email_notifications: true,
    sms_notifications: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [completeness, setCompleteness] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    checkCompleteness();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/profile/enhanced');
      setProfile({ ...profile, ...response.data });
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      }
      // Profile doesn't exist yet, keep defaults
    } finally {
      setLoading(false);
    }
  };

  const checkCompleteness = async () => {
    try {
      const response = await axiosInstance.get('/profile/completeness');
      setCompleteness(response.data);
    } catch (error) {
      console.error('Error checking completeness:', error);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      // Determine if this is create or update
      const isUpdate = completeness?.profile_id;
      const endpoint = '/profile/enhanced';
      const method = isUpdate ? 'put' : 'post';

      await axiosInstance[method](endpoint, profile);

      toast.success('Profile saved successfully!');
      await checkCompleteness();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: keyof EnhancedProfileData, value: string) => {
    if (value.trim()) {
      setProfile(prev => ({
        ...prev,
        [field]: [...((prev[field] as string[]) || []), value.trim()]
      }));
    }
  };

  const removeFromArray = (field: keyof EnhancedProfileData, index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: ((prev[field] as string[]) || []).filter((_, i) => i !== index)
    }));
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'professional', label: 'Professional', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'availability', label: 'Availability', icon: '📅' },
    { id: 'social', label: 'Social & Portfolio', icon: '🌐' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Profile</h1>
          <p className="text-gray-600">Complete your profile to improve job application success rates.</p>

          {completeness && (
            <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                <span className="text-sm font-bold text-gray-900">
                  {completeness.completion_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completeness.completion_percentage}%` }}
                ></div>
              </div>
              {!completeness.complete && (
                <p className="text-sm text-gray-600 mt-2">
                  Complete all required fields to enable auto-application features.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={profile.first_name}
                      onChange={e => updateField('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={profile.last_name}
                      onChange={e => updateField('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={e => updateField('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={e => updateField('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={profile.city || ''}
                      onChange={e => updateField('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      value={profile.state_province || ''}
                      onChange={e => updateField('state_province', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Authorization *
                  </label>
                  <select
                    value={profile.work_authorization}
                    onChange={e => updateField('work_authorization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {workAuthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Professional Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Title
                    </label>
                    <input
                      type="text"
                      value={profile.current_title || ''}
                      onChange={e => updateField('current_title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level *
                    </label>
                    <select
                      value={profile.experience_level}
                      onChange={e => updateField('experience_level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {experienceLevels.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={profile.years_experience}
                      onChange={e => updateField('years_experience', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Company
                    </label>
                    <input
                      type="text"
                      value={profile.current_company || ''}
                      onChange={e => updateField('current_company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desired Salary Min
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profile.desired_salary_min || ''}
                      onChange={e => updateField('desired_salary_min', parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desired Salary Max
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profile.desired_salary_max || ''}
                      onChange={e => updateField('desired_salary_max', parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Skills & Expertise</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technical Skills *
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.technical_skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {skill}
                          <button
                            onClick={() => removeFromArray('technical_skills', index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Add a technical skill"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('technical_skills', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <button
                        onClick={e => {
                          const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                          addToArray('technical_skills', input.value);
                          input.value = '';
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Soft Skills
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.soft_skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                        >
                          {skill}
                          <button
                            onClick={() => removeFromArray('soft_skills', index)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Add a soft skill"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('soft_skills', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <button
                        onClick={e => {
                          const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                          addToArray('soft_skills', input.value);
                          input.value = '';
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Job Preferences</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Job Types
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {jobTypes.map(type => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.preferred_job_types.includes(type.value)}
                          onChange={e => {
                            if (e.target.checked) {
                              updateField('preferred_job_types', [...profile.preferred_job_types, type.value]);
                            } else {
                              updateField('preferred_job_types', profile.preferred_job_types.filter(t => t !== type.value));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Work Modes
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {workModes.map(mode => (
                      <label key={mode.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.preferred_work_modes.includes(mode.value)}
                          onChange={e => {
                            if (e.target.checked) {
                              updateField('preferred_work_modes', [...profile.preferred_work_modes, mode.value]);
                            } else {
                              updateField('preferred_work_modes', profile.preferred_work_modes.filter(m => m !== mode.value));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{mode.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.willing_to_relocate}
                        onChange={e => updateField('willing_to_relocate', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Willing to relocate</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Travel Percentage OK (0-100%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profile.travel_percentage_ok}
                      onChange={e => updateField('travel_percentage_ok', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-gray-600 mt-1">
                      {profile.travel_percentage_ok}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Availability</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Start Date *
                    </label>
                    <input
                      type="date"
                      value={profile.available_start_date || ''}
                      onChange={e => updateField('available_start_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notice Period (weeks)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={profile.notice_period_weeks}
                      onChange={e => updateField('notice_period_weeks', parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Social Media & Portfolio</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={profile.linkedin_url || ''}
                      onChange={e => updateField('linkedin_url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={profile.github_url || ''}
                      onChange={e => updateField('github_url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={profile.portfolio_url || ''}
                      onChange={e => updateField('portfolio_url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Website
                    </label>
                    <input
                      type="url"
                      value={profile.personal_website || ''}
                      onChange={e => updateField('personal_website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Preferences
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.auto_apply_enabled}
                        onChange={e => updateField('auto_apply_enabled', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable auto-apply (requires 80%+ profile completion)</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.email_notifications}
                        onChange={e => updateField('email_notifications', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile.application_follow_up}
                        onChange={e => updateField('application_follow_up', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Follow up on applications</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfileForm;
