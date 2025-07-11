// src/mentors/MentorContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { mentorConfigMap } from './mentorConfig';

export interface Mentor {
  id: string;
  name: string;
  animationPath: string;
  messages: string[];
}


const MentorContext = createContext<Mentor | null>(null);

export const useMentor = () => {
  return useContext(MentorContext);
};

export const MentorProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mentor, setMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    const path = location.pathname;
    const matched = mentorConfigMap[path] || mentorConfigMap['*'];
    // Get the first mentor from the array, or null if no matches
    const selectedMentor = matched && matched.length > 0 ? matched[0] : null;
    setMentor(selectedMentor);
  }, [location.pathname]);

  return (
    <MentorContext.Provider value={mentor}>
      {children}
    </MentorContext.Provider>
  );
};
