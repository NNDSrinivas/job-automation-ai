import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Question {
  id: string;
  jobTitle: string;
  company: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'number';
  options?: string[];
  required: boolean;
  aiGenerated: boolean;
  answer?: string;
  status: 'pending' | 'answered' | 'skipped';
  createdAt: string;
  jobUrl?: string;
}

interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  status: 'analyzing' | 'questions_ready' | 'answered' | 'applied';
  questionsCount: number;
  answeredCount: number;
  jobUrl: string;
  dateCreated: string;
}

const QuestionnairePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'answered' | 'applications'>('pending');
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      jobTitle: 'Senior Software Engineer',
      company: 'TechCorp',
      question: 'Describe your experience with React and TypeScript in large-scale applications.',
      type: 'textarea',
      required: true,
      aiGenerated: true,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z',
      jobUrl: 'https://techcorp.com/jobs/senior-engineer'
    },
    {
      id: '2',
      jobTitle: 'Senior Software Engineer',
      company: 'TechCorp',
      question: 'How many years of experience do you have with cloud platforms (AWS, Azure, GCP)?',
      type: 'select',
      options: ['0-1 years', '2-3 years', '4-5 years', '6+ years'],
      required: true,
      aiGenerated: true,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z',
      jobUrl: 'https://techcorp.com/jobs/senior-engineer'
    },
    {
      id: '3',
      jobTitle: 'Product Manager',
      company: 'StartupXYZ',
      question: 'Tell us about a time you launched a successful product feature.',
      type: 'textarea',
      required: true,
      aiGenerated: true,
      status: 'answered',
      answer: 'At my previous role, I led the development of a user dashboard that increased engagement by 40%...',
      createdAt: '2024-01-14T14:20:00Z',
      jobUrl: 'https://startupxyz.com/careers/pm'
    }
  ]);

  const [applications, setApplications] = useState<JobApplication[]>([
    {
      id: '1',
      jobTitle: 'Senior Software Engineer',
      company: 'TechCorp',
      status: 'questions_ready',
      questionsCount: 5,
      answeredCount: 0,
      jobUrl: 'https://techcorp.com/jobs/senior-engineer',
      dateCreated: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      jobTitle: 'Product Manager',
      company: 'StartupXYZ',
      status: 'answered',
      questionsCount: 4,
      answeredCount: 4,
      jobUrl: 'https://startupxyz.com/careers/pm',
      dateCreated: '2024-01-14T14:20:00Z'
    },
    {
      id: '3',
      jobTitle: 'Full Stack Developer',
      company: 'InnovateInc',
      status: 'analyzing',
      questionsCount: 0,
      answeredCount: 0,
      jobUrl: 'https://innovateinc.com/jobs/fullstack',
      dateCreated: '2024-01-16T09:15:00Z'
    }
  ]);

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const answeredQuestions = questions.filter(q => q.status === 'answered');

  const handleAnswerQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setCurrentAnswer(question.answer || '');
    setShowAnswerModal(true);
  };

  const saveAnswer = () => {
    if (selectedQuestion) {
      setQuestions(questions.map(q =>
        q.id === selectedQuestion.id
          ? { ...q, answer: currentAnswer, status: 'answered' as const }
          : q
      ));
      setShowAnswerModal(false);
      setSelectedQuestion(null);
      setCurrentAnswer('');
    }
  };

  const skipQuestion = (questionId: string) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, status: 'skipped' as const }
        : q
    ));
  };

  const generateMoreQuestions = async (jobUrl: string) => {
    try {
      // This would call your backend API to analyze the job posting and generate questions
      console.log('Generating questions for:', jobUrl);
      // For demo purposes, we'll add some mock questions
      const newQuestions: Question[] = [
        {
          id: Date.now().toString(),
          jobTitle: 'New Position',
          company: 'AI Generated',
          question: 'What interests you most about this role?',
          type: 'textarea',
          required: true,
          aiGenerated: true,
          status: 'pending',
          createdAt: new Date().toISOString(),
          jobUrl
        }
      ];
      setQuestions([...questions, ...newQuestions]);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      analyzing: 'bg-yellow-100 text-yellow-800',
      questions_ready: 'bg-blue-100 text-blue-800',
      answered: 'bg-green-100 text-green-800',
      applied: 'bg-purple-100 text-purple-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 AI Questionnaire Engine</h1>
              <p className="text-gray-600 mt-1">AI analyzes job postings and generates custom application questions</p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{pendingQuestions.length}</div>
                <div className="text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{answeredQuestions.length}</div>
                <div className="text-gray-500">Answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{applications.length}</div>
                <div className="text-gray-500">Applications</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'pending', label: 'Pending Questions', icon: '⏳', count: pendingQuestions.length },
              { id: 'answered', label: 'Answered Questions', icon: '✅', count: answeredQuestions.length },
              { id: 'applications', label: 'Application Status', icon: '📊', count: applications.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {pendingQuestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Questions</h3>
                <p className="text-gray-600 mb-6">AI will generate questions when you apply to new jobs</p>
                <button
                  onClick={() => generateMoreQuestions('https://example.com/job')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Generate Test Questions
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingQuestions.map((question) => (
                  <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{question.jobTitle}</h3>
                          {question.aiGenerated && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                              🤖 AI Generated
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{question.company}</p>
                      </div>
                      {question.required && (
                        <span className="text-red-500 text-sm font-medium">Required</span>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-800 leading-relaxed">{question.question}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Created: {new Date(question.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => skipQuestion(question.id)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => handleAnswerQuestion(question)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                        >
                          Answer Question
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'answered' && (
          <div className="space-y-6">
            {answeredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Answered Questions Yet</h3>
                <p className="text-gray-600">Answer some pending questions to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {answeredQuestions.map((question) => (
                  <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{question.jobTitle}</h3>
                        <p className="text-sm text-gray-600">{question.company}</p>
                      </div>
                      <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        ✅ Answered
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-800 font-medium mb-2">{question.question}</p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{question.answer}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Answered: {new Date(question.createdAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => handleAnswerQuestion(question)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit Answer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{app.jobTitle}</h3>
                      <p className="text-sm text-gray-600">{app.company}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadge(app.status)}`}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Questions Generated:</span>
                      <span className="font-medium">{app.questionsCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Questions Answered:</span>
                      <span className="font-medium">{app.answeredCount}</span>
                    </div>
                    {app.questionsCount > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{width: `${(app.answeredCount / app.questionsCount) * 100}%`}}
                        ></div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      {new Date(app.dateCreated).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(app.jobUrl, '_blank')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Job
                      </button>
                      {app.questionsCount > 0 && (
                        <button
                          onClick={() => setActiveTab('pending')}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-200"
                        >
                          Answer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Answer Modal */}
      {showAnswerModal && selectedQuestion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Answer Question</h3>
                <button
                  onClick={() => setShowAnswerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900">{selectedQuestion.jobTitle}</h4>
                  <p className="text-blue-700 text-sm">{selectedQuestion.company}</p>
                </div>
                <p className="text-gray-800 font-medium mb-4">{selectedQuestion.question}</p>

                {selectedQuestion.type === 'textarea' ? (
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your answer here..."
                  />
                ) : selectedQuestion.type === 'select' && selectedQuestion.options ? (
                  <select
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select an option...</option>
                    {selectedQuestion.options.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your answer here..."
                  />
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAnswerModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAnswer}
                  disabled={!currentAnswer.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Save Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnairePage;
