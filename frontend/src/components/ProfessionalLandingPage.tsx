import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfessionalLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Automation',
      description: 'Advanced AI algorithms automatically find and apply to jobs that match your profile with 95% accuracy.',
      details: ['Smart job matching', 'Auto-generated cover letters', 'Real-time optimization']
    },
    {
      icon: '🎯',
      title: 'Multi-Platform Integration',
      description: 'Connect with LinkedIn, Indeed, Glassdoor, and 50+ job boards for maximum reach.',
      details: ['Cross-platform sync', 'Unified dashboard', 'Real-time updates']
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Track your application success rates, optimize strategies, and get actionable insights.',
      details: ['Success metrics', 'Performance tracking', 'Trend analysis']
    },
    {
      icon: '🛡️',
      title: 'Enterprise Security',
      description: 'Bank-level encryption and security protocols protect your sensitive data.',
      details: ['End-to-end encryption', 'GDPR compliant', 'Secure credential storage']
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Apply to hundreds of jobs in minutes, not hours. 10x faster than manual applications.',
      details: ['Instant applications', 'Bulk processing', 'Real-time notifications']
    },
    {
      icon: '🎨',
      title: 'Smart Personalization',
      description: 'AI customizes each application to maximize your chances of getting hired.',
      details: ['Personalized content', 'Company research', 'Skill matching']
    }
  ];

  const stats = [
    { number: '500K+', label: 'Jobs Applied To' },
    { number: '50K+', label: 'Happy Users' },
    { number: '85%', label: 'Success Rate' },
    { number: '10x', label: 'Faster Applications' }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      company: 'Google',
      image: '👩‍💻',
      quote: 'This platform helped me land my dream job at Google. The AI matching is incredible!'
    },
    {
      name: 'Marcus Johnson',
      role: 'Product Manager',
      company: 'Microsoft',
      image: '👨‍💼',
      quote: 'Applied to 200+ jobs effortlessly. Got 5 interviews in the first week!'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Data Scientist',
      company: 'Tesla',
      image: '👩‍🔬',
      quote: 'The automation saved me 20+ hours per week. Absolutely game-changing!'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            🚀 JobAI Pro
          </div>
          <div className="hidden md:flex space-x-8 text-white">
            <a href="#features" className="hover:text-purple-300 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-purple-300 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-purple-300 transition-colors">Reviews</a>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
            >
              Start Free Trial
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            The Future of
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {' '}Job Hunting
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 mb-8 leading-relaxed">
            AI-powered job automation that applies to hundreds of positions while you sleep.
            <br />
            <span className="text-white font-semibold">Land your dream job 10x faster.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-2xl"
            >
              🚀 Start Free Trial
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-white/10 text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
            >
              📊 View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div
                key={index}



                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-purple-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div


            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Revolutionary Features
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Cutting-edge AI technology meets intuitive design to deliver the most advanced job automation platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}



                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-purple-200 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="text-sm text-purple-300 flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div


            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-purple-200">
              Join thousands of professionals who've transformed their careers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}



                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
              >
                <div className="text-4xl mb-4">{testimonial.image}</div>
                <p className="text-purple-200 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-purple-300">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div


          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-3xl p-12 border border-white/20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-purple-200 mb-8">
            Join the AI revolution and let technology work for you. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-2xl"
            >
              🚀 Start Free Trial - No Credit Card Required
            </button>
          </div>
          <p className="text-sm text-purple-300 mt-4">
            14-day free trial • Cancel anytime • Full access to all features
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-bold text-white mb-4">🚀 JobAI Pro</div>
          <p className="text-purple-200 mb-6">
            The world's most advanced AI job automation platform
          </p>
          <div className="flex justify-center space-x-8 text-purple-300">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfessionalLandingPage;
