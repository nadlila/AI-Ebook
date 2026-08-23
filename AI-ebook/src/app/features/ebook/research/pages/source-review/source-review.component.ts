import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Source } from '../../../../../core/models/source.model';
import { ResearchService } from '../../../../../core/services/research.service';

@Component({
  selector: 'app-source-review',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <div class="card">
        <div class="header-row">
          <h2>Research Source</h2>
          <span class="count">{{ sources.length }} Sources Found</span>
        </div>

        <div class="filters" *ngIf="sources.length">
          <button type="button" class="filter-btn active">All</button>
          <button type="button" class="filter-btn">Recommended</button>
          <button type="button" class="filter-btn">Selected</button>
        </div>

        <div class="empty-state" *ngIf="isLoading">Loading sources...</div>
        <div class="empty-state" *ngIf="!isLoading && !sources.length">No sources available.</div>

        <div class="source-list" *ngIf="!isLoading && sources.length">
          <article class="source-card" *ngFor="let source of sources">
            <div class="select-box">
              <input type="checkbox" [checked]="source.selected" (change)="toggle(source.id)" />
            </div>
            <div class="source-info">
              <div class="title-row">
                <strong>{{ source.title }}</strong>
              </div>
              <div class="meta-line">{{ source.publisher }}<span> • </span>{{ source.domain }}</div>
              <div class="link">{{ source.url }}</div>
              <div class="subline">Credibility: High</div>
              <div class="note">"User research focuses on..."</div>
            </div>
            <button type="button" class="view-btn" (click)="viewSource(source)">View Source</button>
          </article>
        </div>

        <div class="actions">
          <button type="button" class="back-btn" (click)="goBack()">Back</button>
          <button type="button" class="primary-btn" [disabled]="selectedCount === 0" (click)="continue()">
            Continue
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .page-shell {
        min-height: calc(100vh - 90px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card {
        width: min(100%, 760px);
        background: rgba(242, 239, 236, 0.92);
        border: 1px solid #d7d2cf;
        border-radius: 18px;
        padding: 24px 28px 28px;
      }
      .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;
        gap: 14px;
      }
      h2 {
        margin: 0;
        font-size: clamp(1.5rem, 2vw, 2.2rem);
      }
      .count {
        color: #4e4d4d;
      }
      .filters {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
      }
      .filter-btn {
        border: 1px solid #d3d0cd;
        background: transparent;
        border-radius: 8px;
        padding: 8px 14px;
        cursor: pointer;
      }
      .filter-btn.active {
        background: #e4e1de;
      }
      .source-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .source-card {
        display: grid;
        grid-template-columns: 30px 1fr auto;
        gap: 14px;
        align-items: flex-start;
        background: rgba(247, 246, 244, 0.9);
        border: 1px solid #d7d2cf;
        border-radius: 12px;
        padding: 14px 16px;
      }
      .select-box input {
        width: 18px;
        height: 18px;
        margin-top: 4px;
      }
      .source-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .title-row {
        font-size: 1rem;
      }
      .meta-line,
      .link,
      .subline,
      .note {
        color: #4b4b4b;
        font-size: 0.9rem;
      }
      .link {
        word-break: break-all;
      }
      .view-btn,
      .primary-btn,
      .back-btn {
        border: 0;
        border-radius: 10px;
        height: 38px;
        font-weight: 700;
        cursor: pointer;
      }
      .view-btn {
        background: #1d1d1d;
        color: white;
        padding: 0 16px;
      }
      .primary-btn {
        background: #1d1d1d;
        color: white;
        min-width: 150px;
      }
      .back-btn {
        background: transparent;
        border: 1px solid #d5d1cd;
        color: #1d1d1d;
        min-width: 120px;
      }
      .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 22px;
        gap: 14px;
      }
      .empty-state {
        padding: 18px 8px;
        color: #4e4d4d;
      }
      @media (max-width: 640px) {
        .card {
          padding: 18px 16px;
        }
        .source-card {
          grid-template-columns: 24px 1fr;
        }
        .view-btn {
          grid-column: 2;
          width: 100%;
        }
        .actions {
          flex-direction: column;
        }
      }
    `
  ]
})
export class SourceReviewPageComponent implements OnInit {
  private readonly researchService = inject(ResearchService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  sources: Source[] = [];
  isLoading = true;
  selectedCount = 0;

  ngOnInit(): void {
    this.researchService.getSources().subscribe({
      next: (sources) => {
        this.sources = sources;
        this.selectedCount = sources.filter((source) => source.selected).length;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggle(sourceId: string): void {
    this.sources = this.sources.map((source) =>
      source.id === sourceId ? { ...source, selected: !source.selected } : source
    );
    this.selectedCount = this.sources.filter((source) => source.selected).length;
  }

  viewSource(source: Source): void {
    window.open(source.url, '_blank', 'noopener,noreferrer');
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/ebooks', id, 'research']);
      return;
    }
    this.router.navigate(['/dashboard']);
  }

  continue(): void {
    if (this.selectedCount === 0) {
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const ids = this.sources.filter((source) => source.selected).map((source) => source.id);

    this.researchService.updateSelectedSources(ids).subscribe({
      next: () => {
        this.router.navigate(['/ebooks', id, 'learning-plan']);
      }
    });
  }
}
