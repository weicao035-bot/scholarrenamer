import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, FileText, Trash2, Settings2, ArrowLeft, ArrowRight, Download, Package } from 'lucide-react';
import { ProcessedFile, ProcessingStatus, RenamingConfig, MetadataField, ExtractedMetadata } from './types';
import FileCard from './components/FileCard';
import { extractTextFromPdf } from './utils/pdfUtils';
import { extractMetadataFromText } from './services/geminiService';
import JSZip from 'jszip';

const DEFAULT_CONFIG: RenamingConfig = {
  fields: ['year', 'journal', 'author', 'title'],
  separator: '-',
  titleLanguage: 'chinese',
  enabledFields: {
    year: true,
    author: true,
    title: true,
    journal: false,
  }
};

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [config, setConfig] = useState<RenamingConfig>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(true);

  // --- Naming Logic ---

  const generateFileName = useCallback((metadata: ExtractedMetadata, currentConfig: RenamingConfig) => {
    const parts: string[] = [];
    
    currentConfig.fields.forEach(field => {
      if (!currentConfig.enabledFields[field]) return;

      if (field === 'year') {
        const safeYear = (metadata.year || new Date().getFullYear().toString()).trim();
        parts.push(safeYear);
      } else if (field === 'author') {
        const safeAuthor = (metadata.firstAuthor || "Unknown").replace(/[^\w\u4e00-\u9fa5-]/g, '');
        parts.push(safeAuthor);
      } else if (field === 'journal') {
        if (metadata.journalName) {
           const safeJournal = metadata.journalName.replace(/[^\w\u4e00-\u9fa5-]/g, '');
           parts.push(safeJournal);
        }
      } else if (field === 'title') {
        const rawTitle = currentConfig.titleLanguage === 'chinese' ? metadata.chineseTitle : metadata.originalTitle;
        const titleToUse = rawTitle || metadata.originalTitle || "Untitled";
        const safeTitle = titleToUse.replace(/[\\/:*?"<>|]/g, '_').substring(0, 80).trim(); 
        parts.push(safeTitle);
      }
    });

    if (parts.length === 0) return "Untitled.pdf";

    // Handle separator spacing if users choose specialized separators
    let separator = currentConfig.separator;
    if (separator !== '-' && separator !== '_') separator = ` ${separator} `; // Add spacing for words like 'by' if we ever add them, currently just simple chars
    
    // Simple join
    return `${parts.join(currentConfig.separator)}.pdf`;
  }, []);

  // --- Effects ---

  // Re-generate names whenever config changes
  useEffect(() => {
    setFiles(prevFiles => prevFiles.map(file => {
      if (file.status === ProcessingStatus.COMPLETED && file.metadata) {
        return {
          ...file,
          suggestedName: generateFileName(file.metadata, config)
        };
      }
      return file;
    }));
  }, [config, generateFileName]);

  const processFile = async (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: ProcessingStatus.READING_PDF, errorMessage: undefined } : f
    ));

    const currentFile = files.find(f => f.id === fileId);
    if (!currentFile) return;

    try {
      // 1. Read PDF
      const text = await extractTextFromPdf(currentFile.originalFile);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: ProcessingStatus.ANALYZING_AI } : f
      ));

      // 2. AI Extraction
      const metadata = await extractMetadataFromText(text);

      // 3. Generate Name using current config (via the effect mostly, but we set it here initially)
      const newName = generateFileName(metadata, config);

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: ProcessingStatus.COMPLETED, 
          metadata, 
          suggestedName: newName 
        } : f
      ));

    } catch (err) {
      console.error(err);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: ProcessingStatus.ERROR, 
          errorMessage: err instanceof Error ? err.message : "Unknown error" 
        } : f
      ));
    }
  };

  const handleFilesAdded = async (newFiles: File[]) => {
    const processedFiles: ProcessedFile[] = newFiles
      .filter(f => f.type === 'application/pdf')
      .map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        originalFile: f,
        originalName: f.name,
        status: ProcessingStatus.IDLE
      }));

    if (processedFiles.length === 0) {
      alert("Please upload valid PDF files.");
      return;
    }

    setFiles(prev => [...prev, ...processedFiles]);
  };

  // Trigger processing for IDLE files
  useEffect(() => {
    files.forEach(file => {
      if (file.status === ProcessingStatus.IDLE) {
        processFile(file.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length]); 

  // --- Batch Actions ---

  const handleDownloadAll = async () => {
    const completedFiles = files.filter(f => f.status === ProcessingStatus.COMPLETED);
    if (completedFiles.length === 0) return;

    const zip = new JSZip();
    
    // Create a folder or just root files? Root is better for quick access.
    completedFiles.forEach(file => {
      const fileName = file.suggestedName || file.originalName;
      zip.file(fileName, file.originalFile);
    });

    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `renamed_papers_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to zip files", e);
      alert("Failed to create ZIP archive.");
    }
  };

  // --- Config Handlers ---

  const moveField = (index: number, direction: 'left' | 'right') => {
    const newFields = [...config.fields];
    if (direction === 'left' && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    } else if (direction === 'right' && index < newFields.length - 1) {
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
    }
    setConfig({ ...config, fields: newFields });
  };

  const toggleField = (field: MetadataField) => {
    setConfig({ 
      ...config, 
      enabledFields: { ...config.enabledFields, [field]: !config.enabledFields[field] } 
    });
  };

  // --- Drag Handlers ---

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileName = (id: string, newName: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, suggestedName: newName } : f));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const getFieldLabel = (field: MetadataField) => {
    switch (field) {
      case 'year': return 'Year';
      case 'author': return 'Author';
      case 'title': return 'Title';
      case 'journal': return 'Journal';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f3f4f6]">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
             <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
               <FileText className="text-white w-8 h-8" />
             </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Scholar<span className="text-blue-600">Renamer</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Extract metadata from academic PDFs and batch rename them.
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 transition-all">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
            <div className="flex items-center gap-2 text-gray-800 font-semibold">
              <Settings2 size={20} className="text-blue-500" />
              <span>Renaming Preferences</span>
            </div>
            <button className="text-sm text-blue-500 hover:text-blue-700 font-medium">
              {showSettings ? 'Hide' : 'Customize'}
            </button>
          </div>

          {showSettings && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              
              {/* Pattern Builder */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-3">Naming Pattern Order & Visibility</label>
                <div className="flex flex-wrap items-center gap-3">
                  {config.fields.map((field, index) => (
                    <div key={field} className={`
                      flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg border transition-all select-none
                      ${config.enabledFields[field] 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'bg-gray-50 border-gray-200 opacity-60 grayscale'}
                    `}>
                      <div className="flex items-center gap-2">
                         <input 
                           type="checkbox" 
                           checked={config.enabledFields[field]}
                           onChange={() => toggleField(field)}
                           className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                         />
                         <span className="text-sm font-bold text-gray-700">{getFieldLabel(field)}</span>
                      </div>

                      {/* Title Specific Options */}
                      {field === 'title' && config.enabledFields['title'] && (
                        <select 
                          value={config.titleLanguage}
                          onChange={(e) => setConfig({...config, titleLanguage: e.target.value as any})}
                          className="ml-2 text-xs border-none bg-white py-1 pl-2 pr-6 rounded text-gray-600 focus:ring-1 focus:ring-blue-300 cursor-pointer"
                        >
                          <option value="chinese">Chinese</option>
                          <option value="original">Original</option>
                        </select>
                      )}

                      {/* Reordering Controls */}
                      <div className="flex flex-col ml-2 border-l border-gray-300/50 pl-1 gap-0.5">
                        <button 
                          onClick={() => moveField(index, 'left')} 
                          disabled={index === 0}
                          className="p-0.5 hover:bg-blue-200 rounded text-gray-400 hover:text-blue-700 disabled:opacity-30"
                        >
                          <ArrowLeft size={10} />
                        </button>
                        <button 
                           onClick={() => moveField(index, 'right')} 
                           disabled={index === config.fields.length - 1}
                           className="p-0.5 hover:bg-blue-200 rounded text-gray-400 hover:text-blue-700 disabled:opacity-30"
                        >
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Separator Config */}
              <div className="flex items-center gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-500 mb-1">Separator</label>
                   <div className="flex bg-gray-100 p-1 rounded-lg">
                      {['-', '_', ' '].map(sep => (
                        <button
                          key={sep}
                          onClick={() => setConfig({...config, separator: sep})}
                          className={`
                            w-8 h-8 flex items-center justify-center rounded-md text-sm font-mono transition-all
                            ${config.separator === sep ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}
                          `}
                        >
                          {sep === ' ' ? '␣' : sep}
                        </button>
                      ))}
                   </div>
                 </div>
                 
                 <div className="flex-grow pl-4 border-l border-gray-200">
                   <label className="block text-sm font-medium text-gray-500 mb-1">Preview</label>
                   <div className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-1.5 rounded border border-gray-200 truncate">
                      {generateFileName({
                        year: '2024',
                        firstAuthor: 'Smith',
                        originalTitle: 'Deep Learning for Science',
                        chineseTitle: '深度学习在科学中的应用',
                        journalName: 'Nature'
                      }, config)}
                   </div>
                 </div>
              </div>

            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            relative group border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ease-in-out cursor-pointer
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 scale-[1.01] shadow-xl' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 bg-white shadow-sm'
            }
          `}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input
            id="fileInput"
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center justify-center gap-4">
            <div className={`p-4 rounded-full bg-blue-50 text-blue-500 transition-transform duration-300 ${isDragging ? 'scale-110 bg-blue-100' : ''}`}>
              <UploadCloud size={32} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Supports PDF files
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-4">
          {files.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Files ({files.length})
              </h2>
              
              <div className="flex items-center gap-3">
                {files.some(f => f.status === ProcessingStatus.COMPLETED) && (
                   <button 
                   onClick={handleDownloadAll}
                   className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center gap-1 px-3 py-1.5 rounded transition-colors font-medium"
                 >
                   <Package size={16} /> Download ZIP
                 </button>
                )}
                
                <button 
                  onClick={clearAll}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} /> Clear All
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {files.map(file => (
              <FileCard
                key={file.id}
                file={file}
                onRemove={removeFile}
                onUpdateName={updateFileName}
                onRetry={(id) => processFile(id)}
              />
            ))}
          </div>

          {files.length === 0 && (
             <div className="text-center py-8 opacity-30 select-none">
               <div className="inline-block p-4 rounded-full bg-gray-100 mb-3">
                 <FileText size={32} className="text-gray-400" />
               </div>
               <p className="text-gray-400 font-medium">No files in queue</p>
             </div>
          )}
        </div>

      </div>
      
      <div className="fixed bottom-4 right-4 text-xs text-gray-400 flex flex-col items-end gap-1">
        <span>Powered by Gemini 2.5 Flash</span>
      </div>
    </div>
  );
};

export default App;