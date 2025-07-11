// src/components/Layout.tsx

import React from 'react';
import Navbar from './Navbar';
import MentorEngine from '../mentors/MentorEngine';

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <>
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Animal mentor always visible */}
      <MentorEngine />

      <main className="p-4 bg-gray-50 min-h-screen">
        {children}
      </main>
    </>
  );
};

export default Layout;
