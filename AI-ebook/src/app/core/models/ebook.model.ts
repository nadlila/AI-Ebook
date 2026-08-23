export type EbookStatus =
  | 'DRAFT'
  | 'RESEARCHING'
  | 'RESEARCH_READY'
  | 'SOURCE_REVIEW'
  | 'OUTLINING'
  | 'OUTLINE_REVIEW'
  | 'GENERATING'
  | 'EDITING'
  | 'QUALITY_CHECK'
  | 'READY_TO_READ'
  | 'PARTIAL_FAILURE'
  | 'FAILED';

export type EbookStep =
  | 'LOGIN'
  | 'DASHBOARD'
  | 'CREATE_EBOOK'
  | 'BASIC_INFO'
  | 'BASIC_INFORMATION'
  | 'LEARNING_PREFERENCES'
  | 'RESEARCH'
  | 'SOURCE_REVIEW'
  | 'LEARNING_PLAN'
  | 'OUTLINE'
  | 'OUTLINE_APPROVAL'
  | 'GENERATION'
  | 'EDITOR'
  | 'QUALITY_CHECK'
  | 'SAVE'
  | 'MY_LIBRARY'
  | 'DETAIL'
  | 'READER';

export type EbookTargetLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type EbookContentLength = 'Short' | 'Medium' | 'Long';

export interface LearningPlan {
  goal: string;
  outcomes: string[];
  estimatedReadingTime: string;
}

export interface OutlineChapter {
  id: string;
  title: string;
  lessons: number;
  approved?: boolean;
}

export interface EbookOutline {
  title: string;
  chapters: OutlineChapter[];
}

export interface EbookSummary {
  id: string;
  title: string;
  status: EbookStatus;
  currentStep: EbookStep;
  creationProgress: number;
  readingProgress: number;
  readingTime?: string;
  lastReadChapterIndex?: number;
  coverImage: string;
  updatedAt: string;
  chapterCount: number;
}

export type ContentBlockType = 'heading' | 'paragraph' | 'list' | 'callout' | 'citation';

export interface EditorBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  items?: string[];
  sourceId?: string;
  citationLabel?: string;
}

export interface EditorChapterContent {
  chapterId: string;
  title: string;
  blocks: EditorBlock[];
}

export type GenerationChapterStatus = 'completed' | 'generating' | 'pending' | 'failed';

export interface GenerationChapterState {
  chapterId: string;
  title: string;
  status: GenerationChapterStatus;
}

export interface GenerationProgress {
  totalChapters: number;
  completedChapters: number;
  currentChapter: string;
  progress: number;
  failedChapters: number;
  chapters: GenerationChapterState[];
}

export interface QualityMetric {
  score: number;
  status: 'Passed' | 'Warning' | 'Failed';
}

export interface QualityIssue {
  id: string;
  title: string;
  description: string;
  severity: 'Passed' | 'Warning' | 'Failed';
}

export interface QualityCheckResult {
  overallScore: number;
  structure: QualityMetric;
  readability: QualityMetric;
  citation: QualityMetric;
  unsupportedClaims: QualityMetric;
  duplication: QualityMetric;
  completeness: QualityMetric;
  status: 'Passed' | 'Warning' | 'Failed';
  issues: QualityIssue[];
}

export interface Ebook extends EbookSummary {
  description?: string;
  learningGoal?: string;
  targetLevel?: EbookTargetLevel;
  language?: string;
  writingStyle?: string;
  contentLength?: EbookContentLength;
  readingTime?: string;
  learningPlan?: LearningPlan;
  outline?: EbookOutline;
  generation?: GenerationProgress;
  editorContent?: EditorChapterContent[];
  qualityCheck?: QualityCheckResult;
  createdAt: string;
}

export interface DashboardSnapshot {
  userName: string;
  continueReading: EbookSummary | null;
  recentEbooks: EbookSummary[];
}
