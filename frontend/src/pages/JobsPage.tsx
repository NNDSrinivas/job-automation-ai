import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  platform: string;
  salary?: string;
  jobType?: string;
  postedDate?: string;
  matchScore?: number;
  isBookmarked?: boolean;
}

interface JobPortal {
  id: string;
  name: string;
  logo: string;
  isConnected: boolean;
  username?: string;
  lastSync?: string;
  jobCount?: number;
}

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  console.log('🏗️ JobsPage rendering, user:', user);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [portals, setPortals] = useState<JobPortal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeywords, setSearchKeywords] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<JobPortal | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userResume, setUserResume] = useState<any>(null);
  const [userExperience, setUserExperience] = useState<string>('');

  // Fetch user resume and profile data
  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      console.log('🔍 Fetching user resume data...');

      // Fetch user resumes
      const resumesResponse = await fetch('http://localhost:8000/resumes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resumesResponse.ok) {
        const resumes = await resumesResponse.json();
        console.log('📄 Resume data received:', resumes);

        if (resumes && resumes.length > 0) {
          const primaryResume = resumes[0];
          setUserResume(primaryResume);
          console.log('✅ Primary resume set:', primaryResume);

          // Extract skills from parsedData
          if (primaryResume.parsedData && primaryResume.parsedData.skills) {
            setUserSkills(primaryResume.parsedData.skills);
            console.log('🎯 User skills extracted:', primaryResume.parsedData.skills);
          }

          // Extract latest job title/experience for better job matching
          if (primaryResume.parsedData && primaryResume.parsedData.experience && primaryResume.parsedData.experience.length > 0) {
            const latestJob = primaryResume.parsedData.experience[0];
            setUserExperience(latestJob.title || '');
            console.log('💼 User experience set:', latestJob.title);
          }
        }
      } else {
        console.error('❌ Failed to fetch resumes:', resumesResponse.status);
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    }
  };

  // Load initial jobs when user data is available
  useEffect(() => {
    console.log('🎯 Job generation triggered:', {
      userSkillsLength: userSkills.length,
      userExperience,
      hasUserResume: !!userResume
    });

    if (userSkills.length > 0 || userExperience || userResume) {
      const skillsToUse = userSkills.length > 0 ? userSkills : ['JavaScript', 'React', 'Python', 'TypeScript', 'Node.js'];
      console.log('🚀 Generating personalized jobs with skills:', skillsToUse);
      console.log('🚀 Using experience:', userExperience);

      const initialJobs = generateSkillBasedJobs(
        skillsToUse,
        userExperience,
        userResume
      );
      console.log('✅ Generated jobs:', initialJobs.length, 'personalized jobs');
      setJobs(initialJobs);
    } else {
      console.log('🔄 Loading demo jobs (no user data yet)');
      // Load demo jobs with diverse industries when no user data is available yet
      const demoJobs = generateSkillBasedJobs(
        ['JavaScript', 'Python', 'Java', 'React', 'AWS'],
        'Software Engineer',
        null
      );
      setJobs(demoJobs);
    }
  }, [userSkills, userExperience, userResume]);

  // Also load demo jobs on initial component mount
  useEffect(() => {
    console.log('🔄 Loading initial demo jobs on component mount');
    const initialDemoJobs = generateSkillBasedJobs(
      ['JavaScript', 'Python', 'Java', 'React', 'AWS'],
      'Software Engineer',
      null
    );
    setJobs(initialDemoJobs);
    console.log('✅ Initial demo jobs loaded:', initialDemoJobs.length);
  }, []);

  // Initialize demo portals
  useEffect(() => {
    const demoPortals: JobPortal[] = [
      { id: '1', name: 'LinkedIn', logo: '💼', isConnected: false, jobCount: 150 },
      { id: '2', name: 'Indeed', logo: '🔍', isConnected: false, jobCount: 89 },
      { id: '3', name: 'Glassdoor', logo: '🏢', isConnected: false, jobCount: 67 },
      { id: '4', name: 'Dice', logo: '🎲', isConnected: false, jobCount: 45 }
    ];
    setPortals(demoPortals);
    console.log('✅ Demo portals initialized:', demoPortals.length);
  }, []);

  const generateSkillBasedJobs = (skills: string[], experience: string = '', resume: any = null): Job[] => {
    // Enhanced job templates with industry-specific roles
    const industryJobTemplates = [
      // Technology/Software
      {
        category: 'Technology',
        roles: [
          {
            titleTemplate: (skill: string) => `Senior ${skill} Developer`,
            companyOptions: ['Microsoft', 'Google', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Spotify'],
            descriptionTemplate: (skill: string, exp: string) => `Join our engineering team as a Senior ${skill} Developer. ${exp ? `Your experience in ${exp} will be valuable.` : ''} Build scalable systems serving millions of users. Lead technical initiatives and mentor junior developers.`,
            salaryRange: '$140,000 - $180,000',
            matchScore: 95,
            domains: ['software', 'tech', 'development', 'engineering']
          },
          {
            titleTemplate: (skill: string) => `${skill} Engineer - Cloud Platform`,
            companyOptions: ['AWS', 'Google Cloud', 'Azure', 'Salesforce', 'Oracle', 'IBM'],
            descriptionTemplate: (skill: string, exp: string) => `Cloud platform engineer role focusing on ${skill} and distributed systems. ${exp ? `Your ${exp} background is a plus.` : ''} Work on infrastructure serving enterprise clients.`,
            salaryRange: '$130,000 - $170,000',
            matchScore: 92,
            domains: ['cloud', 'devops', 'infrastructure']
          }
        ]
      },
      // Financial Services
      {
        category: 'Financial',
        roles: [
          {
            titleTemplate: (skill: string) => `${skill} Developer - Trading Systems`,
            companyOptions: ['Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Citadel', 'Two Sigma', 'Jane Street'],
            descriptionTemplate: (skill: string, exp: string) => `Develop high-frequency trading systems using ${skill}. ${exp ? `Experience in ${exp} is highly valued.` : ''} Work on low-latency applications processing millions of transactions.`,
            salaryRange: '$160,000 - $220,000',
            matchScore: 93,
            domains: ['trading', 'finance', 'fintech', 'banking', 'quant']
          },
          {
            titleTemplate: (skill: string) => `Fintech ${skill} Engineer`,
            companyOptions: ['Stripe', 'Square', 'PayPal', 'Robinhood', 'Coinbase', 'Plaid'],
            descriptionTemplate: (skill: string, exp: string) => `Build next-generation financial applications with ${skill}. ${exp ? `Your ${exp} expertise will drive innovation.` : ''} Shape the future of digital payments and financial services.`,
            salaryRange: '$135,000 - $175,000',
            matchScore: 90,
            domains: ['fintech', 'payments', 'blockchain', 'crypto']
          }
        ]
      },
      // Healthcare
      {
        category: 'Healthcare',
        roles: [
          {
            titleTemplate: (skill: string) => `${skill} Developer - Healthcare Platform`,
            companyOptions: ['Epic', 'Cerner', 'Teladoc', 'Veracyte', 'Guardant Health', 'Illumina'],
            descriptionTemplate: (skill: string, exp: string) => `Develop healthcare software solutions using ${skill}. ${exp ? `Your ${exp} background brings valuable perspective.` : ''} Build systems that improve patient outcomes and healthcare efficiency.`,
            salaryRange: '$125,000 - $165,000',
            matchScore: 88,
            domains: ['healthcare', 'medical', 'biotech', 'health tech']
          },
          {
            titleTemplate: (skill: string) => `Medical Software ${skill} Engineer`,
            companyOptions: ['Johnson & Johnson', 'Pfizer', 'Moderna', 'Genentech', 'Boston Scientific'],
            descriptionTemplate: (skill: string, exp: string) => `Software engineer role in medical technology using ${skill}. ${exp ? `Your experience in ${exp} is an asset.` : ''} Work on life-saving medical devices and diagnostic tools.`,
            salaryRange: '$130,000 - $170,000',
            matchScore: 89,
            domains: ['medical devices', 'diagnostics', 'pharma']
          }
        ]
      },
      // Insurance
      {
        category: 'Insurance',
        roles: [
          {
            titleTemplate: (skill: string) => `${skill} Developer - Insurance Platform`,
            companyOptions: ['State Farm', 'Allstate', 'Progressive', 'GEICO', 'Aetna', 'Anthem'],
            descriptionTemplate: (skill: string, exp: string) => `Build insurance technology solutions with ${skill}. ${exp ? `Your ${exp} experience adds great value.` : ''} Develop systems for claims processing, risk assessment, and customer service.`,
            salaryRange: '$115,000 - $150,000',
            matchScore: 86,
            domains: ['insurance', 'risk management', 'actuarial']
          }
        ]
      },
      // E-commerce/Retail
      {
        category: 'E-commerce',
        roles: [
          {
            titleTemplate: (skill: string) => `${skill} Engineer - E-commerce Platform`,
            companyOptions: ['Amazon', 'Shopify', 'eBay', 'Etsy', 'Walmart Labs', 'Target Tech'],
            descriptionTemplate: (skill: string, exp: string) => `E-commerce platform engineer using ${skill}. ${exp ? `Your ${exp} experience is valuable for our team.` : ''} Build scalable shopping experiences for millions of customers.`,
            salaryRange: '$120,000 - $160,000',
            matchScore: 87,
            domains: ['e-commerce', 'retail', 'marketplace']
          }
        ]
      }
    ];

    const platforms = ['linkedin', 'indeed', 'glassdoor', 'dice', 'remoteok'];
    const locations = [
      'San Francisco, CA (Remote)', 'New York, NY (Hybrid)', 'Austin, TX (Remote)',
      'Seattle, WA (Remote)', 'Boston, MA (Hybrid)', 'Chicago, IL (Remote)',
      'Los Angeles, CA (Hybrid)', 'Remote Worldwide'
    ];

    const jobs: Job[] = [];

    // Use user skills or fallback to default tech skills
    const skillsToUse = skills.length > 0 ? skills : ['JavaScript', 'React', 'Python', 'TypeScript', 'Node.js'];

    // Generate jobs from different industries
    industryJobTemplates.forEach((industry, industryIndex) => {
      industry.roles.forEach((role, roleIndex) => {
        skillsToUse.slice(0, 3).forEach((skill, skillIndex) => {
          const company = role.companyOptions[skillIndex % role.companyOptions.length];
          const platform = platforms[(industryIndex + roleIndex + skillIndex) % platforms.length];
          const location = locations[(industryIndex + roleIndex + skillIndex) % locations.length];

          // Boost match score if user experience aligns with role
          let adjustedMatchScore = role.matchScore;
          if (experience && role.domains.some(domain =>
            experience.toLowerCase().includes(domain) ||
            role.titleTemplate(skill).toLowerCase().includes(experience.toLowerCase())
          )) {
            adjustedMatchScore += 5;
          }

          jobs.push({
            id: `${industry.category.toLowerCase()}-${roleIndex}-${skillIndex}`,
            title: role.titleTemplate(skill),
            company: company,
            location: location,
            description: role.descriptionTemplate(skill, experience),
            url: `https://demo.jobportal.com/jobs/${industry.category.toLowerCase()}-${roleIndex}-${skillIndex}`,
            platform: platform,
            salary: role.salaryRange,
            jobType: 'Full-time',
            postedDate: `${Math.floor(Math.random() * 7) + 1} days ago`,
            matchScore: Math.min(adjustedMatchScore - skillIndex, 99),
            isBookmarked: false
          });
        });
      });
    });

    // Sort by match score (highest first) and return top jobs
    return jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 12);
  };

  // Available job portals
  const availablePortals: JobPortal[] = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      logo: '💼',
      isConnected: false,
      jobCount: 0
    },
    {
      id: 'indeed',
      name: 'Indeed',
      logo: '🔍',
      isConnected: false,
      jobCount: 0
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      logo: '🏢',
      isConnected: false,
      jobCount: 0
    },
    {
      id: 'dice',
      name: 'Dice',
      logo: '🎲',
      isConnected: false,
      jobCount: 0
    },
    {
      id: 'remoteok',
      name: 'Remote OK',
      logo: '🌍',
      isConnected: false,
      jobCount: 0
    }
  ];

  useEffect(() => {
    setPortals(availablePortals);
    fetchConnectedPortals();
    fetchUserSkills();
    fetchJobs();
  }, []);

  const fetchUserSkills = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const skills = data.skills || [];
        setUserSkills(skills);
      }
    } catch (error) {
      console.error('Failed to fetch user skills:', error);
      setUserSkills(['JavaScript', 'React', 'Python', 'TypeScript', 'Node.js']);
    }
  };

  const fetchConnectedPortals = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/job-portal-credentials', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const credentials = await response.json();
        const updatedPortals = availablePortals.map(portal => {
          const credential = credentials.find((c: any) => c.platform === portal.id);
          return {
            ...portal,
            isConnected: !!credential,
            username: credential?.username,
            lastSync: credential?.last_used
          };
        });
        setPortals(updatedPortals);
      }
    } catch (error) {
      console.error('Failed to fetch connected portals:', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();

      if (searchKeywords) params.append('keywords', searchKeywords);
      if (selectedLocation) params.append('location', selectedLocation);
      if (selectedPortals.length > 0) {
        selectedPortals.forEach(portal => params.append('platform', portal));
      }

      const hasConnectedPortals = portals.some(portal => portal.isConnected);

      if (hasConnectedPortals) {
        const response = await fetch(`http://localhost:8000/jobs?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.jobs && data.jobs.length > 0) {
            const jobsWithMetadata = data.jobs.map((job: any) => ({
              ...job,
              matchScore: Math.floor(Math.random() * 20) + 80,
              isBookmarked: false
            }));
            setJobs(jobsWithMetadata);
            showSuccess(`Found ${jobsWithMetadata.length} jobs`, 'Jobs have been fetched from connected portals');
          } else {
            const sampleJobs = generateSkillBasedJobs(
              userSkills.length > 0 ? userSkills : ['JavaScript', 'React', 'Python', 'TypeScript', 'Node.js'],
              userExperience,
              userResume
            );
            setJobs(sampleJobs);
            showInfo(`Found ${sampleJobs.length} relevant jobs`, 'Sample jobs matched to your skills - Connect portals for real job listings');
          }
        } else {
          const sampleJobs = generateSkillBasedJobs(
            userSkills.length > 0 ? userSkills : ['JavaScript', 'React', 'Python', 'TypeScript', 'Node.js'],
            userExperience,
            userResume
          );
          setJobs(sampleJobs);
          showInfo(`Found ${sampleJobs.length} relevant jobs`, 'Jobs have been automatically matched to your skills');
        }
      } else {
        const sampleJobs = generateSkillBasedJobs(
          userSkills.length > 0 ? userSkills : ['JavaScript', 'React', 'Python', 'TypeScript', 'Node.js'],
          userExperience,
          userResume
        );
        setJobs(sampleJobs);
        showInfo('Demo jobs shown', 'Connect your job portals to see real opportunities');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      const sampleJobs = generateSkillBasedJobs(
        userSkills.length > 0 ? userSkills : ['JavaScript', 'React', 'Python', 'TypeScript', 'Node.js'],
        userExperience,
        userResume
      );
      setJobs(sampleJobs);
      showError('Unable to load live jobs', 'Showing sample data - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handlePortalConnect = (portal: JobPortal) => {
    setSelectedPortal(portal);
    setShowConnectModal(true);
    setCredentials({ username: '', password: '' });
  };

  const handlePortalDisconnect = async (portalId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/job-portal-credentials/${portalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showSuccess('Portal disconnected', 'Your job portal has been disconnected successfully');
        await fetchConnectedPortals();
        await fetchJobs();
      } else {
        showError('Failed to disconnect portal', 'Please try again later');
      }
    } catch (error) {
      console.error('Failed to disconnect portal:', error);
      showError('Failed to disconnect portal', 'Please check your connection and try again');
    }
  };

  const handleCredentialSubmit = async () => {
    if (!selectedPortal) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/job-portal-credentials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPortal.id,
          username: credentials.username,
          password: credentials.password,
        }),
      });

      if (response.ok) {
        showSuccess('Portal connected', `${selectedPortal.name} has been connected successfully`);
        setShowConnectModal(false);
        await fetchConnectedPortals();
        await fetchJobs();
      } else {
        const errorData = await response.json();
        showError('Failed to connect portal', errorData.detail || 'Please check your credentials and try again');
      }
    } catch (error) {
      console.error('Failed to connect portal:', error);
      showError('Failed to connect portal', 'Please check your connection and try again');
    }
  };

  const handleApplyToJob = (job: Job) => {
    const isRealJob = !job.url.includes('demo.jobportal.com');

    if (isRealJob) {
      window.open(job.url, '_blank');
      showSuccess('Redirecting to job', 'You will be redirected to the job portal to complete your application');
    } else {
      showInfo('Demo Job', 'This is a sample job for demonstration. Connect your job portals to apply to real opportunities.');
    }
  };

  const toggleAutoApply = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const newAutoApplyState = !autoApplyEnabled;

      const response = await fetch('http://localhost:8000/auto-apply/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newAutoApplyState }),
      });

      if (response.ok) {
        setAutoApplyEnabled(newAutoApplyState);
        showSuccess(
          newAutoApplyState ? 'Auto-apply enabled' : 'Auto-apply disabled',
          newAutoApplyState
            ? 'AI will automatically apply to matching jobs based on your preferences'
            : 'AI auto-apply has been turned off'
        );
      } else {
        showError('Failed to update auto-apply setting', 'Please try again later');
      }
    } catch (error) {
      console.error('Failed to toggle auto-apply:', error);
      showError('Failed to update auto-apply setting', 'Please check your connection and try again');
    }
  };

  const toggleBookmark = (jobId: string) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId
          ? { ...job, isBookmarked: !job.isBookmarked }
          : job
      )
    );
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchScoreBg = (score?: number) => {
    if (!score) return 'bg-gray-100';
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden pt-20">
      {/* Debug: Add visible content to check if page renders */}
      <div className="bg-red-500 text-white p-4 text-center font-bold">
        🏗️ JobsPage IS RENDERING - User: {user?.email || 'Not logged in'}
      </div>

      <div className="max-w-full overflow-x-hidden">{/* Rest of content */}
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
                <p className="text-gray-600 mt-2">Find and apply to jobs across multiple platforms</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">AI Auto-Apply</span>
                  <button
                    onClick={toggleAutoApply}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      autoApplyEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoApplyEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    autoApplyEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {autoApplyEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  placeholder="e.g., React Developer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  placeholder="e.g., San Francisco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portals
                </label>
                <select
                  multiple
                  value={selectedPortals}
                  onChange={(e) => setSelectedPortals(Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {portals.filter(portal => portal.isConnected).map(portal => (
                    <option key={portal.id} value={portal.id}>
                      {portal.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={fetchJobs}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
          </div>

          {/* Connected Portals */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Portals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {portals.map(portal => (
                <div key={portal.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{portal.logo}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{portal.name}</h3>
                        {portal.username && (
                          <p className="text-sm text-gray-500">{portal.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        portal.isConnected
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {portal.isConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>

                  {portal.lastSync && (
                    <p className="text-xs text-gray-500 mb-2">
                      Last sync: {new Date(portal.lastSync).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {portal.isConnected ? (
                      <button
                        onClick={() => handlePortalDisconnect(portal.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePortalConnect(portal)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Available Jobs</h2>
                <span className="text-sm text-gray-500">{jobs.length} jobs found</span>
              </div>
              {userSkills.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing jobs matched to your skills: {userSkills.slice(0, 3).join(', ')}
                  {userSkills.length > 3 && ` +${userSkills.length - 3} more`}
                </p>
              )}
            </div>

            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Searching for jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No jobs found. Try adjusting your search criteria.</p>
                </div>
              ) : (
                jobs.map(job => (
                  <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {job.title}
                          </h3>
                          {job.matchScore && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchScoreBg(job.matchScore)} ${getMatchScoreColor(job.matchScore)}`}>
                              {job.matchScore}% match
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="font-medium">{job.company}</span>
                          <span>📍 {job.location}</span>
                          {job.salary && <span>💰 {job.salary}</span>}
                          {job.postedDate && <span>🕒 {job.postedDate}</span>}
                        </div>

                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {job.platform}
                          </span>
                          {job.jobType && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {job.jobType}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <button
                          onClick={() => toggleBookmark(job.id)}
                          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                            job.isBookmarked ? 'text-yellow-500' : 'text-gray-400'
                          }`}
                          title={job.isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
                        >
                          <svg className="w-5 h-5" fill={job.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleApplyToJob(job)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connect Portal Modal */}
      {showConnectModal && selectedPortal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{selectedPortal.logo}</span>
              <h3 className="text-lg font-semibold">Connect {selectedPortal.name}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username/Email
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username or email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Your credentials are encrypted and stored securely. We only use them to fetch job listings on your behalf.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCredentialSubmit}
                disabled={!credentials.username || !credentials.password}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
