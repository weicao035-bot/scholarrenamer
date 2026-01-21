
import React from 'react';
import { AppSettings, RenamingPart } from '../types';

interface RenamingPreferencesProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const RenamingPreferences: React.FC<RenamingPreferencesProps> = ({ settings, setSettings }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const togglePart = (part: RenamingPart) => {
    const newActive = new Set(settings.activeParts);
    if (newActive.has(part)) {
      if (newActive.size > 1) newActive.delete(part);
    } else {
      newActive.add(part);
    }
    setSettings({ ...settings, activeParts: newActive });
  };

  const movePart = (index: number, direction: 'left' | 'right') => {
    const newOrder = [...settings.namingOrder];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setSettings({ ...settings, activeParts: new Set(settings.activeParts), namingOrder: newOrder });
  };

  const getPreview = () => {
    const example = { year: '2024', author: 'Smith', journal: 'Nature', title: 'Deep Learning in Science', translatedTitle: '深度学习在科学中的应用' };
    const parts = settings.namingOrder
      .filter(p => settings.activeParts.has(p))
      .map(p => {
        if (p === 'Year') return example.year;
        if (p === 'Author') return example.author;
        if (p === 'Journal') return example.journal;
        if (p === 'Title') return settings.useTranslation ? example.translatedTitle : example.title;
        return '';
      });
    return parts.filter(Boolean).join(settings.separator) + '.pdf';
  };

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="text-blue-600"><i className="fas fa-sliders-h text-lg"></i></div>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Renaming Preferences</h2>
        </div>
        <button onClick={() => setIsVisible(!isVisible)} className="text-blue-500 text-sm font-semibold hover:opacity-70 transition-opacity">
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>

      {isVisible && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Naming Pattern Order & Visibility</h3>
            <div className="flex flex-wrap gap-3">
              {settings.namingOrder.map((part, idx) => {
                const isActive = settings.activeParts.has(part);
                return (
                  <div 
                    key={part}
                    className={`flex items-center gap-3 p-1 pl-3 pr-2 rounded-xl border transition-all duration-300 ${
                      isActive ? 'bg-blue-50 border-blue-100 shadow-sm shadow-blue-50' : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isActive} 
                      onChange={() => togglePart(part)}
                      className="w-4 h-4 rounded border-blue-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className={`font-bold text-sm ${isActive ? 'text-blue-900' : 'text-gray-400'}`}>{part}</span>
                    
                    {part === 'Title' && isActive && (
                      <select 
                        className="ml-1 bg-white border border-blue-100 rounded-lg py-1 px-2 text-[11px] font-bold text-blue-600 outline-none cursor-pointer"
                        value={settings.useTranslation ? 'Chinese' : 'English'}
                        onChange={(e) => setSettings({...settings, useTranslation: e.target.value === 'Chinese'})}
                      >
                        <option value="English">English</option>
                        <option value="Chinese">Chinese</option>
                      </select>
                    )}

                    <div className="flex items-center ml-1 border-l border-blue-100/50 pl-2">
                      <button onClick={() => movePart(idx, 'left')} disabled={idx === 0} className="p-1 text-xs text-gray-300 hover:text-blue-600 disabled:invisible"><i className="fas fa-chevron-left"></i></button>
                      <button onClick={() => movePart(idx, 'right')} disabled={idx === settings.namingOrder.length - 1} className="p-1 text-xs text-gray-300 hover:text-blue-600 disabled:invisible"><i className="fas fa-chevron-right"></i></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-1">
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Separator</h3>
               <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                 {['-', '_', ' '].map(sep => (
                   <button
                    key={sep}
                    onClick={() => setSettings({...settings, separator: sep})}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-bold transition-all ${
                      settings.separator === sep ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                   >
                     {sep === ' ' ? '␣' : sep}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="md:col-span-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Preview</h3>
              <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3 flex items-center h-[42px]">
                <code className="text-gray-600 font-semibold text-sm truncate px-2">{getPreview()}</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenamingPreferences;
