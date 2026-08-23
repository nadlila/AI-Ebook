import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  DashboardSnapshot,
  Ebook,
  EbookOutline,
  EbookStatus,
  EbookStep,
  EbookSummary,
  EditorChapterContent,
  GenerationProgress,
  LearningPlan,
  QualityCheckResult
} from '../models/ebook.model';

@Injectable({ providedIn: 'root' })
export class EbookService {
  private readonly storageKey = 'ai-ebook-store-v1';
  private readonly defaultCover =
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';

  private readStore(): Ebook[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      const seeded: Ebook[] = this.getSeedEbooks();
      localStorage.setItem(this.storageKey, JSON.stringify(seeded));
      return seeded;
    }

    try {
      const parsed = JSON.parse(raw) as Ebook[];
      return parsed.length ? parsed : this.getSeedEbooks();
    } catch {
      return this.getSeedEbooks();
    }
  }

  private writeStore(ebooks: Ebook[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(ebooks));
  }

  private getSeedEbooks(): Ebook[] {
    return [
      {
        id: 'ebook-1',
        title: 'AI for Product Designers',
        description: 'Learn how AI workflows improve design decision making.',
        learningGoal: 'Understand AI-assisted product design.',
        targetLevel: 'Beginner',
        language: 'English',
        writingStyle: 'Friendly',
        contentLength: 'Medium',
        status: 'RESEARCH_READY',
        currentStep: 'SOURCE_REVIEW',
        creationProgress: 80,
        readingProgress: 60,
        readingTime: '18 min',
        lastReadChapterIndex: 2,
        coverImage:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
        createdAt: '2026-08-18T08:00:00.000Z',
        updatedAt: '2026-08-18T08:00:00.000Z',
        chapterCount: 6
      },
      {
        id: 'ebook-2',
        title: 'Designing AI Products Beyond the Screen',
        description: 'Explore how AI products fit human-centered design systems.',
        learningGoal: 'Design experiences that combine UX and AI.',
        targetLevel: 'Intermediate',
        language: 'English',
        writingStyle: 'Professional',
        contentLength: 'Medium',
        status: 'READY_TO_READ',
        currentStep: 'MY_LIBRARY',
        creationProgress: 100,
        readingProgress: 65,
        readingTime: '12 min',
        lastReadChapterIndex: 1,
        coverImage:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
        createdAt: '2026-08-17T10:00:00.000Z',
        updatedAt: '2026-08-17T10:00:00.000Z',
        chapterCount: 5
      },
      {
        id: 'ebook-3',
        title: 'Behavioral Design in Practice',
        description: 'Apply behavioral patterns in digital product contexts.',
        learningGoal: 'Practice behavior-driven design decisions.',
        targetLevel: 'Advanced',
        language: 'English',
        writingStyle: 'Professional',
        contentLength: 'Long',
        status: 'EDITING',
        currentStep: 'EDITOR',
        creationProgress: 72,
        readingProgress: 0,
        readingTime: '20 min',
        lastReadChapterIndex: 0,
        coverImage:
          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
        createdAt: '2026-08-16T14:00:00.000Z',
        updatedAt: '2026-08-16T14:00:00.000Z',
        chapterCount: 6
      },
      {
        id: 'ebook-4',
        title: 'Research Ops Playbook',
        description: 'Introduce research systems for product teams.',
        learningGoal: 'Build reliable research processes.',
        targetLevel: 'Intermediate',
        language: 'English',
        writingStyle: 'Friendly',
        contentLength: 'Short',
        status: 'OUTLINE_REVIEW',
        currentStep: 'OUTLINE_APPROVAL',
        creationProgress: 55,
        readingProgress: 0,
        readingTime: '14 min',
        lastReadChapterIndex: 0,
        coverImage:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
        createdAt: '2026-08-15T08:30:00.000Z',
        updatedAt: '2026-08-15T08:30:00.000Z',
        chapterCount: 5
      }
    ];
  }

  private toSummary(ebook: Ebook): EbookSummary {
    return {
      id: ebook.id,
      title: ebook.title,
      status: ebook.status,
      currentStep: ebook.currentStep,
      creationProgress: ebook.creationProgress,
      readingProgress: ebook.readingProgress,
      readingTime: ebook.readingTime ?? '15 min',
      lastReadChapterIndex: ebook.lastReadChapterIndex ?? 0,
      coverImage: ebook.coverImage || this.defaultCover,
      updatedAt: ebook.updatedAt,
      chapterCount: ebook.chapterCount
    };
  }

  private getDraftBooks(): Ebook[] {
    return this.readStore().filter((ebook) =>
      ['DRAFT', 'RESEARCHING', 'RESEARCH_READY', 'SOURCE_REVIEW'].includes(ebook.status)
    );
  }

  createEbookDraft(data: Partial<Ebook>): Observable<Ebook> {
    const books = this.readStore();
    const now = new Date().toISOString();
    const ebook: Ebook = {
      id: data.id ?? `ebook-${Date.now()}`,
      title: data.title ?? 'Untitled Ebook',
      description: data.description ?? '',
      learningGoal: data.learningGoal ?? '',
      targetLevel: data.targetLevel ?? 'Beginner',
      language: data.language ?? 'English',
      writingStyle: data.writingStyle ?? 'Friendly',
      contentLength: data.contentLength ?? 'Medium',
      status: (data.status as EbookStatus) ?? 'DRAFT',
      currentStep: (data.currentStep as EbookStep) ?? 'BASIC_INFORMATION',
      creationProgress: data.creationProgress ?? 10,
      readingProgress: data.readingProgress ?? 0,
      coverImage: data.coverImage ?? this.defaultCover,
      updatedAt: now,
      createdAt: now,
      chapterCount: data.chapterCount ?? 0,
      readingTime: data.readingTime ?? '15 min',
      lastReadChapterIndex: data.lastReadChapterIndex ?? 0
    };

    books.unshift(ebook);
    this.writeStore(books);

    return of(ebook).pipe(delay(200));
  }

  updateEbook(id: string, updates: Partial<Ebook>): Observable<Ebook> {
    const books = this.readStore();
    const index = books.findIndex((ebook) => ebook.id === id);

    if (index === -1) {
      const missingEbook: Ebook = {
        id,
        title: 'Missing Ebook',
        status: 'DRAFT',
        currentStep: 'BASIC_INFORMATION',
        creationProgress: 0,
        readingProgress: 0,
        coverImage: this.defaultCover,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chapterCount: 0
      };

      return of(missingEbook).pipe(delay(150));
    }

    const updated = {
      ...books[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    books[index] = updated;
    this.writeStore(books);

    return of(updated).pipe(delay(200));
  }

  getEbookById(id: string): Observable<Ebook | undefined> {
    const books = this.readStore();
    return of(books.find((ebook) => ebook.id === id)).pipe(delay(150));
  }

  getCurrentDraft(): Observable<Ebook | null> {
    const books = this.getDraftBooks();
    return of(books[0] ?? null).pipe(delay(150));
  }

  getDashboardSnapshot(): Observable<DashboardSnapshot> {
    const ebooks = this.readStore();
    const snapshot: DashboardSnapshot = {
      userName: 'Nadila',
      continueReading: ebooks.find((ebook) => ['DRAFT', 'RESEARCHING', 'SOURCE_REVIEW'].includes(ebook.status))
        ? this.toSummary(
            ebooks.find((ebook) => ['DRAFT', 'RESEARCHING', 'SOURCE_REVIEW'].includes(ebook.status)) || ebooks[0]
          )
        : null,
      recentEbooks: ebooks.slice(0, 4).map((ebook) => this.toSummary(ebook))
    };

    return of(snapshot).pipe(delay(300));
  }

  getLibrary(): Observable<EbookSummary[]> {
    return of(this.readStore().map((ebook) => this.toSummary(ebook))).pipe(delay(250));
  }

  getResumeRoute(ebook: Pick<Ebook, 'currentStep' | 'id'>): string {
    switch (ebook.currentStep) {
      case 'LEARNING_PREFERENCES':
        return '/ebooks/create/preferences';
      case 'RESEARCH':
        return `/ebooks/${ebook.id}/research`;
      case 'SOURCE_REVIEW':
        return `/ebooks/${ebook.id}/sources`;
      case 'LEARNING_PLAN':
        return `/ebooks/${ebook.id}/learning-plan`;
      case 'OUTLINE':
      case 'OUTLINE_APPROVAL':
        return `/ebooks/${ebook.id}/outline`;
      case 'GENERATION':
        return `/ebooks/${ebook.id}/generation`;
      case 'EDITOR':
        return `/ebooks/${ebook.id}/editor`;
      case 'QUALITY_CHECK':
        return `/ebooks/${ebook.id}/quality-check`;
      default:
        return '/ebooks/create';
    }
  }

  createLearningPlan(id: string, plan: LearningPlan): Observable<Ebook> {
    return this.updateEbook(id, {
      learningPlan: plan,
      status: 'SOURCE_REVIEW',
      currentStep: 'LEARNING_PLAN',
      creationProgress: 60
    });
  }

  createOutline(id: string, outline: EbookOutline): Observable<Ebook> {
    return this.updateEbook(id, {
      outline,
      status: 'OUTLINING',
      currentStep: 'OUTLINE',
      creationProgress: 75
    });
  }

  approveOutline(id: string): Observable<Ebook> {
    return this.updateEbook(id, {
      status: 'OUTLINE_REVIEW',
      currentStep: 'OUTLINE_APPROVAL',
      creationProgress: 90
    });
  }

  updateOutlineChapter(id: string, chapterId: string, title: string): Observable<Ebook> {
    const books = this.readStore();
    const index = books.findIndex((ebook) => ebook.id === id);
    if (index === -1) {
      return of(this.getMissingEbook(id)).pipe(delay(150));
    }

    const outline = books[index].outline ?? { title: 'Ebook Outline', chapters: [] };
    const nextChapters = outline.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, title } : chapter
    );

    const updated = { ...books[index], outline: { ...outline, chapters: nextChapters } };
    books[index] = updated;
    this.writeStore(books);
    return of(updated).pipe(delay(200));
  }

  addOutlineChapter(id: string): Observable<Ebook> {
    const books = this.readStore();
    const index = books.findIndex((ebook) => ebook.id === id);
    if (index === -1) {
      return of(this.getMissingEbook(id)).pipe(delay(150));
    }

    const outline = books[index].outline ?? { title: 'Ebook Outline', chapters: [] };
    const newChapter = {
      id: `chapter-${Date.now()}`,
      title: `New Chapter ${outline.chapters.length + 1}`,
      lessons: 3
    };

    const updated: Ebook = {
      ...books[index],
      outline: { ...outline, chapters: [...outline.chapters, newChapter] },
      chapterCount: outline.chapters.length + 1
    };
    books[index] = updated;
    this.writeStore(books);
    return of(updated).pipe(delay(200));
  }

  deleteOutlineChapter(id: string, chapterId: string): Observable<Ebook> {
    const books = this.readStore();
    const index = books.findIndex((ebook) => ebook.id === id);
    if (index === -1) {
      return of(this.getMissingEbook(id)).pipe(delay(150));
    }

    const outline = books[index].outline ?? { title: 'Ebook Outline', chapters: [] };
    const nextChapters = outline.chapters.filter((chapter) => chapter.id !== chapterId);
    const updated: Ebook = {
      ...books[index],
      outline: { ...outline, chapters: nextChapters },
      chapterCount: nextChapters.length
    };
    books[index] = updated;
    this.writeStore(books);
    return of(updated).pipe(delay(200));
  }

  reorderOutlineChapter(id: string, fromIndex: number, toIndex: number): Observable<Ebook> {
    const books = this.readStore();
    const index = books.findIndex((ebook) => ebook.id === id);
    if (index === -1) {
      return of(this.getMissingEbook(id)).pipe(delay(150));
    }

    const outline = books[index].outline ?? { title: 'Ebook Outline', chapters: [] };
    const chapters = [...outline.chapters];
    const [moved] = chapters.splice(fromIndex, 1);
    chapters.splice(toIndex, 0, moved);

    const updated: Ebook = { ...books[index], outline: { ...outline, chapters } };
    books[index] = updated;
    this.writeStore(books);
    return of(updated).pipe(delay(200));
  }

  regenerateOutline(id: string): Observable<Ebook> {
    const books = this.readStore();
    const index = books.findIndex((ebook) => ebook.id === id);
    if (index === -1) {
      return of(this.getMissingEbook(id)).pipe(delay(150));
    }

    const outline = books[index].outline ?? { title: 'Ebook Outline', chapters: [] };
    const refreshed = {
      ...outline,
      chapters: outline.chapters.map((chapter, idx) => ({
        ...chapter,
        title: chapter.title || `Chapter ${idx + 1}`,
        lessons: chapter.lessons || 3
      }))
    };

    const updated: Ebook = {
      ...books[index],
      outline: refreshed,
      status: 'OUTLINE_REVIEW',
      currentStep: 'OUTLINE_APPROVAL'
    };
    books[index] = updated;
    this.writeStore(books);
    return of(updated).pipe(delay(200));
  }

  startGeneration(id: string): Observable<GenerationProgress> {
    const books = this.readStore();
    const ebook = books.find((item) => item.id === id);
    if (!ebook) {
      const empty: GenerationProgress = {
        totalChapters: 0,
        completedChapters: 0,
        currentChapter: 'N/A',
        progress: 0,
        failedChapters: 0,
        chapters: []
      };
      return of(empty).pipe(delay(150));
    }

    const chapters = ebook.outline?.chapters ?? [];
    const next: GenerationProgress = {
      totalChapters: chapters.length || 1,
      completedChapters: Math.max(0, chapters.length - 1),
      currentChapter: chapters[2]?.title ?? chapters[0]?.title ?? 'Chapter 1',
      progress: chapters.length > 0 ? Math.round(((chapters.length - 1) / chapters.length) * 100) : 0,
      failedChapters: 0,
      chapters: chapters.map((chapter, idx) => ({
        chapterId: chapter.id,
        title: chapter.title,
        status: idx < 2 ? 'completed' : idx === 2 ? 'generating' : 'pending'
      }))
    };

    const updated: Ebook = {
      ...ebook,
      status: 'GENERATING',
      currentStep: 'GENERATION',
      creationProgress: 70,
      generation: next
    };
    const idx = books.findIndex((item) => item.id === id);
    books[idx] = updated;
    this.writeStore(books);
    return of(next).pipe(delay(200));
  }

  getGenerationStatus(id: string): Observable<GenerationProgress> {
    const books = this.readStore();
    const ebook = books.find((item) => item.id === id);
    const fallback: GenerationProgress = {
      totalChapters: 1,
      completedChapters: 0,
      currentChapter: 'Chapter 1',
      progress: 0,
      failedChapters: 0,
      chapters: [{ chapterId: 'chapter-1', title: 'Chapter 1', status: 'pending' }]
    };

    return of(ebook?.generation ?? fallback).pipe(delay(150));
  }

  retryGenerationChapter(id: string, chapterId: string): Observable<GenerationProgress> {
    const books = this.readStore();
    const ebook = books.find((item) => item.id === id);
    if (!ebook?.generation) {
      return this.startGeneration(id);
    }

    const chapters = ebook.generation.chapters.map((chapter) =>
      chapter.chapterId === chapterId ? { ...chapter, status: 'generating' as const } : chapter
    );
    const next: GenerationProgress = {
      ...ebook.generation,
      chapters,
      currentChapter: chapters.find((chapter) => chapter.status === 'generating')?.title ?? ebook.generation.currentChapter,
      progress: Math.min(
        100,
        Math.max(0, Math.round((chapters.filter((chapter) => chapter.status === 'completed').length / Math.max(1, chapters.length)) * 100))
      )
    };

    const updated: Ebook = { ...ebook, generation: next, status: 'GENERATING', currentStep: 'GENERATION' };
    const idx = books.findIndex((item) => item.id === id);
    books[idx] = updated;
    this.writeStore(books);
    return of(next).pipe(delay(200));
  }

  getEditorContent(id: string): Observable<EditorChapterContent[]> {
    const books = this.readStore();
    const ebook = books.find((item) => item.id === id);

    if (ebook?.editorContent?.length) {
      return of(ebook.editorContent).pipe(delay(150));
    }

    const defaultChapters: EditorChapterContent[] = (ebook?.outline?.chapters ?? []).map((chapter, idx) => ({
      chapterId: chapter.id,
      title: chapter.title,
      blocks: [
        { id: `h-${idx}`, type: 'heading', content: chapter.title },
        { id: `p-${idx}`, type: 'paragraph', content: `This chapter explains ${chapter.title.toLowerCase()} and the practical application of the idea in real scenarios.` },
        { id: `l-${idx}`, type: 'list', content: 'Key points', items: ['Define the core idea', 'Describe the user impact', 'Reference supporting sources'] },
        { id: `c-${idx}`, type: 'callout', content: 'Important: keep claims grounded in the source material and note any assumptions clearly.' },
        { id: `ref-${idx}`, type: 'citation', content: 'Source support', sourceId: 'source-1', citationLabel: '[1]' }
      ]
    }));

    return of(defaultChapters).pipe(delay(150));
  }

  saveEditorContent(id: string, chapters: EditorChapterContent[]): Observable<Ebook> {
    const books = this.readStore();
    const idx = books.findIndex((item) => item.id === id);
    if (idx === -1) {
      return of(this.getMissingEbook(id)).pipe(delay(150));
    }

    const updated: Ebook = {
      ...books[idx],
      editorContent: chapters,
      status: 'EDITING',
      currentStep: 'EDITOR',
      creationProgress: 80
    };
    books[idx] = updated;
    this.writeStore(books);
    return of(updated).pipe(delay(200));
  }

  runQualityCheck(id: string): Observable<QualityCheckResult> {
    const books = this.readStore();
    const ebook = books.find((item) => item.id === id);
    const result: QualityCheckResult = {
      overallScore: 86,
      structure: { score: 90, status: 'Passed' },
      readability: { score: 82, status: 'Passed' },
      citation: { score: 87, status: 'Passed' },
      unsupportedClaims: { score: 74, status: 'Warning' },
      duplication: { score: 78, status: 'Warning' },
      completeness: { score: 91, status: 'Passed' },
      status: 'Warning',
      issues: [
        {
          id: 'claim-1',
          title: 'A few claims need stronger evidence',
          description: 'Two sections could use a clearer citation link to the original source.',
          severity: 'Warning'
        }
      ]
    };

    if (ebook) {
      const updated: Ebook = {
        ...ebook,
        qualityCheck: result,
        status: 'QUALITY_CHECK',
        currentStep: 'QUALITY_CHECK',
        creationProgress: 90
      };
      const idx = books.findIndex((item) => item.id === id);
      books[idx] = updated;
      this.writeStore(books);
    }

    return of(result).pipe(delay(200));
  }

  updateReadingProgress(id: string, chapterIndex: number, progress: number): Observable<Ebook> {
    const books = this.readStore();
    const index = books.findIndex((ebook) => ebook.id === id);

    if (index === -1) {
      return of(this.getMissingEbook(id)).pipe(delay(150));
    }

    const nextProgress = Math.max(0, Math.min(100, progress));
    const updated: Ebook = {
      ...books[index],
      lastReadChapterIndex: chapterIndex,
      readingProgress: nextProgress,
      updatedAt: new Date().toISOString()
    };

    books[index] = updated;
    this.writeStore(books);
    return of(updated).pipe(delay(200));
  }

  private getMissingEbook(id: string): Ebook {
    return {
      id,
      title: 'Missing Ebook',
      status: 'DRAFT',
      currentStep: 'BASIC_INFORMATION',
      creationProgress: 0,
      readingProgress: 0,
      readingTime: '15 min',
      lastReadChapterIndex: 0,
      coverImage: this.defaultCover,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapterCount: 0
    };
  }
}
