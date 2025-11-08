
import React from 'react';

const WelcomeMessage: React.FC = () => {
  return (
    <div className="text-center p-8 bg-gray-800/50 border border-gray-700 rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Agile Story Generator</h2>
      <p className="text-gray-400 max-w-2xl mx-auto">
        Transform your project ideas into a structured agile backlog. Simply type or upload your requirements above, and let AI craft your Epics, Features, and User Stories in seconds.
      </p>
      <div className="mt-6 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-brand-primary">1. Input Your Idea</h3>
            <p className="text-sm text-gray-400 mt-1">Provide a description of your project or feature.</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-brand-primary">2. Generate Stories</h3>
            <p className="text-sm text-gray-400 mt-1">Click the "Generate" button and watch the magic happen.</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-brand-primary">3. Review & Refine</h3>
            <p className="text-sm text-gray-400 mt-1">Get a complete agile plan to kickstart your development.</p>
          </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
