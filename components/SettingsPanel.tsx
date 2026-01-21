
import React, { useEffect } from 'react';
import { AppSettings, RenamingPart } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings }) => {
  const allParts: RenamingPart[] = ['Year', 'Author', 'Title', 'Journal'];

  // Ensure 'Journal' is in the naming order if it's missing (for backward compatibility or initialization)
  useEffect(() => {
    if (!settings.namingOrder.includes('Journal')) {
      setSettings({
        ...settings,
        namingOrder: [...settings.namingOrder, 'Journal']
      });
    }
  }, []);

  const movePart = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...settings.namingOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setSettings({ ...settings, namingOrder: newOrder });
  };

  const togglePart = (part: RenamingPart) => {
    const isIncluded = settings.namingOrder.includes(part);
    if (isIncluded) {
      if (settings.namingOrder.length > 1) {
        setSettings({
          ...settings,
          namingOrder: settings.namingOrder.filter(p => p !== part)
        });
      }
    } else {
      setSettings({
        ...settings,
        namingOrder: [...settings.namingOrder, part]
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-28">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <i className="fas fa-cog text-blue-600"></i>
        Naming Rules
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Parts & Order</label>
          <div className="space-y-2">
            {settings.namingOrder.map((part, idx) => (
              <div 
                key={part} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-mono text-xs">{idx + 1}</span>
                  <span className="font-medium text-gray-700">{part}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => togglePart(part)}
                    className="p-1 hover:bg-red-50 rounded text-red-400 mr-2"
                    title="Remove from format"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  <button 
                    onClick={() => movePart(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 hover:bg-white rounded text-gray-500 disabled:text-gray-200"
                  >
                    <i className="fas fa-chevron-up"></i>
                  </button>
                  <button 
                    onClick={() => movePart(idx, 'down')}
                    disabled={idx === settings.namingOrder.length - 1}
                    className="p-1 hover:bg-white rounded text-gray-500 disabled:text-gray-200"
                  >
                    <i className="fas fa-chevron-down"></i>
                  </button>
                </div>
              </div>
            ))}
            
            {/* Add missing parts section */}
            {allParts.filter(p => !settings.namingOrder.includes(p)).map(part => (
               <button
                key={part}
                onClick={() => togglePart(part)}
                className="w-full flex items-center gap-2 p-2 border-2 border-dashed border-gray-100 rounded-lg text-gray-400 hover:border-blue-200 hover:text-blue-500 transition-all text-sm font-medium"
               >
                 <i className="fas fa-plus-circle"></i>
                 Add {part} to filename
               </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={settings.useTranslation}
                onChange={(e) => setSettings({ ...settings, useTranslation: e.target.checked })}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${settings.useTranslation ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.useTranslation ? 'translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              Translate Title to Chinese
            </div>
          </label>
          <p className="mt-2 text-xs text-gray-500">
            When enabled, the filename will use the extracted Chinese translation of the paper title.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
