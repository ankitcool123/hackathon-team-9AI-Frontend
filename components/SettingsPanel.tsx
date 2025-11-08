import React, { useState, useEffect, FormEvent } from 'react';
import type { ADOConfig } from '../services/adoService';
import { testADOConnection } from '../services/adoService';

interface SettingsPanelProps {
  config: ADOConfig | null;
  onSave: (config: ADOConfig) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onSave }) => {
    const [isOpen, setIsOpen] = useState(!config?.pat); // Open by default if not configured
    const [formState, setFormState] = useState<ADOConfig>({ orgUrl: '', project: '', pat: '' });
    const [isSaved, setIsSaved] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState<string>('');


    useEffect(() => {
        if (config) {
            setFormState(config);
        }
    }, [config]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formState);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000); // Hide message after 2s
    };

    const handleTestConnection = async () => {
        setTestStatus('testing');
        setTestMessage('');
        try {
            const successMessage = await testADOConnection(formState);
            setTestStatus('success');
            setTestMessage(successMessage);
        } catch (err: any) {
            setTestStatus('error');
            setTestMessage(err.message);
        } finally {
            setTimeout(() => {
                setTestStatus('idle');
            }, 6000); // Clear status after 6 seconds
        }
    };

    const isFormInvalid = !formState.orgUrl.trim() || !formState.project.trim() || !formState.pat.trim();
    const isTesting = testStatus === 'testing';
    
    return (
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <h3 className="text-lg font-bold text-white">Azure DevOps Settings</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="border-t border-gray-700 p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="orgUrl" className="block text-sm font-medium text-gray-300">Organization URL</label>
                            <input type="text" id="orgUrl" value={formState.orgUrl} onChange={e => setFormState({...formState, orgUrl: e.target.value})} placeholder="https://dev.azure.com/your-org" required className="mt-1 w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="project" className="block text-sm font-medium text-gray-300">Project Name</label>
                            <input type="text" id="project" value={formState.project} onChange={e => setFormState({...formState, project: e.target.value})} placeholder="Your Project Name" required className="mt-1 w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="pat" className="block text-sm font-medium text-gray-300">Personal Access Token (PAT)</label>
                            <input type="password" id="pat" value={formState.pat} onChange={e => setFormState({...formState, pat: e.target.value})} placeholder="Enter your PAT" required className="mt-1 w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                        </div>
                        <div className="text-xs text-yellow-400 bg-yellow-900/30 p-2 rounded-md">
                            <strong>Security Note:</strong> Your PAT is stored in your browser's local storage for convenience. Do not use this on a shared computer.
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <button type="submit" disabled={isFormInvalid} className="w-full sm:w-auto flex-grow bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400 transition-colors duration-300 disabled:opacity-50">
                                {isSaved ? 'Settings Saved!' : 'Save Settings'}
                            </button>
                             <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={isFormInvalid || isTesting}
                                className="w-full sm:w-auto flex-grow bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isTesting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Testing...
                                    </>
                                ) : 'Test Connection'}
                            </button>
                        </div>
                        {testStatus !== 'idle' && testMessage && (
                            <div className={`mt-3 text-sm p-3 rounded-md animate-fade-in ${
                                testStatus === 'success' ? 'bg-green-900/50 text-green-300' : ''
                            } ${
                                testStatus === 'error' ? 'bg-red-900/50 text-red-300' : ''
                            }`}>
                                <p className="font-semibold">{testStatus === 'success' ? 'Success' : 'Error'}</p>
                                <div className="whitespace-pre-wrap">{testMessage}</div>
                            </div>
                        )}
                    </form>
                </div>
            )}
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default SettingsPanel;