
import React, { useState } from 'react';
import { ManagedFile, ProcessStatus, AppSettings } from '../types';

interface FileListProps {
  files: ManagedFile[];
  settings: AppSettings;
  onRemove: (id: string) => void;
  onDownload: (file: ManagedFile) => void;
  onUpdateFileName: (id: string, newName: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, settings, onRemove, onDownload, onUpdateFileName }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const getGeneratedName = (file: ManagedFile) => {
    if (!file.metadata) return file.file.name;
    const { metadata } = file;
    const parts = settings.namingOrder
      .filter(p => settings.activeParts.has(p))
      .map(p => {
        if (p === 'Year') return metadata.year;
        if (p === 'Author') return metadata.author;
        if (p === 'Journal') return metadata.journal;
        if (p === 'Title') return settings.useTranslation ? metadata.translatedTitle : metadata.title;
        return '';
      });
    const generated = parts.filter(Boolean).join(settings.separator).replace(/[\\/:*?"<>|]/g, '_');
    return generated ? `${generated}.pdf` : file.file.name;
  };

  const getDisplayName = (file: ManagedFile) => {
    return file.customFileName || getGeneratedName(file);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2">Processing Results</h3>
      <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/4">Source PDF</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-1/2">Target Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-28">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {files.map((f) => (
              <tr key={f.id} className="group hover:bg-gray-50/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 text-xs">
                      <i className="fas fa-file-pdf"></i>
                    </div>
                    <span className="text-[13px] font-medium text-gray-400 truncate">{f.file.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingId === f.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        autoFocus
                        type="text"
                        defaultValue={getDisplayName(f)}
                        onBlur={(e) => {
                          onUpdateFileName(f.id, e.target.value);
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateFileName(f.id, e.currentTarget.value);
                            setEditingId(null);
                          }
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full text-[13px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/name">
                      <div 
                        className={`text-[13px] font-bold truncate cursor-pointer hover:text-blue-600 transition-colors ${f.customFileName ? 'text-blue-600' : 'text-gray-800'}`} 
                        title={getDisplayName(f)}
                        onClick={() => f.status === ProcessStatus.COMPLETED && setEditingId(f.id)}
                      >
                        {getDisplayName(f)}
                      </div>
                      {f.status === ProcessStatus.COMPLETED && (
                        <button 
                          onClick={() => setEditingId(f.id)}
                          className="text-[10px] text-gray-300 opacity-0 group-hover/name:opacity-100 hover:text-blue-500 transition-all"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                      )}
                    </div>
                  )}
                  {f.metadata && (
                    <div className="text-[9px] text-gray-400 mt-1 flex gap-2">
                      <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">{f.metadata.journal}</span>
                      <span className="italic font-medium">By {f.metadata.author}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {f.status === ProcessStatus.COMPLETED ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">
                      <i className="fas fa-check-circle"></i> READY
                    </span>
                  ) : f.status === ProcessStatus.ERROR ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold" title={f.errorMessage}>
                      <i className="fas fa-exclamation-circle"></i> ERROR
                    </span>
                  ) : f.status === ProcessStatus.IDLE ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold">
                      QUEUED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold animate-pulse">
                      <i className="fas fa-spinner fa-spin"></i> {f.status === ProcessStatus.READING ? 'READING' : 'ANALYZING'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {f.status === ProcessStatus.COMPLETED && (
                      <button 
                        onClick={() => onDownload(f)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Download individual file"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    )}
                    <button 
                      onClick={() => onRemove(f.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Remove from list"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileList;
