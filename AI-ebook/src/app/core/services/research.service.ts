import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Source } from '../models/source.model';

export type ResearchStatus = 'starting' | 'researching' | 'completed' | 'failed';

export interface ResearchResult {
  status: ResearchStatus;
  sources: Source[];
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ResearchService {
  private readonly storageKey = 'ai-ebook-research-sources-v1';

  private getMockSources(): Source[] {
    return [
      {
        id: 'source-1',
        title: 'Nielsen Norman Group: UX Research Methods',
        publisher: 'Nielsen Norman Group',
        domain: 'www.nngroup.com',
        url: 'https://www.nngroup.com/articles/ux-research-methods/',
        relevance: 95,
        accessDate: '2026-08-22',
        selected: true
      },
      {
        id: 'source-2',
        title: 'Google Design: Research and Product Thinking',
        publisher: 'Google Design',
        domain: 'design.google',
        url: 'https://design.google',
        relevance: 88,
        accessDate: '2026-08-20',
        selected: true
      },
      {
        id: 'source-3',
        title: 'UX Research Planning Primer',
        publisher: 'Interaction Design Foundation',
        domain: 'www.interaction-design.org',
        url: 'https://www.interaction-design.org/literature/article/ux-research-planning-primer',
        relevance: 80,
        accessDate: '2026-08-18',
        selected: false
      },
      {
        id: 'source-4',
        title: 'Designing for Trust in AI Systems',
        publisher: 'Microsoft Design',
        domain: 'learn.microsoft.com',
        url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/ai-design',
        relevance: 92,
        accessDate: '2026-08-17',
        selected: false
      }
    ];
  }

  startResearch(): Observable<ResearchResult> {
    const sources = this.getMockSources();
    const result: ResearchResult = { status: 'completed', sources };
    localStorage.setItem(this.storageKey, JSON.stringify(sources));
    return of(result).pipe(delay(600));
  }

  getResearchStatus(): Observable<ResearchResult> {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      const result: ResearchResult = { status: 'starting', sources: [] };
      return of(result).pipe(delay(150));
    }

    try {
      const sources = JSON.parse(saved) as Source[];
      const result: ResearchResult = { status: 'completed', sources };
      return of(result).pipe(delay(150));
    } catch {
      const result: ResearchResult = {
        status: 'failed',
        sources: [],
        message: 'Unable to read saved sources.'
      };
      return of(result).pipe(delay(150));
    }
  }

  getSources(): Observable<Source[]> {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      const sources = this.getMockSources();
      localStorage.setItem(this.storageKey, JSON.stringify(sources));
      return of(sources).pipe(delay(200));
    }

    try {
      return of(JSON.parse(saved) as Source[]).pipe(delay(200));
    } catch {
      return throwError(() => new Error('Failed to parse source list.')).pipe(delay(100));
    }
  }

  updateSelectedSources(selectedIds: string[]): Observable<Source[]> {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      return of([]);
    }

    const sources = JSON.parse(saved) as Source[];
    const next = sources.map((source) => ({
      ...source,
      selected: selectedIds.includes(source.id)
    }));

    localStorage.setItem(this.storageKey, JSON.stringify(next));
    return of(next).pipe(delay(200));
  }
}
