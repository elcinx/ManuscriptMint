export enum DocStatus {
  NEEDS_REVIEW = 'Needs Review',
  IN_REVIEW = 'In Review',
  REVIEWED = 'Reviewed',
}

export enum SuggestionType {
  GRAMMAR = 'Grammar',
  STYLE = 'Style',
  CLARITY = 'Clarity',
  APA = 'APA Compliance',
  CITATION = 'Citation',
}

export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  severity: Severity;
  originalText: string;
  suggestedText: string;
  explanation: string;
  isApplied?: boolean;
  isSkipped?: boolean;
}

export interface RiskReport {
  score: string; // e.g., "B+"
  label: string; // e.g., "Good start"
  warnings: string[];
}

export interface Document {
  id: string;
  title: string;
  content: string; // HTML or plain text string
  status: DocStatus;
  lastEdited: string;
  wordCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}