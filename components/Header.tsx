import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
          AI Character & Lip-Sync Video Generator
        </span>
      </h1>
    </header>
  );
};

export default Header;