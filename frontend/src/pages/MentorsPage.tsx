import React from 'react';

const MentorsPage: React.FC = () => {
  const mentors = [
    { id: 1, name: 'Eagle', emoji: '🦅', specialty: 'Strategic Career Planning' },
    { id: 2, name: 'Wolf', emoji: '🐺', specialty: 'Team Leadership & Management' },
    { id: 3, name: 'Fox', emoji: '🦊', specialty: 'Clever Problem Solving' },
    { id: 4, name: 'Dolphin', emoji: '🐬', specialty: 'Communication & Networking' },
    { id: 5, name: 'Lion', emoji: '🦁', specialty: 'Executive Leadership' }
  ];

  return (
    <div className="p-6 pt-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Career Mentors</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((mentor) => (
          <div key={mentor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="text-center">
              <div className="text-6xl mb-4">{mentor.emoji}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{mentor.name} Mentor</h3>
              <p className="text-gray-600 mb-4">{mentor.specialty}</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Chat with {mentor.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorsPage;
