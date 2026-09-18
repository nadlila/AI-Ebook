import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EbookService } from '../../../../core/services/ebook.service';
import { DashboardSnapshot, EbookSummary } from '../../../../core/models/ebook.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="dashboard" *ngIf="snapshot as data; else loadingTemplate">
      <div class="welcome-block">
        <h1>Hello, {{ data.userName }}</h1>
        <p>Create something new</p>

        <div class="cta-box">
          <span>Turn a topic into E-book.</span>
          <button class="primary-btn" routerLink="/ebooks/create">Start Creating</button>
        </div>
      </div>

      <div class="section-card">
        <h3>Continuing reading</h3>
        <div class="reading-card" *ngIf="data.continueReading; else noReading">
          <img [src]="data.continueReading.coverImage" [alt]="data.continueReading.title" />
          <div class="meta">
            <div class="title">{{ data.continueReading.title }}</div>
            <div class="stats">{{ data.continueReading.chapterCount }} Chapters</div>
            <div class="progress">{{ data.continueReading.readingProgress }}% completed</div>
          </div>
        </div>
        <ng-template #noReading>
          <p class="muted">No active reading session.</p>
        </ng-template>
      </div>

      <div class="section-card">
        <h3>My Library</h3>
        <div class="ebook-grid">
            <article class="ebook-item" *ngFor="let item of readyBooks(data.recentEbooks)" (click)="openEbook(item)" tabindex="0" (keydown.enter)="openEbook(item)">
            <img [src]="item.coverImage" [alt]="item.title" />
            <div class="book-title">{{ item.title }}</div>
            <div class="book-meta">{{ item.chapterCount }} Chapters</div>
            <div class="book-meta" *ngIf="isInProgress(item)">{{ item.creationProgress }}% completed</div>
            <div class="book-meta" *ngIf="!isInProgress(item)">{{ item.readingProgress }}% reading progress</div>
            <button class="resume-btn" *ngIf="isInProgress(item)" type="button" (click)="$event.stopPropagation(); resume(item)">
              Continue Creating
            </button>
            <button class="resume-btn" *ngIf="!isInProgress(item)" type="button" (click)="$event.stopPropagation(); continueReading(item)">
              Continue Reading
            </button>
          </article>
        </div>
      </div>

      <div class="section-card">
        <h3>My Draft</h3>
        <div class="ebook-grid">
          <article class="ebook-item" *ngFor="let item of draftBooks(data.recentEbooks)" (click)="openEbook(item)">
            <img [src]="item.coverImage" [alt]="item.title" />
            <div class="book-title">{{ item.title }}</div><div class="book-meta">{{ item.chapterCount }} Chapters</div>
            <div class="book-meta">{{ item.status === 'READY_TO_READ' ? 'Reading' : draftStage(item) }}</div>
            <div class="book-meta">{{ item.status === 'READY_TO_READ' ? item.readingProgress : item.creationProgress }}%</div>
            <button class="resume-btn" *ngIf="item.status !== 'READY_TO_READ'" type="button" (click)="$event.stopPropagation(); resume(item)">Continue Creating</button>
            <button class="resume-btn" *ngIf="item.status === 'READY_TO_READ'" type="button" (click)="$event.stopPropagation(); continueReading(item)">Continue Reading</button>
          </article>
        </div>
      </div>
    </section>

    <ng-template #loadingTemplate>
      <div class="loading-box">Loading dashboard...</div>
    </ng-template>
  `,
  styles: [
    `
      .dashboard {
        max-width: 980px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 28px;
      }
      .welcome-block {
        text-align: center;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 3vw, 3rem);
      }
      .welcome-block p {
        margin-top: 6px;
        color: #666;
      }
      .cta-box {
        max-width: 420px;
        margin: 22px auto 0;
        border: 1px solid #d9d4cf;
        border-radius: 12px;
        background: #F7F7F5;
        padding: 18px 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .primary-btn, .secondary-btn, .resume-btn {
        border: 0;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }
      .primary-btn {
        background: #1d1d1d;
        color: white;
        height: 42px;
      }
      .secondary-btn {
        margin-top: 18px;
        background: #1d1d1d;
        color: white;
        height: 42px;
        width: 160px;
      }
      .resume-btn {
        margin-top: 12px;
        background: #1d1d1d;
        color: white;
        height: 36px;
        width: 100%;
      }
      .section-card {
        background: #F0F0EE;
        border: 1px solid #E5E5E5;
        border-radius: 18px;
        padding: 18px 18px 24px;
      }
      h3 {
        margin: 0 0 18px;
        font-size: 1.05rem;
      }
      .reading-card {
        display: flex;
        gap: 18px;
        padding: 10px 0;
        align-items: center;
      }
      .reading-card img {
        width: 128px;
        height: 94px;
        object-fit: cover;
        border-top-left-radius: 0;
        border-top-right-radius: 18px;
        border-bottom-left-radius: 18px;
        border-bottom-right-radius: 0;
      }
      .meta {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .title {
        font-weight: 700;
      }
      .stats, .progress {
        color: #666;
      }
      .ebook-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(160px, 1fr));
        gap: 18px;
      }
      .ebook-item {
        width: 100%;
        background: #F7F7F5;
        border: 1px solid #d7d2cf;
        border-top-left-radius: 0;
        border-top-right-radius: 18px;
        border-bottom-left-radius: 18px;
        border-bottom-right-radius: 0;
        overflow: hidden;
        padding: 0;
        cursor: pointer;
      }
      .ebook-item img {
        width: 100%;
        height: 180px;
        object-fit: cover;
        display: block;
        border-radius: 0;
      }
      .book-title {
        margin: 12px 12px 0;
        font-weight: 700;
        font-size: 1.05rem;
        line-height: 1.35;
      }
      .book-meta {
        margin: 6px 12px 0;
        color: #666;
        font-size: 0.9rem;
      }
      .resume-btn {
        margin: 12px 12px 14px;
        background: #1d1d1d;
        color: white;
        height: 38px;
        width: calc(100% - 24px);
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }
      .muted {
        color: #666;
      }
      .loading-box {
        display: flex;
        min-height: 220px;
        align-items: center;
        justify-content: center;
        color: #666;
      }
      @media (max-width: 760px) {
        .ebook-grid {
          grid-template-columns: repeat(2, minmax(140px, 1fr));
        }
      }
    `
  ]
})
export class DashboardPageComponent implements OnInit {
  snapshot: DashboardSnapshot | null = null;

  constructor(
    private readonly ebookService: EbookService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.ebookService.getDashboardSnapshot().subscribe((snapshot) => {
      this.snapshot = snapshot;
    });
  }

  isInProgress(item: EbookSummary): boolean {
    return item.status !== 'READY_TO_READ';
  }

  readyBooks(items: EbookSummary[]): EbookSummary[] {
    return items.filter((item) => item.status === 'READY_TO_READ');
  }

  draftBooks(items: EbookSummary[]): EbookSummary[] {
    return items.filter((item) => item.status !== 'READY_TO_READ');
  }

  draftStage(item: EbookSummary): string {
    const stages: Record<string, string> = {
      BASIC_INFORMATION: 'Creation', CREATE_EBOOK: 'Creation', LEARNING_PREFERENCES: 'Creation',
      RESEARCH: 'Research', SOURCE_REVIEW: 'Source / Research', LEARNING_PLAN: 'Source / Research',
      OUTLINE: 'Outline', OUTLINE_APPROVAL: 'Outline', GENERATION: 'Generation', EDITOR: 'Editor', QUALITY_CHECK: 'Editor'
    };
    return stages[item.currentStep] || 'Creation';
  }

  resume(item: EbookSummary): void {
    const route = this.ebookService.getResumeRoute({ id: item.id, currentStep: item.currentStep });
    this.router.navigateByUrl(route);
  }

  continueReading(item: EbookSummary): void {
    this.router.navigate(['/ebooks', item.id, 'reader']);
  }

  openEbook(item: EbookSummary): void {
    this.router.navigate(['/ebooks', item.id, 'detail']);
  }
}
