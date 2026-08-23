import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EbookService } from '../../../../core/services/ebook.service';
import { EbookSummary } from '../../../../core/models/ebook.model';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="library-shell" *ngIf="filteredItems.length; else emptyState">
      <div class="header-row">
        <div>
          <p class="eyebrow">My Library</p>
          <h2>Personal collection</h2>
        </div>
        <button type="button" class="primary-btn" (click)="goToDashboard()">Back to Dashboard</button>
      </div>

      <div class="filter-row">
        <button type="button" class="filter-btn" [class.active]="filter === 'all'" (click)="filter = 'all'">All</button>
        <button type="button" class="filter-btn" [class.active]="filter === 'creating'" (click)="filter = 'creating'">Creating</button>
        <button type="button" class="filter-btn" [class.active]="filter === 'ready'" (click)="filter = 'ready'">Ready to Read</button>
      </div>

      <div class="book-grid">
        <article class="book-card" *ngFor="let item of filteredItems" (click)="openDetail(item)" tabindex="0" (keydown.enter)="openDetail(item)">
          <img [src]="item.coverImage" [alt]="item.title" />
          <div class="content">
            <div class="book-title">{{ item.title }}</div>

            <div class="meta-line" *ngIf="isCreating(item)">
              <span>Current step</span>
              <strong>{{ item.currentStep }}</strong>
            </div>
            <div class="meta-line" *ngIf="isCreating(item)">
              <span>Creation progress</span>
              <strong>{{ item.creationProgress }}%</strong>
            </div>
            <div class="meta-line" *ngIf="isCreating(item)">
              <span>Last updated</span>
              <strong>{{ formatDate(item.updatedAt) }}</strong>
            </div>

            <div class="meta-line" *ngIf="!isCreating(item)">
              <span>Chapter count</span>
              <strong>{{ item.chapterCount }}</strong>
            </div>
            <div class="meta-line" *ngIf="!isCreating(item)">
              <span>Reading time</span>
              <strong>{{ item.readingTime || '15 min' }}</strong>
            </div>
            <div class="meta-line" *ngIf="!isCreating(item)">
              <span>Reading progress</span>
              <strong>{{ item.readingProgress }}%</strong>
            </div>

            <button type="button" class="action-btn" (click)="$event.stopPropagation(); openBook(item)">
              {{ isCreating(item) ? 'Continue Creating' : 'Continue Reading' }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <ng-template #emptyState>
      <section class="library-shell empty-shell">
        <div class="empty-box">
          <h2>Your library is empty</h2>
          <p>Create your first ebook to start building a reading library.</p>
          <button type="button" class="primary-btn" (click)="goToDashboard()">Go to Dashboard</button>
        </div>
      </section>
    </ng-template>
  `,
  styles: [
    `
      .library-shell {
        max-width: 1100px;
        margin: 0 auto;
      }
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
      }
      .eyebrow {
        margin: 0 0 6px;
        color: #6c6663;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-size: 0.72rem;
        font-weight: 700;
      }
      h2 {
        margin: 0;
      }
      .filter-row {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .filter-btn {
        border: 1px solid #d7d2cf;
        background: transparent;
        color: #1e1d1d;
        border-radius: 10px;
        padding: 8px 14px;
        font-weight: 700;
        cursor: pointer;
      }
      .filter-btn.active {
        background: #1d1d1d;
        color: white;
      }
      .primary-btn, .action-btn {
        border: 0;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }
      .primary-btn {
        background: #1d1d1d;
        color: #fff;
        padding: 10px 18px;
      }
      .action-btn {
        margin-top: 12px;
        background: #1d1d1d;
        color: #fff;
        width: 100%;
        height: 38px;
      }
      .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 18px;
      }
      .book-card {
        background: #f3f0ee;
        border: 1px solid #d7d2cf;
        border-top-left-radius: 0;
        border-top-right-radius: 18px;
        border-bottom-left-radius: 18px;
        border-bottom-right-radius: 0;
        overflow: hidden;
        cursor: pointer;
        box-shadow: 0 2px 0 rgba(10, 10, 10, 0.03);
      }
      .book-card img {
        display: block;
        width: 100%;
        height: 240px;
        object-fit: cover;
        border-radius: 0;
      }
      .content {
        padding: 14px 16px 18px;
      }
      .book-title {
        font-weight: 700;
        font-size: 1.1rem;
        line-height: 1.35;
        margin: 0 0 6px;
        color: #1f1f1f;
      }
      .meta-line {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        color: #666;
        font-size: 0.8rem;
        margin-top: 6px;
      }
      .meta-line strong {
        color: #222;
      }
      .empty-shell {
        display: flex;
        min-height: 320px;
        align-items: center;
        justify-content: center;
      }
      .empty-box {
        width: min(100%, 520px);
        background: rgba(242,239,236,.92);
        border: 1px solid #d7d2cf;
        border-radius: 18px;
        padding: 32px 24px;
        text-align: center;
      }
      .empty-box p {
        color: #666;
      }
      @media (max-width: 640px) {
        .header-row {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `
  ]
})
export class LibraryPageComponent implements OnInit {
  items: EbookSummary[] = [];
  filter: 'all' | 'creating' | 'ready' = 'all';

  constructor(
    private readonly ebookService: EbookService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.ebookService.getLibrary().subscribe((books) => {
      this.items = books;
    });
  }

  get filteredItems(): EbookSummary[] {
    if (this.filter === 'creating') {
      return this.items.filter((item) => item.status !== 'READY_TO_READ' && item.status !== 'PARTIAL_FAILURE');
    }

    if (this.filter === 'ready') {
      return this.items.filter((item) => item.status === 'READY_TO_READ');
    }

    return this.items;
  }

  isCreating(item: EbookSummary): boolean {
    return item.status !== 'READY_TO_READ';
  }

  openDetail(item: EbookSummary): void {
    this.router.navigate(['/ebooks', item.id, 'detail']);
  }

  openBook(item: EbookSummary): void {
    if (item.status === 'READY_TO_READ') {
      this.router.navigate(['/ebooks', item.id, 'reader']);
      return;
    }

    const route = this.ebookService.getResumeRoute({ id: item.id, currentStep: item.currentStep });
    this.router.navigateByUrl(route);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  goToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
