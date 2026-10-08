import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, throwError, from } from 'rxjs';
import { map, switchMap, mergeMap, toArray } from 'rxjs/operators';
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
    return this.project(id).pipe(
      switchMap((p) => p.status === 'PUBLISHED' ? this.readPublication(p) :
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
                  goal: (p.learningGoal || '').split('\nTarget hasil belajar:\n')[0],
                  outcomes: outlines[0].outline.learningOutcomes,
                  estimatedReadingTime: outlines[0].outline.estimatedReadingTime || '',
                }
              : undefined,
            editorContent: content?.content.chapters,
            chapterCount: outlines[0]?.outline.chapters.length || 0,
            readingTime: content ? this.readingTime(content.content.chapters) : '',
          })),
        ),
      ),
    );
  }
  private listProjects(page = 0): Observable<any[]> {
    return this.http.get<{items: any[]; totalElements: number}>(
      this.base + '/ebooks?page=' + page + '&size=100'
    ).pipe(switchMap(result => (page + 1) * 100 < result.totalElements
      ? this.listProjects(page + 1).pipe(map(rest => [...result.items, ...rest]))
      : of(result.items)));
  }

  getCurrentDraft(): Observable<Ebook | null> {
    return this.listProjects().pipe(map(items => {
      const draft = items.find(p => p.status === 'DRAFT');
      return draft ? this.book(draft) : null;
    }));
  }

  getLibrary(): Observable<EbookSummary[]> {
    return this.listProjects().pipe(
      switchMap(projects => from(projects).pipe(
        mergeMap(p => this.getEbookById(p.id), 6),
        toArray(),
        map(books => books.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
      ))
    );
  }

  getDashboardSnapshot(): Observable<DashboardSnapshot> {
    return this.getLibrary().pipe(map(books => ({
      userName: this.auth.getSession()?.user.name || 'Pengguna',
      continueReading: [...books]
        .filter(b => b.status === 'READY_TO_READ' && !!b.lastReadAt)
        .sort((a, b) => (b.lastReadAt || '').localeCompare(a.lastReadAt || ''))[0] || null,
      recentEbooks: books
    })));
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
    }).pipe(
      switchMap(() => this.regenerateOutline(id)),
      switchMap(book => this.mutate(id, '/outlines', {
        title: book.outline!.title,
        chapters: book.outline!.chapters,
        learningOutcomes: plan.outcomes,
        estimatedReadingTime: plan.estimatedReadingTime
      })),
      switchMap(() => this.getEbookById(id))
    );
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
  private readPublication(project: any): Observable<Ebook> {
    return this.http.get<any>(this.base + '/ebooks/' + project.id + '/publication').pipe(
      switchMap(pub => forkJoin({
        data: this.http.get<any>(this.base + '/library/' + pub.id),
        progress: this.http.get<any>(this.base + '/library/' + pub.id + '/progress')
      }).pipe(map(({data, progress}) => ({
        ...this.book(project),
        publicationId: pub.id,
        contentVersionId: pub.contentVersionId,
        sources: data.sources,
        editorContent: data.content.chapters,
        chapterCount: data.content.chapters.length,
        lastReadChapterIndex: progress.chapterIndex,
        readingProgress: progress.completion,
        lastReadAt: progress.updatedAt || undefined,
        readingTime: this.readingTime(data.content.chapters)
      }))))
    );
  }

  uploadCover(id: string, file: File): Observable<Ebook> {
    const form = new FormData();
    form.append('file', file);
    return this.mutate(id, '/cover', form).pipe(switchMap(() => this.getEbookById(id)));
  }

  private readingTime(chapters: EditorChapterContent[]): string {
    const words = chapters.flatMap(c => c.blocks)
      .map(b => [b.content, ...(b.items || [])].join(' ')).join(' ').trim();
    return words ? Math.max(1, Math.ceil(words.split(/\s+/).length / 200)) + ' min' : '';
  }

  updateReadingProgress(
    id: string, chapterIndex: number, completion: number,
    publicationId?: string, contentVersionId?: string
  ): Observable<Ebook> {
    if (!publicationId || !contentVersionId) {
      return throwError(() => new Error('Ebook belum disimpan ke My Library.'));
    }
    return this.http.put(this.base + '/library/' + publicationId + '/progress', {
      contentVersionId, chapterIndex, completion
    }).pipe(switchMap(() => this.getEbookById(id)));
  }
}
