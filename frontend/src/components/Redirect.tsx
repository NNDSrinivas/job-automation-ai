import React, { useEffect } from 'react';

interface RedirectProps {
  to: string;
  delay?: number;
}

const Redirect: React.FC<RedirectProps> = ({ to, delay = 0 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(`🚀 Redirecting to: ${to}`);
      window.location.href = to;
    }, delay);

    return () => clearTimeout(timer);
  }, [to, delay]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="text-white text-xl">
        Redirecting to {to}...
      </div>
    </div>
  );
};

export default Redirect;
