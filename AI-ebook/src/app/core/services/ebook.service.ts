import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  DashboardSnapshot,
  Ebook,
  EbookOutline,
  EbookStep,
  EbookSummary,
  EditorChapterContent,
  GenerationProgress,
  LearningPlan,
  QualityCheckResult,
} from '../models/ebook.model';
@Injectable({ providedIn: 'root' })
export class EbookService {
  private base = environment.apiBaseUrl;
  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}
  project(id: string): Observable<any> {
    return this.http.get(`${this.base}/ebooks/${id}`);
  }
  mutate(
    id: string,
    path: string,
    body: any = {},
    method = 'POST',
  ): Observable<any> {
    return this.project(id).pipe(
      switchMap((p) =>
        this.http.request(method, `${this.base}/ebooks/${id}${path}`, {
          body,
          headers: { 'If-Match': String(p.revision) },
        }),
      ),
    );
  }
  private input(d: any): any {
    return {
      type: 'EBOOK',
      title: d.title || 'Untitled Ebook',
      description: d.description || '',
      learningGoal: d.learningGoal || d.title || 'Tujuan belajar belum diisi',
      audience: d.audience || 'Pelajar umum',
      targetLevel: d.targetLevel || 'Beginner',
      language: d.language || 'Indonesian',
      writingStyle: d.writingStyle || 'Friendly',
      contentLength: d.contentLength || 'Short',
      coverImage: d.coverImage || null,
    };
  }
  private book(p: any): Ebook {
    const published = p.status === 'PUBLISHED';
    return {
      ...p,
      status: published
        ? 'READY_TO_READ'
        : p.currentVersionId
          ? 'EDITING'
          : p.approvedOutlineId
            ? 'OUTLINE_REVIEW'
            : p.status === 'OUTLINE_REVIEW'
              ? 'OUTLINE_REVIEW'
              : p.status === 'RESEARCH_READY'
                ? 'RESEARCH_READY'
                : 'DRAFT',
      currentStep: published
        ? 'READER'
        : p.currentVersionId
          ? 'EDITOR'
          : p.approvedOutlineId
            ? 'GENERATION'
            : p.status === 'OUTLINE_REVIEW'
              ? 'OUTLINE'
              : p.status === 'RESEARCH_READY'
                ? 'SOURCE_REVIEW'
                : 'LEARNING_PREFERENCES',
      creationProgress: published
        ? 100
        : p.currentVersionId
          ? 80
          : p.approvedOutlineId
            ? 60
            : 20,
      readingProgress: 0,
      chapterCount: 0,
      coverImage: p.coverImage || '',
      lastReadChapterIndex: 0,
    };
  }
  createEbookDraft(data: Partial<Ebook>): Observable<Ebook> {
    return this.http
      .post<any>(`${this.base}/ebooks`, this.input(data))
      .pipe(map((p) => this.book(p)));
  }
  updateEbook(id: string, updates: Partial<Ebook>): Observable<Ebook> {
    return this.project(id).pipe(
      switchMap((p) =>
        this.http.put<any>(
          `${this.base}/ebooks/${id}`,
          this.input({ ...p, ...updates }),
          { headers: { 'If-Match': String(p.revision) } },
        ),
      ),
      map((p) => this.book(p)),
    );
  }
  getEbookById(id: string): Observable<Ebook> {
    if (this.auth.getSession()?.role === 'READER')
      return this.readPublication(id);
    return this.project(id).pipe(
      switchMap((p) =>
        forkJoin({
          sources: this.http.get<any[]>(`${this.base}/ebooks/${id}/sources`),
          outlines: this.http.get<any[]>(`${this.base}/ebooks/${id}/outlines`),
          content: p.currentVersionId
            ? this.http.get<any>(`${this.base}/ebooks/${id}/content`)
            : of(null),
        }).pipe(
          map(({ outlines, content, sources }) => ({
            ...this.book(p),
            sources,
            outline: outlines[0]?.outline,
            learningPlan: outlines[0]
              ? {
                  goal: p.learningGoal,
                  outcomes: outlines[0].outline.learningOutcomes,
                  estimatedReadingTime: '',
                }
              : undefined,
            editorContent: content?.content.chapters,
            chapterCount: outlines[0]?.outline.chapters.length || 0,
          })),
        ),
      ),
    );
  }
  getCurrentDraft(): Observable<Ebook | null> {
    return this.http.get<any>(`${this.base}/ebooks?size=100`).pipe(
      map((r) => r.items.find((p: any) => p.status === 'DRAFT')),
      map((p) => (p ? this.book(p) : null)),
    );
  }
  getLibrary(): Observable<EbookSummary[]> {
    if (this.auth.getSession()?.role === 'READER')
      return this.http
        .get<any>(`${this.base}/library?size=100`)
        .pipe(
          map((r) =>
            r.items.map((p: any) =>
              this.book({
                ...p,
                status: 'PUBLISHED',
                createdAt: p.publishedAt,
                updatedAt: p.publishedAt,
              }),
            ),
          ),
        );
    return this.http
      .get<any>(`${this.base}/ebooks?size=100`)
      .pipe(map((r) => r.items.map((p: any) => this.book(p))));
  }
  getDashboardSnapshot(): Observable<DashboardSnapshot> {
    return this.getLibrary().pipe(
      map((books) => ({
        userName: this.auth.getSession()?.user.name || '',
        continueReading:
          books.find((b) => b.status === 'READY_TO_READ') || null,
        recentEbooks: books.slice(0, 4),
      })),
    );
  }
  getResumeRoute(ebook: Pick<Ebook, 'currentStep' | 'id'>): string {
    if (ebook.currentStep === 'LEARNING_PREFERENCES')
      return `/ebooks/create/preferences?id=${ebook.id}`;
    const paths: Partial<Record<EbookStep, string>> = {
      RESEARCH: 'research',
      SOURCE_REVIEW: 'sources',
      LEARNING_PLAN: 'learning-plan',
      OUTLINE: 'outline',
      OUTLINE_APPROVAL: 'outline',
      GENERATION: 'generation',
      EDITOR: 'editor',
      QUALITY_CHECK: 'quality-check',
      READER: 'reader',
    };
    return `/ebooks/${ebook.id}/${paths[ebook.currentStep] || 'detail'}`;
  }
  createLearningPlan(id: string, plan: LearningPlan): Observable<Ebook> {
    return this.updateEbook(id, {
      learningGoal:
        plan.goal + '\nTarget hasil belajar:\n' + plan.outcomes.join('\n'),
    }).pipe(switchMap(() => this.regenerateOutline(id)));
  }
  createOutline(id: string, outline: EbookOutline): Observable<Ebook> {
    return this.mutate(id, '/outlines', {
      ...outline,
      learningOutcomes: ['Memahami materi sesuai tujuan belajar.'],
    }).pipe(switchMap(() => this.getEbookById(id)));
  }
  regenerateOutline(id: string): Observable<Ebook> {
    return this.mutate(id, '/ai/outline').pipe(
      switchMap(() => this.getEbookById(id)),
    );
  }
  approveOutline(id: string): Observable<Ebook> {
    return this.http.get<any[]>(`${this.base}/ebooks/${id}/outlines`).pipe(
      switchMap((o) =>
        o.length
          ? this.mutate(id, `/outlines/${o[0].id}/approve`)
          : throwError(() => new Error('Outline belum tersedia.')),
      ),
      map((p) => this.book(p)),
    );
  }
  startGeneration(id: string): Observable<GenerationProgress> {
    return this.mutate(id, '/ai/content').pipe(
      switchMap(() => this.getGenerationStatus(id)),
    );
  }
  getGenerationStatus(id: string): Observable<GenerationProgress> {
    return this.getEbookById(id).pipe(
      map((e) => {
        const chapters = e.outline?.chapters || [];
        const done = !!e.editorContent?.length;
        return {
          totalChapters: chapters.length,
          completedChapters: done ? chapters.length : 0,
          currentChapter: done
            ? 'Selesai'
            : 'Gemini sedang menyusun seluruh bab',
          progress: done ? 100 : 0,
          failedChapters: 0,
          chapters: chapters.map((c) => ({
            chapterId: c.id,
            title: c.title,
            status: done ? 'completed' : 'pending',
          })),
        };
      }),
    );
  }
  retryGenerationChapter(
    id: string,
    chapterId: string,
  ): Observable<GenerationProgress> {
    return this.startGeneration(id);
  }
  getEditorContent(id: string): Observable<EditorChapterContent[]> {
    return this.http
      .get<any>(`${this.base}/ebooks/${id}/content`)
      .pipe(map((r) => r.content.chapters));
  }
  saveEditorContent(
    id: string,
    chapters: EditorChapterContent[],
  ): Observable<Ebook> {
    return this.mutate(id, '/content', { chapters }, 'PUT').pipe(
      switchMap(() => this.getEbookById(id)),
    );
  }
  runQualityCheck(id: string): Observable<any> {
    return this.mutate(id, '/quality-check');
  }
  finalizeEbook(id: string): Observable<Ebook> {
    return this.project(id).pipe(
      switchMap((p) =>
        this.mutate(id, '/approve', {
          contentVersionId: p.currentVersionId,
          humanReviewConfirmed: true,
        }),
      ),
      switchMap(() => this.mutate(id, '/publish')),
      switchMap(() => this.getEbookById(id)),
    );
  }
  updateCover(id: string, coverImage: string): Observable<Ebook> {
    return this.updateEbook(id, { coverImage });
  }
  deleteEbook(id: string): void {
    throw new Error('Penghapusan belum tersedia.');
  }
  private readPublication(id: string): Observable<Ebook> {
    return forkJoin({
      data: this.http.get<any>(`${this.base}/library/${id}`),
      progress: this.http.get<any>(`${this.base}/library/${id}/progress`),
    }).pipe(
      map(({ data, progress }) => ({
        ...this.book({
          ...data.publication,
          status: 'PUBLISHED',
          createdAt: data.publication.publishedAt,
          updatedAt: data.publication.publishedAt,
        }),
        sources: data.sources,
        editorContent: data.content.chapters,
        chapterCount: data.content.chapters.length,
        lastReadChapterIndex: progress.chapterIndex,
        readingProgress: progress.completion,
      })),
    );
  }
  updateReadingProgress(
    id: string,
    chapterIndex: number,
    completion: number,
  ): Observable<Ebook> {
    if (this.auth.getSession()?.role === 'READER')
      return this.http.get<any>(`${this.base}/library/${id}/progress`).pipe(
        switchMap((p) =>
          this.http.put(`${this.base}/library/${id}/progress`, {
            contentVersionId: p.contentVersionId,
            chapterIndex,
            completion,
          }),
        ),
        switchMap(() => this.readPublication(id)),
      );
    // Author preview is not a publication reading session.
    return this.getEbookById(id);
  }
}
