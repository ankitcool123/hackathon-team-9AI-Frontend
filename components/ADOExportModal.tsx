import React, { useState, FormEvent } from 'react';
import { exportToADO, ADOConfig } from '../services/adoService';
import type { Epic } from '../types';

interface ADOExportModalProps {
    results: Epic[];
    onClose: () => void;
}

const ADOExportModal: React.FC<ADOExportModalProps> = ({ results, onClose }) => {
    const [config, setConfig] = useState<ADOConfig>({ orgUrl: '', project: '', pat: '' });
    const [status, setStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('exporting');
        setMessage('Starting export...');

        try {
            await exportToADO(config, results, (progressMessage) => {
                setMessage(progressMessage);
            });
            setStatus('success');
            setMessage(`Successfully exported all work items to project: ${config.project}.`);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'An unknown error occurred during export.');
        }
    };
    
    const isFormDisabled = status === 'exporting';

    const getProjectUrl = () => {
         const sanitizedOrgUrl = config.orgUrl.endsWith('/') ? config.orgUrl.slice(0, -1) : config.orgUrl;
         return `${sanitizedOrgUrl}/${encodeURIComponent(config.project)}/_backlogs/backlog/Epics/All%20Epics`;
    }

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-300" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-lg m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <div className="flex justify-between items-center p-5 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Export to Azure DevOps</h2>
                    <button onClick={onClose} disabled={isFormDisabled} className="text-gray-400 hover:text-white disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {status !== 'success' && status !== 'error' && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label htmlFor="orgUrl" className="block text-sm font-medium text-gray-300">Organization URL</label>
                            <input type="text" id="orgUrl" value={config.orgUrl} onChange={e => setConfig({...config, orgUrl: e.target.value})} placeholder="https://dev.azure.com/your-org" required disabled={isFormDisabled} className="mt-1 w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="project" className="block text-sm font-medium text-gray-300">Project Name</label>
                            <input type="text" id="project" value={config.project} onChange={e => setConfig({...config, project: e.target.value})} placeholder="Your Project Name" required disabled={isFormDisabled} className="mt-1 w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="pat" className="block text-sm font-medium text-gray-300">Personal Access Token (PAT)</label>
                            <input type="password" id="pat" value={config.pat} onChange={e => setConfig({...config, pat: e.target.value})} placeholder="Enter your PAT" required disabled={isFormDisabled} className="mt-1 w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            <p className="text-xs text-gray-500 mt-1">
                                Requires "Work Items &gt; Read & Write" permissions. 
                                <a href="https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline ml-1">Learn more</a>.
                            </p>
                        </div>
                        
                        <div className="pt-4">
                             <button type="submit" disabled={isFormDisabled} className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2">
                                {status === 'exporting' ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Exporting...
                                    </>
                                ) : (
                                    'Export Work Items'
                                )}
                            </button>
                        </div>
                    </form>
                )}
                
                {status === 'exporting' && <div className="p-6 text-center text-gray-300">{message}</div>}

                {status === 'success' && (
                    <div className="p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500/20 mb-4">
                            <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Export Successful!</h3>
                        <p className="text-gray-400 mt-2">{message}</p>
                        <div className="mt-6">
                            <a href={getProjectUrl()} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-semibold">View Project Backlog &rarr;</a>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="p-6 text-center">
                         <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                            <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Export Failed</h3>
                        <p className="text-red-400 mt-2 text-sm bg-red-900/30 p-3 rounded-md">{message}</p>
                        <div className="mt-6">
                             <button onClick={() => setStatus('idle')} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">Try Again</button>
                        </div>
                    </div>
                )}


            </div>
             <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ADOExportModal;
