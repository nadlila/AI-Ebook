import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EbookService } from './ebook.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('Private ebook persistence', () => {
  let service: EbookService;
  let http: HttpTestingController;
  const base = environment.apiBaseUrl;
  const project = { id: 'project-a', title: 'Private ebook', status: 'PUBLISHED', updatedAt: '2026-10-09', createdAt: '2026-10-09' };
  const publication = { id: 'publication-a', contentVersionId: 'version-a', projectId: 'project-a' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { getSession: () => ({user: { name: 'User' }}) } }
    ] });
    service = TestBed.inject(EbookService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function flushBook() {
    http.expectOne(base + '/ebooks/project-a').flush(project);
    http.expectOne(base + '/ebooks/project-a/publication').flush(publication);
    http.expectOne(base + '/library/publication-a').flush({
      content: { chapters: [{chapterId: 'chapter-1', title: 'Chapter', blocks: []}] }, sources: []
    });
    http.expectOne(base + '/library/publication-a/progress').flush({chapterIndex: 0, completion: 70, updatedAt: '2026-10-09T10:00:00Z'});
  }

  it('loads saved progress while keeping project IDs for navigation', () => {
    service.getEbookById('project-a').subscribe(book => {
      expect(book.id).toBe('project-a');
      expect(book.publicationId).toBe('publication-a');
      expect(book.readingProgress).toBe(70);
      expect(book.chapterCount).toBe(1);
    });
    flushBook();
  });

  it('writes progress against the exact version that was opened', () => {
    service.updateReadingProgress('project-a', 0, 70, 'publication-a', 'version-a').subscribe();
    const request = http.expectOne(base + '/library/publication-a/progress');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({contentVersionId: 'version-a', chapterIndex: 0, completion: 70});
    request.flush({});
    flushBook();
  });

  it('does not reuse a previous account library or seed an empty account', () => {
    service.getLibrary().subscribe(books => expect(books.length).toBe(1));
    http.expectOne(base + '/ebooks?page=0&size=100').flush({items: [project], totalElements: 1});
    flushBook();
    service.getLibrary().subscribe(books => expect(books).toEqual([]));
    http.expectOne(base + '/ebooks?page=0&size=100').flush({items: [], totalElements: 0});
    http.expectNone(base + '/library?size=100');
  });

  it('keeps errors visible instead of falling back to local dummy data', () => {
    service.getLibrary().subscribe({next: () => fail('Should reject'), error: error => expect(error.status).toBe(401)});
    http.expectOne(base + '/ebooks?page=0&size=100').flush({}, {status: 401, statusText: 'Unauthorized'});
  });

  it('resumes the saved learning plan stage with a specific percentage', () => {
    service.getEbookById('project-a').subscribe(book => {
      expect(book.currentStep).toBe('LEARNING_PLAN');
      expect(book.creationProgress).toBe(40);
      expect(book.workflowDrafts?.['LEARNING_PLAN'].goal).toBe('Saved goal');
    });
    http.expectOne(base + '/ebooks/project-a').flush({ ...project, status: 'RESEARCH_READY',
      workflowStep: 'LEARNING_PLAN', workflowDrafts: JSON.stringify({ LEARNING_PLAN: JSON.stringify({goal: 'Saved goal'}) }) });
    http.expectOne(base + '/ebooks/project-a/sources').flush([]);
    http.expectOne(base + '/ebooks/project-a/outlines').flush([]);
  });

  it('saves an incomplete stage draft with project revision protection', () => {
    service.saveWorkflow('project-a', 'OUTLINE', {selected: ['a'], order: ['b', 'a']}).subscribe(book => {
      expect(book.currentStep).toBe('OUTLINE');
      expect(book.creationProgress).toBe(50);
    });
    http.expectOne(base + '/ebooks/project-a').flush({...project, revision: 7});
    const saved = http.expectOne(base + '/ebooks/project-a/workflow');
    expect(saved.request.method).toBe('PUT');
    expect(saved.request.headers.get('If-Match')).toBe('7');
    expect(JSON.parse(saved.request.body.draft).order).toEqual(['b', 'a']);
    saved.flush({...project, status: 'OUTLINE_REVIEW', workflowStep: 'OUTLINE'});
  });

  it('reports partially generated chapters without treating content as complete', () => {
    service.getGenerationStatus('project-a').subscribe(progress => {
      expect(progress.completedChapters).toBe(1);
      expect(progress.progress).toBe(50);
      expect(progress.chapters[0].status).toBe('completed');
      expect(progress.chapters[1].status).toBe('pending');
    });
    http.expectOne(base + '/ebooks/project-a').flush({...project, status: 'OUTLINE_REVIEW',
      approvedOutlineId: 'outline-a', workflowStep: 'GENERATION',
      workflowDrafts: JSON.stringify({GENERATION: JSON.stringify({outlineId: 'outline-a', chapters: [{chapterId: 'a'}]})})});
    http.expectOne(base + '/ebooks/project-a/sources').flush([]);
    http.expectOne(base + '/ebooks/project-a/outlines').flush([{id:'outline-a', outline:{
      title: 'Book', learningOutcomes: [], chapters: [{id:'a', title:'A'}, {id:'b', title:'B'}]
    }}]);
  });
});
