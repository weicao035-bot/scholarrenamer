import React, { useState, useEffect } from 'react';
import { ProcessedFile, ProcessingStatus } from '../types';
import { FileText, CheckCircle, Loader2, AlertCircle, Edit2, Download, RefreshCw, X } from 'lucide-react';

interface FileCardProps {
  file: ProcessedFile;
  onRemove: (id: string) => void;
  onUpdateName: (id: string, newName: string) => void;
  onRetry: (id: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onRemove, onUpdateName, onRetry }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    if (file.suggestedName) {
      setEditedName(file.suggestedName.replace('.pdf', ''));
    }
  }, [file.suggestedName]);

  const handleDownload = () => {
    const fileNameToUse = file.suggestedName || file.originalName;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file.originalFile);
    link.download = fileNameToUse;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveEdit = () => {
    onUpdateName(file.id, `${editedName}.pdf`);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        {/* Icon / Status */}
        <div className="flex-shrink-0">
          {file.status === ProcessingStatus.COMPLETED ? (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle size={20} />
            </div>
          ) : file.status === ProcessingStatus.ERROR ? (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertCircle size={20} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400 truncate max-w-[300px]" title={file.originalName}>
              {file.originalName}
            </p>
            {file.status === ProcessingStatus.READING_PDF && <span className="text-xs text-blue-500 font-medium">Reading PDF...</span>}
            {file.status === ProcessingStatus.ANALYZING_AI && <span className="text-xs text-purple-500 font-medium">AI Analyzing...</span>}
          </div>

          {file.status === ProcessingStatus.COMPLETED ? (
             isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-grow text-sm border-b-2 border-blue-500 focus:outline-none py-1 text-gray-800 font-medium"
                  autoFocus
                />
                <span className="text-sm text-gray-500">.pdf</span>
                <button onClick={saveEdit} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                <h3 className="text-sm font-semibold text-gray-800 truncate" title={file.suggestedName}>
                  {file.suggestedName}
                </h3>
                <Edit2 size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )
          ) : file.status === ProcessingStatus.ERROR ? (
            <p className="text-sm text-red-500 font-medium">{file.errorMessage || "Processing failed"}</p>
          ) : (
            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse mt-1"></div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {file.status === ProcessingStatus.ERROR && (
             <button
             onClick={() => onRetry(file.id)}
             className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
             title="Retry"
           >
             <RefreshCw size={18} />
           </button>
          )}

          {file.status === ProcessingStatus.COMPLETED && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow active:scale-95"
            >
              <Download size={16} />
              Save
            </button>
          )}

          <button
            onClick={() => onRemove(file.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Remove"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {/* Metadata Preview Tag */}
      {file.metadata && (
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-gray-500 pl-14">
          <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
            Year: {file.metadata.year || "N/A"}
          </span>
          <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
            Author: {file.metadata.firstAuthor || "N/A"}
          </span>
          {file.metadata.journalName && (
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
              Journal: {file.metadata.journalName}
            </span>
          )}
          <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 truncate max-w-[200px]">
            Title: {file.metadata.chineseTitle || "N/A"}
          </span>
        </div>
      )}
    </div>
  );
};

export default FileCard;