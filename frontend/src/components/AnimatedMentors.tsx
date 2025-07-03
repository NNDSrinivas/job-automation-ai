import React from 'react';

const AnimatedMentors = () => {
  return (
    <div className="absolute -top-20 right-0 flex items-center space-x-4">
      <div className="animate-bounce w-16 h-16 bg-yellow-200 border border-black rounded-full flex items-center justify-center text-xs font-bold shadow-md">
        🐧
      </div>
      <div className="animate-pulse w-16 h-16 bg-pink-200 border border-black rounded-full flex items-center justify-center text-xs font-bold shadow-md">
        🦊
      </div>
    </div>
  );
};

export default AnimatedMentors;
