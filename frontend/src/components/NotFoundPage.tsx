import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-6xl font-bold text-blue-700 animate-bounce">404</h1>
      <p className="mt-4 text-xl text-gray-700">
        Oops! The page you're looking for doesn't exist.
      </p>
      <img
        src="https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif"
        alt="Lost raccoon"
        className="w-64 h-64 mt-6"
      />
      <Link
        to="/"
        className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
