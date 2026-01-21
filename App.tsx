
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { 
  ManagedFile, 
  ProcessStatus, 
  AppSettings, 
  RenamingPart,
  PaperMetadata
} from './types';
import { extractPdfText } from './services/pdfService';
import { extractMetadata } from './services/geminiService';
import RenamingPreferences from './components/RenamingPreferences';
import FileList from './components/FileList';

const App: React.FC = () => {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const processingRef = useRef<boolean>(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    namingOrder: ['Year', 'Author', 'Title', 'Journal'],
    activeParts: new Set(['Year', 'Author', 'Title']),
    useTranslation: false,
    separator: '-'
  });

  // Helper to get the final filename for a file based on settings or custom override
  const getFinalName = (file: ManagedFile) => {
    if (file.customFileName) return file.customFileName;
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

  // Automatically trigger processing when new idle files are added
  useEffect(() => {
    const processIdleFiles = async () => {
      if (processingRef.current) return;
      
      const idleFiles = files.filter(f => f.status === ProcessStatus.IDLE);
      if (idleFiles.length === 0) return;

      processingRef.current = true;

      for (const file of idleFiles) {
        try {
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: ProcessStatus.READING } : f));
          const text = await extractPdfText(file.file);
          
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: ProcessStatus.EXTRACTING } : f));
          const metadata = await extractMetadata(text);

          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: ProcessStatus.COMPLETED, metadata } : f));
        } catch (err: any) {
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: ProcessStatus.ERROR, errorMessage: err.message } : f));
        }
      }

      processingRef.current = false;
    };

    processIdleFiles();
  }, [files]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let rawFiles: File[] = [];
    if ('files' in e.target && (e.target as HTMLInputElement).files) {
      rawFiles = Array.from((e.target as HTMLInputElement).files!);
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      rawFiles = Array.from(e.dataTransfer.files);
    }
    
    const validFiles = rawFiles.filter(f => f.type === 'application/pdf');
    if (validFiles.length === 0) return;

    const newFiles: ManagedFile[] = validFiles.map(file => ({
      id: uuidv4(),
      file,
      status: ProcessStatus.IDLE
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const downloadFile = (file: ManagedFile) => {
    const fileName = getFinalName(file);
    const url = URL.createObjectURL(file.file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    const ready = files.filter(f => f.status === ProcessStatus.COMPLETED && (f.metadata || f.customFileName));
    if (ready.length === 0) return;

    const zip = new JSZip();
    ready.forEach(f => {
      const fileName = getFinalName(f);
      zip.file(fileName, f.file);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ScholarRenamer_Output.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateFileName = (id: string, newName: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, customFileName: newName } : f));
  };

  const isAnyProcessing = files.some(f => f.status === ProcessStatus.READING || f.status === ProcessStatus.EXTRACTING);

  return (
    <div 
      className="min-h-screen bg-[#F8FAFC] pb-24"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); }}
    >
      {/* Header Section */}
      <div className="pt-12 pb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-5">
          <i className="fas fa-file-alt text-2xl text-white"></i>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">
          <span className="text-gray-900">Scholar</span>
          <span className="text-blue-600">Renamer</span>
        </h1>
        <p className="text-gray-500 text-base">Extract metadata from academic PDFs and batch rename them.</p>
      </div>

      <main className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Settings Card */}
        <RenamingPreferences settings={settings} setSettings={setSettings} />

        {/* Upload Area */}
        <div 
          onClick={() => document.getElementById('file-input')?.click()}
          className={`relative group cursor-pointer bg-white border-2 border-dashed rounded-[32px] p-12 transition-all duration-300 ${
            isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-200 hover:border-blue-400'
          }`}
        >
          <input id="file-input" type="file" multiple accept=".pdf" className="hidden" onChange={handleFileUpload} />
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <i className="fas fa-cloud-upload-alt text-2xl text-blue-500"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Click to upload or drag and drop</h3>
            <p className="text-gray-400 text-sm">Supports PDF files • Automatic AI Analysis</p>
          </div>
        </div>

        {/* Process Bar */}
        {files.length > 0 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600">
                <span className="text-blue-600 font-bold">{files.length}</span> Files
              </span>
              {isAnyProcessing && (
                <div className="flex items-center gap-2 text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1 rounded-full animate-pulse">
                  <i className="fas fa-spinner fa-spin"></i>
                  AI ANALYZING...
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setFiles([])}
                className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear All
              </button>
              {files.some(f => f.status === ProcessStatus.COMPLETED) && (
                <button 
                  onClick={downloadAll}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
                >
                  <i className="fas fa-download"></i>
                  Download ZIP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results List */}
        <FileList 
          files={files} 
          settings={settings} 
          onRemove={(id) => setFiles(f => f.filter(x => x.id !== id))} 
          onDownload={downloadFile}
          onUpdateFileName={handleUpdateFileName}
        />
      </main>

      <footer className="mt-20 text-center text-gray-300 text-xs tracking-wider uppercase font-semibold">
        Scholar Renamer &bull; Powered by Gemini AI &bull; No Local API Key Required
      </footer>
    </div>
  );
};

export default App;
