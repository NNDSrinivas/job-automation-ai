
import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import animations from '../utils/mentorAnimations';
import sounds from '../utils/mentorSounds';
import { useLocation } from 'react-router-dom';
import { MentorConfig, mentorConfigMap } from './mentorConfig';
import './MentorStyles.css';

const getRandomMessage = (mentor: MentorConfig) =>
  mentor.messages[Math.floor(Math.random() * mentor.messages.length)];

const getMentorFromStorage = (path: string, options: MentorConfig[]): MentorConfig => {
  const savedId = localStorage.getItem(`mentor-${path}`);
  return options.find(m => m.id === savedId) || options[0];
};

const MentorEngine: React.FC = () => {
  const location = useLocation();
  const screenPath = location.pathname;
  const mentorOptions = mentorConfigMap[screenPath] || mentorConfigMap['*'];
  const [mentor, setMentor] = useState<MentorConfig>(() =>
    getMentorFromStorage(screenPath, mentorOptions)
  );
  const [message, setMessage] = useState(getRandomMessage(mentor));
  const [animateClass, setAnimateClass] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newMsg = getRandomMessage(mentor);
      setMessage(newMsg);
      const sound = sounds[mentor.id];
      if (sound) new Audio(sound).play();
    }, 9000);
    return () => clearInterval(interval);
  }, [mentor]);

  useEffect(() => {
    const floatInterval = setInterval(() => {
      setAnimateClass('floating');
      setTimeout(() => setAnimateClass(''), 1000);
    }, 12000);
    return () => clearInterval(floatInterval);
  }, []);

  const switchMentor = () => {
    const currentIndex = mentorOptions.findIndex(m => m.id === mentor.id);
    const nextIndex = (currentIndex + 1) % mentorOptions.length;
    const nextMentor = mentorOptions[nextIndex];
    localStorage.setItem(`mentor-${screenPath}`, nextMentor.id);
    setMentor(nextMentor);
    setMessage(getRandomMessage(nextMentor));
  };

  return (
    <div className={`mentor-container ${animateClass}`}>
      {animations[mentor.animationPath] ? (
        <Lottie
          animationData={animations[mentor.animationPath]}
          className="mentor-lottie"
          loop
        />
      ) : (
        <div className="fallback-animation">🐾</div>
      )}
      <div className="mentor-message speech-bubble">{message}</div>
      <button className="switch-mentor-btn" onClick={switchMentor}>
        Switch Mentor
      </button>
    </div>
  );
};

export default MentorEngine;
