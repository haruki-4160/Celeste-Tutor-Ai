export interface StepItem {
  stepNumber: number;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface ProblemSession {
  id: string;
  createdAt: number;
  question: string;
  studentWorking: string;
  questionAttachmentName?: string;
  workingAttachmentName?: string;
  tutorMessage: string;
  errorFound: boolean;
  errorCategory?: string;
  steps: StepItem[];
  hints: string[];
}
