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
});
