
export interface PaperMetadata {
  year: string;
  author: string;
  title: string;
  journal: string;
  translatedTitle: string;
}

export enum ProcessStatus {
  IDLE = 'IDLE',
  READING = 'READING',
  EXTRACTING = 'EXTRACTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ManagedFile {
  id: string;
  file: File;
  metadata?: PaperMetadata;
  status: ProcessStatus;
  errorMessage?: string;
  customFileName?: string; // Manual override for the generated name
}

export type RenamingPart = 'Year' | 'Journal' | 'Author' | 'Title';

export interface AppSettings {
  namingOrder: RenamingPart[];
  activeParts: Set<RenamingPart>;
  useTranslation: boolean;
  separator: string;
}
