import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { useLocation } from 'react-router-dom';
import { mentorConfigMap, MentorConfig } from './mentorConfig';
import './MentorStyles.css';
import animations from '../utils/mentorAnimations';


interface SelectorProps {
  onSelect: (mentor: MentorConfig) => void;
  currentMentorId: string;
}

const MentorSelector: React.FC<SelectorProps> = ({ onSelect, currentMentorId }) => {
  const location = useLocation();
  const screenPath = location.pathname;
  const screenMentors = mentorConfigMap[screenPath] || mentorConfigMap['*'];

  const [visible, setVisible] = useState(false);

  const handleSelect = (mentor: MentorConfig) => {
    localStorage.setItem(`mentor-${screenPath}`, mentor.id);
    onSelect(mentor);
  };

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 3000); // show after 3s
    return () => clearTimeout(timeout);
  }, []);

  if (!visible || screenMentors.length <= 1) return null;

  return (
    <div className="mentor-selector-container">
      <div className="mentor-selector-title">Choose Your Mentor:</div>
      <div className="mentor-selector-list">
        {screenMentors.map((mentor) => (
          <MentorChoice
            key={mentor.id}
            mentor={mentor}
            isSelected={mentor.id === currentMentorId}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
};

interface MentorChoiceProps {
  mentor: MentorConfig;
  isSelected: boolean;
  onSelect: (mentor: MentorConfig) => void;
}

const MentorChoice: React.FC<MentorChoiceProps> = ({ mentor, isSelected, onSelect }) => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    import(`../assets/animations/${mentor.animationPath}`).then((mod) => {
      setAnimationData(mod.default || mod);
    });
  }, [mentor.animationPath]);

  return (
    <div
      className={`mentor-choice ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(mentor)}
    >
      {animationData && (
        <Lottie
          animationData={animationData}
          className="mentor-choice-animation"
          loop
        />
      )}
      <div className="mentor-choice-name">{mentor.name}</div>
    </div>
  );
};

export default MentorSelector;
