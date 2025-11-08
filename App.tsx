import React, { useState, useCallback, useEffect } from 'react';
import { generateStories } from './services/geminiService';
import { exportToADO } from './services/adoService';
import type { Epic, User, HistoryItem } from './types';
import type { ADOConfig } from './services/adoService';
import Header from './components/Header';
import InputArea from './components/InputArea';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import WelcomeMessage from './components/WelcomeMessage';
import Login from './components/Login';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';


type Status = 'idle' | 'generating' | 'exporting' | 'success' | 'error';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [adoConfig, setAdoConfig] = useState<ADOConfig | null>(null);
  
  const [results, setResults] = useState<Epic[] | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');

  useEffect(() => {
    // Check for a logged-in user in localStorage
    const savedUser = localStorage.getItem('agile-gen-user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      handleLogin(user, false);
    }
  }, []);

  const handleLogin = (user: User, shouldSave: boolean = true) => {
    setCurrentUser(user);
    if (shouldSave) {
        localStorage.setItem('agile-gen-user', JSON.stringify(user));
    }
    
    // Load user-specific history and settings
    const userHistory = localStorage.getItem(`agile-gen-history-${user.name}`);
    setHistory(userHistory ? JSON.parse(userHistory) : []);

    const userAdoConfig = localStorage.getItem(`agile-gen-ado-${user.name}`);
    setAdoConfig(userAdoConfig ? JSON.parse(userAdoConfig) : null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setHistory([]);
    setAdoConfig(null);
    setResults(null);
    setStatus('idle');
    localStorage.removeItem('agile-gen-user');
  };

  const handleSaveAdoConfig = (config: ADOConfig) => {
    if (!currentUser) return;
    setAdoConfig(config);
    localStorage.setItem(`agile-gen-ado-${currentUser.name}`, JSON.stringify(config));
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setResults(item.data);
    setStatus('success');
    setError(null);
  }

  const handleGenerate = useCallback(async (inputText: string, knowledgeBase: string) => {
    if (!currentUser) {
      setError('You must be logged in to perform this action.');
      return;
    }
    if (!adoConfig || !adoConfig.orgUrl || !adoConfig.project || !adoConfig.pat) {
      setError('Please configure your Azure DevOps settings before generating a plan.');
      setStatus('error');
      return;
    }
    if (!inputText.trim()) {
      setError('Please enter some text or upload a document for the main requirement.');
      setStatus('error');
      return;
    }
    
    setStatus('generating');
    setProgressMessage('Generating your agile stories...');
    setError(null);
    setResults(null);

    try {
      const generatedEpics = await generateStories(inputText, knowledgeBase);
      setResults(generatedEpics);

      setStatus('exporting');
      setProgressMessage('Exporting to Azure DevOps...');
      
      await exportToADO(adoConfig, generatedEpics, (progress) => {
          setProgressMessage(progress);
      });
      
      // Save to history
      const newHistoryItem: HistoryItem = {
        id: new Date().toISOString(),
        title: generatedEpics[0]?.epic || 'Untitled Plan',
        date: new Date().toLocaleString(),
        data: generatedEpics,
      };
      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(`agile-gen-history-${currentUser.name}`, JSON.stringify(updatedHistory));

      setStatus('success');
      setProgressMessage('Generation and export complete!');

    } catch (err: any) {
      console.error(err);
      setError(`An error occurred: ${err.message || 'Please check your settings and try again.'}`);
      setStatus('error');
    }
  }, [currentUser, adoConfig, history]);

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isLoading = status === 'generating' || status === 'exporting';

  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <Header user={currentUser} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar */}
            <aside className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-8">
                <SettingsPanel config={adoConfig} onSave={handleSaveAdoConfig} />
                <HistoryPanel history={history} onSelect={handleSelectHistory} />
            </aside>
            
            {/* Main Content */}
            <div className="lg:col-span-8 xl:col-span-9">
                <InputArea onGenerate={handleGenerate} isLoading={isLoading} isAdoConfigured={!!(adoConfig?.pat && adoConfig?.orgUrl && adoConfig?.project)} />
                <div className="mt-12">
                    {isLoading && <Loader message={progressMessage} />}
                    {status === 'error' && error && <ErrorMessage message={error} />}
                    {results && <ResultsDisplay results={results} />}
                    {!isLoading && status !== 'error' && !results && <WelcomeMessage />}
                </div>
            </div>
         </div>
      </main>
      <footer className="text-center py-6 text-gray-400 text-sm">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
