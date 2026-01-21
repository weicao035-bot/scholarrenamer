export enum ProcessingStatus {
  IDLE = 'IDLE',
  READING_PDF = 'READING_PDF',
  ANALYZING_AI = 'ANALYZING_AI',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface ExtractedMetadata {
  year: string;
  firstAuthor: string;
  originalTitle: string;
  chineseTitle: string;
  journalName?: string;
}

export interface ProcessedFile {
  id: string;
  originalFile: File;
  originalName: string;
  status: ProcessingStatus;
  metadata?: ExtractedMetadata;
  suggestedName?: string;
  errorMessage?: string;
}

export type MetadataField = 'year' | 'author' | 'title' | 'journal';

export interface RenamingConfig {
  fields: MetadataField[];
  separator: string;
  titleLanguage: 'original' | 'chinese';
  enabledFields: Record<MetadataField, boolean>;
}