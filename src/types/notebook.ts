export interface ClarificationItem {
  originalTextOrSymbol: string;
  meaning: string;
}

export interface FormulaItem {
  formula: string;
  meaning: string;
}

export interface StudyNotes {
  keyTakeaways: string[];
  formulas: FormulaItem[];
  cheatSheetSummary: string;
}

export interface NotebookNote {
  id: string;
  title: string;
  topic: string;
  createdAt: number;
  sourceName: string;
  sourceType: 'image' | 'pdf';
  sourceDataUrl?: string; // Optional cached image preview
  transcription: string;
  clarifications: ClarificationItem[];
  explanation: string;
  studyNotes: StudyNotes;
  suggestedQuestions: string[];
}
