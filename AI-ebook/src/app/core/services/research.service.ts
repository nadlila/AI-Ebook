import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { Source } from '../models/source.model';
import { EbookService } from './ebook.service';
import { environment } from '../../../environments/environment';
export interface ResearchView {
  sources: Source[];
  searchSuggestionsHtml: string;
  queries: string[];
  frozen: boolean;
  hasResearch: boolean;
}
@Injectable({ providedIn: 'root' })
export class ResearchService {
  constructor(
    private http: HttpClient,
    private ebooks: EbookService,
  ) {}
  getResearch(id: string): Observable<ResearchView> {
    return this.http.get<ResearchView>(`${environment.apiBaseUrl}/ebooks/${id}/ai/research`);
  }
  search(id: string, refresh = false): Observable<ResearchView> {
    return this.ebooks.mutate(id, `/ai/research?refresh=${refresh}`);
  }
  getSources(id: string): Observable<Source[]> {
    return this.http
      .get<any[]>(`${environment.apiBaseUrl}/ebooks/${id}/sources`)
      .pipe(
        map((s) => s.map((x) => ({ ...x, domain: x.url ? new URL(x.url).hostname : 'PDF' }))),
      );
  }
  addSource(id: string, input: any): Observable<any> {
    return this.ebooks.mutate(id, '/sources', input);
  }
  uploadPdf(id: string, file: File, input: {title: string; publisher: string; url: string}): Observable<Source> {
    const body = new FormData();
    body.append('file', file);
    body.append('title', input.title);
    body.append('publisher', input.publisher);
    body.append('url', input.url);
    return this.ebooks.mutate(id, '/sources/pdf', body);
  }
  updateSelectedSources(id: string, selected: string[]): Observable<Source[]> {
    return this.getSources(id).pipe(
      switchMap((s) =>
        from(s.filter((x) => x.selected !== selected.includes(x.id))).pipe(
          concatMap((x) =>
            this.ebooks.mutate(
              id,
              `/sources/${x.id}`,
              { selected: selected.includes(x.id), locked: x.locked ?? false },
              'PATCH',
            ),
          ),
          toArray(),
        ),
      ),
      switchMap(() => this.ebooks.saveWorkflow(id, 'LEARNING_PLAN')),
      switchMap(() => this.getSources(id)),
    );
  }
}
