import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  mentor?: AnimalMentor;
  suggestions?: string[];
}

interface AnimalMentor {
  id: string;
  name: string;
  animal: string;
  emoji: string;
  personality: string;
  expertise: string[];
  greeting: string;
  color: string;
}

const animalMentors: AnimalMentor[] = [
  {
    id: 'owl',
    name: 'Professor Hoot',
    animal: 'Wise Owl',
    emoji: '🦉',
    personality: 'Wise, strategic, loves detailed planning and research',
    expertise: ['Resume optimization', 'Interview preparation', 'Career strategy', 'Industry research'],
    greeting: "Hoot hoot! 🦉 I'm Professor Hoot, your wise career strategist. Let's craft a brilliant plan for your job search!",
    color: 'amber'
  },
  {
    id: 'dolphin',
    name: 'Splash',
    animal: 'Cheerful Dolphin',
    emoji: '🐬',
    personality: 'Energetic, encouraging, great at motivation and networking',
    expertise: ['Networking tips', 'Confidence building', 'Social skills', 'Communication'],
    greeting: "Hey there! 🐬 I'm Splash, your energetic career cheerleader! Ready to dive into some amazing opportunities?",
    color: 'blue'
  },
  {
    id: 'tiger',
    name: 'Fierce',
    animal: 'Determined Tiger',
    emoji: '🐅',
    personality: 'Bold, confident, pushes you to take action and be assertive',
    expertise: ['Salary negotiation', 'Assertiveness training', 'Leadership skills', 'Taking action'],
    greeting: "Roar! 🐅 I'm Fierce, and I'm here to unleash your inner strength! Let's conquer this job market together!",
    color: 'orange'
  },
  {
    id: 'panda',
    name: 'Zen',
    animal: 'Calm Panda',
    emoji: '🐼',
    personality: 'Peaceful, patient, helps with stress and work-life balance',
    expertise: ['Stress management', 'Work-life balance', 'Mindfulness', 'Emotional support'],
    greeting: "Hello friend 🐼 I'm Zen, here to keep you calm and balanced throughout your job search journey. Take a deep breath...",
    color: 'green'
  },
  {
    id: 'fox',
    name: 'Clever',
    animal: 'Smart Fox',
    emoji: '🦊',
    personality: 'Clever, creative, thinks outside the box with innovative solutions',
    expertise: ['Creative problem solving', 'Unique approaches', 'Portfolio building', 'Standing out'],
    greeting: "Well hello there! 🦊 I'm Clever, your creative career fox. Let's think outside the box and find clever ways to land your dream job!",
    color: 'red'
  }
];

const ChatbotPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedMentor, setSelectedMentor] = useState<AnimalMentor>(animalMentors[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Fetch user resumes
      const resumesResponse = await fetch('http://localhost:8000/resumes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resumesResponse.ok) {
        const resumes = await resumesResponse.json();
        setUserResumes(resumes);
      }

      // Fetch user profile
      const profileResponse = await fetch('http://localhost:8000/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setUserProfile(profile);
      }

      // Try to fetch applications (this endpoint might not exist yet)
      try {
        const applicationsResponse = await fetch('http://localhost:8000/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (applicationsResponse.ok) {
          const applications = await applicationsResponse.json();
          setUserApplications(applications);
        }
      } catch (error) {
        // Applications endpoint might not exist yet
        console.log('Applications endpoint not available');
      }
    } catch (error) {
      console.error('🤖 ChatBot: Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Initialize with selected mentor's greeting
    setMessages([
      {
        id: 1,
        text: selectedMentor.greeting,
        sender: 'bot',
        timestamp: new Date(),
        mentor: selectedMentor,
        suggestions: [
          "Help me improve my resume",
          "Practice interview questions",
          "Find networking opportunities",
          "Check my application status"
        ]
      }
    ]);
  }, [selectedMentor]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMentorResponse = (userMessage: string, mentor: AnimalMentor): { text: string; suggestions?: string[] } => {
    const lowerMessage = userMessage.toLowerCase();

    // Resume-related responses with personalized data
    if (lowerMessage.includes('resume') || lowerMessage.includes('cv') ||
        lowerMessage.includes('clients') || lowerMessage.includes('improve') ||
        lowerMessage.includes('changes needed') || lowerMessage.includes('areas') ||
        lowerMessage.includes('experience')) {

      let resumeInfo = '';
      let suggestions = ["Show me resume templates", "Help with bullet points", "Keywords for my industry", "Format my experience section"];

      if (userResumes && userResumes.length > 0) {
        const primaryResume = userResumes[0]; // Get the first/primary resume
        resumeInfo = `\n\n📄 **Your Current Resume Analysis:**\n`;

        if (primaryResume.parsedData && primaryResume.parsedData.skills && primaryResume.parsedData.skills.length > 0) {
          resumeInfo += `• **Skills:** ${primaryResume.parsedData.skills.slice(0, 5).join(', ')}${primaryResume.parsedData.skills.length > 5 ? ' and more...' : ''}\n`;
        }

        if (primaryResume.parsedData && primaryResume.parsedData.experience && primaryResume.parsedData.experience.length > 0) {
          resumeInfo += `• **Experience:** ${primaryResume.parsedData.experience.length} position(s) listed\n`;
          const latestJob = primaryResume.parsedData.experience[0];
          if (latestJob.company) {
            resumeInfo += `• **Latest Role:** ${latestJob.title || 'Position'} at ${latestJob.company}\n`;
          }
        }

        if (primaryResume.parsedData && primaryResume.parsedData.education && primaryResume.parsedData.education.length > 0) {
          resumeInfo += `• **Education:** ${primaryResume.parsedData.education[0].degree || 'Degree'} from ${primaryResume.parsedData.education[0].school || 'Institution'}\n`;
        }

        if (primaryResume.parsedData && primaryResume.parsedData.projects && primaryResume.parsedData.projects.length > 0) {
          resumeInfo += `• **Projects:** ${primaryResume.parsedData.projects.length} project(s) showcased\n`;
        }

        // Add personalized suggestions based on resume content
        suggestions = [
          "Analyze my work experience",
          "Improve my skills section",
          "Optimize for ATS scanning",
          "Review my project descriptions"
        ];
      } else {
        resumeInfo = `\n\n📄 **Resume Status:** I don't see any uploaded resumes yet. Let's start by uploading your resume so I can provide personalized advice!`;
        suggestions = ["Upload your resume first", "Resume writing guide", "What to include in resume", "Resume format tips"];
      }

      const responses = {
        owl: `Hoot! 🦉 Let me analyze your resume strategically. ${resumeInfo}\n\n**My Recommendations:**\n• Focus on quantifiable achievements with numbers and percentages\n• Use strong action verbs (achieved, implemented, optimized, led)\n• Tailor keywords to match job descriptions you're targeting\n• Ensure consistent formatting and clean visual hierarchy${userResumes.length > 0 ? '\n• Your experience shows great potential - let\'s optimize the presentation!' : ''}`,

        dolphin: `Splash here! 🐬 Your resume is your chance to shine! ${resumeInfo}\n\n**Let's make it sparkle:**\n• Highlight your unique personality while staying professional\n• Use active language that shows enthusiasm\n• Make accomplishments pop with specific examples\n• Keep formatting clean and scannable${userResumes.length > 0 ? '\n• I can see you have great experience - let\'s make it irresistible to employers!' : ''}`,

        tiger: `Roar! 🐅 Your resume should ROAR with confidence! ${resumeInfo}\n\n**Power moves:**\n• Lead with impact statements (increased, drove, delivered)\n• Don't be modest - own your achievements boldly\n• Use confident language that shows leadership\n• Remove weak words like 'responsible for' - use 'achieved' instead${userResumes.length > 0 ? '\n• You\'ve got solid experience - now let\'s make it POWERFUL!' : ''}`,

        panda: `Take it easy 🐼 Resume improvement is a journey, not a race. ${resumeInfo}\n\n**Gentle improvements:**\n• Start with your strongest achievements first\n• Focus on quality over quantity in descriptions\n• Remember that every experience has value\n• Break improvements into small, manageable steps${userResumes.length > 0 ? '\n• Your background is valuable - let\'s present it thoughtfully.' : ''}`,

        fox: `Clever thinking! 🦊 Let's make your resume stand out creatively! ${resumeInfo}\n\n**Smart strategies:**\n• Consider unique formatting that catches the eye\n• Add a personal brand statement or value proposition\n• Use creative section names that reflect your personality\n• Think about visual hierarchy and white space usage${userResumes.length > 0 ? '\n• With your experience, we can create something truly distinctive!' : ''}`
      };

      return {
        text: responses[mentor.id as keyof typeof responses],
        suggestions: suggestions
      };
    }

    // Interview-related responses
    if (lowerMessage.includes('interview') || lowerMessage.includes('questions')) {
      const responses = {
        owl: "Wise choice! 🦉 Interview preparation is crucial. Research the company thoroughly (recent news, values, competitors), prepare STAR method stories (Situation, Task, Action, Result), and practice common questions. Prepare 3-4 specific examples that showcase different skills. Shall we start with behavioral questions?",
        dolphin: "Interview time! 🐬 You've got this! Remember to smile, be enthusiastic, and let your personality shine. Practice makes perfect - want to do a mock interview? Key tips: Arrive 10 minutes early, prepare thoughtful questions, and follow up within 24 hours!",
        tiger: "Interview like a champion! 🐅 Walk in there with confidence, firm handshake, direct eye contact. You're interviewing them too - show them you're the prize! Preparation beats anxiety every time. Know your worth and communicate it clearly!",
        panda: "Breathe deeply 🐼 Interviews can be nerve-wracking, but remember they already liked your resume. Stay calm, be yourself, and trust in your abilities. It's okay to pause and think before answering. They want you to succeed.",
        fox: "Smart preparation! 🦊 Let's think of creative ways to answer common questions and prepare unique questions to ask them. Standing out is key! Consider bringing a portfolio, having thoughtful follow-up questions, or sharing a relevant case study."
      };
      return {
        text: responses[mentor.id as keyof typeof responses],
        suggestions: ["Practice common questions", "STAR method examples", "Questions to ask them", "What to wear advice"]
      };
    }

    // Networking responses
    if (lowerMessage.includes('network') || lowerMessage.includes('linkedin') || lowerMessage.includes('connect')) {
      const responses = {
        owl: "Excellent strategy! 🦉 Networking is 70% of how jobs are found. Strategy: 1) Identify key industry professionals, 2) Craft personalized connection messages (mention common connections/interests), 3) Attend virtual events, 4) Follow up consistently. Quality connections beat quantity every time.",
        dolphin: "Yes! 🐬 Networking is my specialty! People love connecting with genuine, enthusiastic individuals. Be authentic, show interest in others, and don't be afraid to reach out! Start with warm connections - friends, alumni, colleagues. Then expand your circle gradually.",
        tiger: "Network like a boss! 🐅 Be bold in your outreach, follow up consistently, and remember - every conversation is an opportunity. You belong in those professional circles! Don't just ask for jobs - offer value, insights, or help to others first.",
        panda: "Networking doesn't have to be overwhelming 🐼 Start small, be genuine in your connections, and remember that most people are happy to help. Quality over quantity. Begin with people you already know, then ask for warm introductions.",
        fox: "Clever networking! 🦊 Think beyond LinkedIn - try industry forums, virtual coffee chats, commenting thoughtfully on posts, or even sliding into DMs with value-first messages! Create content that showcases your expertise to attract connections."
      };
      return {
        text: responses[mentor.id as keyof typeof responses],
        suggestions: ["LinkedIn optimization", "Message templates", "Industry events", "Follow-up strategies"]
      };
    }

    // Job search strategies
    if (lowerMessage.includes('job search') || lowerMessage.includes('finding jobs') || lowerMessage.includes('apply')) {
      const responses = {
        owl: "Strategic job searching! 🦉 Use the 70-20-10 rule: 70% networking, 20% recruiters/agencies, 10% job boards. Research companies you want to work for, not just open positions. Create a target list of 20-30 companies and focus your efforts.",
        dolphin: "Let's dive into job hunting! 🐬 Cast a wide net but be strategic! Use multiple platforms (LinkedIn, Indeed, company websites), set up job alerts, and apply within 24-48 hours of posting. Fresh applications get more attention!",
        tiger: "Hunt for opportunities like a predator! 🐅 Don't just apply online - reach out directly to hiring managers, follow up on applications, and be persistent (but not annoying). One targeted application beats 10 spray-and-pray submissions.",
        panda: "Job searching can be overwhelming 🐼 Break it into manageable daily tasks: 2-3 quality applications, 2-3 networking contacts, 1 skill-building activity. Consistency beats intensity. Track your progress to stay motivated.",
        fox: "Creative job hunting! 🦊 Think outside the job board box! Try: informational interviews, industry meetups, social media engagement, freelance-to-hire opportunities, or even creating content that showcases your skills to attract employers."
      };
      return {
        text: responses[mentor.id as keyof typeof responses],
        suggestions: ["Job board strategies", "Application tracking", "Hidden job market", "Follow-up techniques"]
      };
    }

    // Salary negotiation
    if (lowerMessage.includes('salary') || lowerMessage.includes('negotiate') || lowerMessage.includes('pay')) {
      const responses = {
        owl: "Wise question! 🦉 Salary negotiation research is key. Use Glassdoor, PayScale, and industry reports to know your worth. Consider total compensation (benefits, PTO, remote work). Negotiate after the offer, not during interviews. Present data, not emotions.",
        dolphin: "Money talk! 🐬 Don't be afraid to advocate for yourself! Research market rates, highlight your unique value, and remember - they made an offer because they want YOU! Be confident but collaborative in negotiations.",
        tiger: "Know your worth and demand it! 🐅 You're not asking for a favor - you're discussing fair compensation for the value you bring. Research thoroughly, present your case confidently, and don't accept the first offer without consideration.",
        panda: "Salary discussions can be stressful 🐼 but they're normal business conversations. Prepare your research, practice your talking points, and remember - the worst they can say is no. Focus on mutual benefit, not confrontation.",
        fox: "Clever negotiation! 🦊 Think beyond base salary - consider signing bonuses, flexible work arrangements, professional development budgets, extra PTO, or earlier review cycles. Sometimes non-salary perks can be easier to negotiate!"
      };
      return {
        text: responses[mentor.id as keyof typeof responses],
        suggestions: ["Salary research tools", "Negotiation scripts", "Total compensation", "Timing strategies"]
      };
    }

    // Career change advice
    if (lowerMessage.includes('career change') || lowerMessage.includes('switch') || lowerMessage.includes('transition')) {
      const responses = {
        owl: "Strategic career transition! 🦉 First, identify transferable skills and map them to your target field. Consider: informational interviews, skill gap analysis, gradual transitions (freelance/part-time), or adjacent moves rather than complete pivots.",
        dolphin: "Career change adventure! 🐬 How exciting! Start by exploring what energizes you, research new fields thoroughly, and connect with people already doing what you want to do. Sometimes a fresh start is exactly what you need!",
        tiger: "Bold career move! 🐅 You have the power to reinvent yourself! Don't let fear hold you back - identify what you want, create a plan, and execute it step by step. Your experience isn't wasted - it's your competitive advantage!",
        panda: "Career transitions can feel overwhelming 🐼 Take it one step at a time. Start with self-reflection about what you want, then research options, gain new skills gradually, and build connections in your target field. Slow and steady wins.",
        fox: "Creative career pivot! 🦊 Think about unconventional paths - could you consult in your current field while building skills in the new one? Or find roles that blend both? Sometimes the best opportunities are at the intersection of fields!"
      };
      return {
        text: responses[mentor.id as keyof typeof responses],
        suggestions: ["Transferable skills", "Industry research", "Skill building plan", "Transition timeline"]
      };
    }

    // Motivation/encouragement
    if (lowerMessage.includes('discouraged') || lowerMessage.includes('rejected') || lowerMessage.includes('tired') || lowerMessage.includes('stressed')) {
      const responses = {
        owl: "I understand your frustration 🦉 Job searching is statistically challenging - average time is 3-6 months, with 100+ applications for 10-15 interviews leading to 1-3 offers. Each rejection is data - analyze what you can improve, but don't take it personally. Your perfect match is out there!",
        dolphin: "Oh sweetie! 🐬 I know it's tough, but you're doing amazing! Every 'no' gets you closer to that perfect 'yes'! Job searching is like swimming upstream - it takes persistence. Take a break, treat yourself, then dive back in with renewed energy!",
        tiger: "Listen up, champion! 🐅 Rejection is redirection! You're not getting those jobs because something BETTER is coming. Every champion faces setbacks - it's how you bounce back that matters. Keep pushing, keep believing - you're unstoppable!",
        panda: "I hear you 🐼 It's completely normal to feel this way. Job searching is emotionally taxing. Take time to rest, practice self-care, and remember that your worth isn't determined by job rejections. You've overcome challenges before - you've got this.",
        fox: "Hey there! 🦊 Feeling stuck? Let's get creative! Maybe it's time to try a different approach, explore new industries, or pivot your strategy. Every setback is a setup for a comeback! What if this 'rejection' is actually redirecting you to something better?"
      };
      return {
        text: responses[mentor.id as keyof typeof responses],
        suggestions: ["Self-care tips", "Motivation boost", "Strategy reset", "Success stories"]
      };
    }

    // Skills development
    if (lowerMessage.includes('skills') || lowerMessage.includes('learn') || lowerMessage.includes('improve')) {
      const responses = {
        owl: "Strategic skill development! 🦉 First, analyze job descriptions in your target field to identify in-demand skills. Focus on skills with high ROI - those that appear in 80% of job postings. Consider: online courses, certifications, hands-on projects, or volunteer work to demonstrate competency.",
        dolphin: "Learning journey! 🐬 I love your growth mindset! Start with free resources like Coursera, YouTube, or library courses. Build projects to showcase your skills - employers value practical application over certificates. Make learning fun and social!",
        tiger: "Skill up like a champion! 🐅 Don't just learn - APPLY what you learn immediately! Build a portfolio, contribute to open source, or offer to help friends/non-profits. Action beats theory every time. Show, don't just tell!",
        panda: "Continuous learning is beautiful 🐼 Choose 1-2 skills to focus on deeply rather than spreading thin. Set small daily learning goals (30 minutes), join study groups or communities, and be patient with yourself. Progress over perfection.",
        fox: "Smart skill strategy! 🦊 Look for emerging skills or niche combinations that make you unique! Consider: AI tools, data analysis, design thinking, or cross-functional skills that set you apart. Sometimes the most valuable skills are those others overlook!"
      };
      return {
        text: responses[mentor.id as keyof typeof responses],
        suggestions: ["Skill gap analysis", "Learning resources", "Project ideas", "Certification value"]
      };
    }

    // Application status and career planning with user data
    if (lowerMessage.includes('application') || lowerMessage.includes('status') ||
        lowerMessage.includes('applied') || lowerMessage.includes('career planning') ||
        lowerMessage.includes('goals') || lowerMessage.includes('planning')) {

      let applicationInfo = '';
      if (userApplications && userApplications.length > 0) {
        applicationInfo = `\n\n📊 **Your Application Status:**\n• Total Applications: ${userApplications.length}\n• Recent Activity: Check your dashboard for latest updates\n`;
      } else {
        applicationInfo = `\n\n📊 **Application Status:** You haven't started applying yet. Let's create a strategic application plan!`;
      }

      const planningResponses = {
        owl: `Excellent question! 🦉 Strategic career planning is key to success. ${applicationInfo}\n\n**Strategic Next Steps:**\n• Define clear 6-month and 1-year career goals\n• Identify target companies and roles\n• Create a weekly application schedule\n• Track your progress systematically`,
        dolphin: `Great question! 🐬 I love helping with career planning! ${applicationInfo}\n\n**Let's plan your success:**\n• Set exciting but achievable goals\n• Break big dreams into smaller steps\n• Celebrate every small win along the way\n• Stay positive and persistent!`,
        tiger: `Powerful question! 🐅 Champions always have a plan! ${applicationInfo}\n\n**Your action plan:**\n• Set bold, ambitious career targets\n• Take decisive action every single day\n• Don't wait for perfect timing - start now\n• Own your career path like the leader you are!`,
        panda: `Thoughtful question 🐼 Career planning should be calming, not stressful. ${applicationInfo}\n\n**Gentle planning approach:**\n• Take time to reflect on what truly matters to you\n• Set realistic timelines that don't overwhelm you\n• Focus on steady progress over speed\n• Remember that career paths aren't always linear`,
        fox: `Smart planning! 🦊 Let's think creatively about your career strategy! ${applicationInfo}\n\n**Creative career moves:**\n• Consider unconventional paths to your goals\n• Look for hidden opportunities in emerging fields\n• Build a personal brand that opens doors\n• Think about skills that will be valuable in 5 years`
      };

      return {
        text: planningResponses[mentor.id as keyof typeof planningResponses],
        suggestions: ["Set career goals", "Create application schedule", "Track my progress", "Explore new opportunities"]
      };
    }

    // Default responses with more personality - now personalized with user name
    const defaultResponses = {
      owl: `Hoot hoot! 🦉 ${user ? `Hi ${user.firstName}, ` : ''}that's an interesting question. As your strategic advisor, I'd love to help you think through this systematically. Can you tell me more details about your specific situation? The more context you provide, the better I can guide you with evidence-based advice.`,
      dolphin: `Hey there! 🐬 ${user ? `${user.firstName}, ` : ''}I'm excited to help with whatever you need! Your enthusiasm is contagious - let's tackle this together and make some waves! Could you give me a bit more detail about what you're looking for? I want to make sure I give you the best advice possible!`,
      tiger: `Roar! 🐅 ${user ? `${user.firstName}, ` : ''}I'm ready to help you dominate whatever challenge you're facing! Give me the details and let's create an action plan! I thrive on helping people achieve their goals - what's your biggest priority right now?`,
      panda: `I'm here for you 🐼 ${user ? `${user.firstName}, ` : ''}take your time explaining what's on your mind. There's no rush - we'll work through this together peacefully. Whether it's career stress, job search challenges, or just need someone to listen, I'm all ears.`,
      fox: `Interesting! 🦊 ${user ? `${user.firstName}, ` : ''}I love a good puzzle. Let me put on my thinking cap and come up with some clever solutions for you! What specific challenge are you facing? I'm great at finding creative approaches to tricky situations!`
    };

    return {
      text: defaultResponses[mentor.id as keyof typeof defaultResponses],
      suggestions: ["Tell me about yourself", "What are your goals?", "Show me job openings", "Help with career planning"]
    };
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = getMentorResponse(inputText, selectedMentor);
      const botResponse: Message = {
        id: messages.length + 2,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        mentor: selectedMentor,
        suggestions: response.suggestions
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  const switchMentor = (mentor: AnimalMentor) => {
    setSelectedMentor(mentor);
  };  return (
    <div className="min-h-screen bg-gray-50 pt-20 w-full">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 AI Career Mentors</h1>
              <p className="text-gray-600 mt-1">Get personalized career advice from your favorite animal mentors</p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-2">{selectedMentor.emoji}</div>
              <div className="text-sm font-medium text-gray-900">{selectedMentor.name}</div>
              <div className="text-xs text-gray-600">{selectedMentor.animal}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Mentor Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Choose Your Mentor</h3>
              <div className="space-y-3">
                {animalMentors.map((mentor) => (
                  <button
                    key={mentor.id}
                    onClick={() => switchMentor(mentor)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedMentor.id === mentor.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{mentor.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">{mentor.name}</div>
                        <div className="text-xs text-gray-600 truncate">{mentor.expertise[0]}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Current Mentor Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">About {selectedMentor.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{selectedMentor.personality}</p>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">Specialties:</div>
                  {selectedMentor.expertise.map((skill, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[700px]">
              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.sender === 'bot' && (
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                            {message.mentor?.emoji}
                          </div>
                        </div>
                      )}

                      <div
                        className={`max-w-sm lg:max-w-2xl px-4 py-3 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.sender === 'bot' && (
                          <div className="text-xs font-medium mb-1 opacity-70">
                            {message.mentor?.name}
                          </div>
                        )}
                        <div className="text-sm leading-relaxed break-words">{message.text}</div>
                      </div>

                      {message.sender === 'user' && (
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium">
                            {user?.firstName?.charAt(0) || 'U'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && message.sender === 'bot' && (
                      <div className="mt-3 ml-13 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                        {selectedMentor.emoji}
                      </div>
                    </div>
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={`Ask ${selectedMentor.name} anything about your career...`}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isTyping}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isTyping || !inputText.trim()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Press Enter to send • Choose different mentors for different perspectives
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
