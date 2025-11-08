import React, { useState } from 'react';
import type { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (history.length === 0) {
        return null; // Don't show the panel if there's no history
    }

    return (
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <h3 className="text-lg font-bold text-white">History</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="border-t border-gray-700 p-2 max-h-60 overflow-y-auto">
                    <ul className="space-y-1">
                        {history.map(item => (
                            <li key={item.id}>
                                <button 
                                    onClick={() => onSelect(item)}
                                    className="w-full text-left p-2 rounded-md hover:bg-gray-700/50 transition-colors"
                                >
                                    <p className="text-sm font-semibold text-gray-200 truncate">{item.title}</p>
                                    <p className="text-xs text-gray-400">{item.date}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;
