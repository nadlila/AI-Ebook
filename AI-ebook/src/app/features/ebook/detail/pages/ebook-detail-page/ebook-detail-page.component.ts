import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Ebook } from '../../../../../core/models/ebook.model';
import { EbookService } from '../../../../../core/services/ebook.service';

@Component({
  selector: 'app-ebook-detail-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="detail-shell" *ngIf="ebook; else loadingState">
      <div class="detail-card">
        <div class="cover-block">
          <img [src]="ebook.coverImage" [alt]="ebook.title" />
        </div>

        <div class="detail-body">
          <div class="header-row">
            <button type="button" class="back-btn" (click)="goBack()">Back</button>
          </div>

          <h2>{{ ebook.title }}</h2>
          <p class="description">{{ ebook.description || 'No description provided.' }}</p>

          <div class="meta-grid">
            <div class="meta-item"><span>Chapters</span><strong>{{ ebook.chapterCount }}</strong></div>
            <div class="meta-item"><span>Reading Time</span><strong>{{ ebook.readingTime || '15 min' }}</strong></div>
            <div class="meta-item"><span>Level</span><strong>{{ ebook.targetLevel || 'Beginner' }}</strong></div>
            <div class="meta-item"><span>Status</span><strong>{{ isReadyToRead ? 'Ready to Read' : 'Creating' }}</strong></div>
          </div>

          <div class="progress-box" *ngIf="!isReadyToRead">
            <span>Creation progress</span>
            <strong>{{ ebook.creationProgress }}%</strong>
          </div>

          <div class="progress-box" *ngIf="isReadyToRead">
            <span>Reading progress</span>
            <strong>{{ ebook.readingProgress }}%</strong>
          </div>

          <div class="chapter-section">
            <h3>Chapters</h3>
            <ul class="chapter-list">
              <li *ngFor="let chapter of chapterList; let i = index">
                <span>0{{ i + 1 }}</span>
                <strong>{{ chapter.title }}</strong>
              </li>
            </ul>
          </div>

          <div class="detail-actions">
            <button type="button" class="primary-btn" (click)="primaryAction()">
              {{ isReadyToRead ? 'Continue Reading' : 'Continue Creating' }}
            </button>
            <button *ngIf="isReadyToRead" type="button" class="secondary-btn" (click)="editEbook()">Edit Ebook</button>
          </div>
        </div>
      </div>
    </section>

    <ng-template #loadingState>
      <section class="detail-shell">
        <div class="detail-card loading-box">Loading ebook details…</div>
      </section>
    </ng-template>
  `,
  styles: [
    `
      .detail-shell {
        min-height: calc(100vh - 90px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .detail-card {
        width: min(100%, 980px);
        background: rgba(242,239,236,.92);
        border: 1px solid #d7d2cf;
        border-radius: 18px;
        padding: 20px;
      }
      .cover-block {
        width: 100%;
        height: 240px;
        overflow: hidden;
        border-radius: 12px;
        margin-bottom: 18px;
      }
      .cover-block img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .detail-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .header-row {
        display: flex;
        justify-content: flex-start;
      }
      .back-btn, .primary-btn, .secondary-btn {
        border: 0;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }
      .back-btn {
        background: #1d1d1d;
        color: white;
        padding: 8px 16px;
      }
      h2 {
        margin: 0;
        font-size: clamp(2rem, 2.4vw, 2.6rem);
      }
      .description {
        margin: 0;
        color: #555;
        line-height: 1.7;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      .meta-item {
        background: #f7f5f4;
        border: 1px solid #d8d3d0;
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .meta-item span {
        color: #666;
        font-size: 0.82rem;
      }
      .progress-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f7f5f4;
        border: 1px solid #d8d3d0;
        border-radius: 12px;
        padding: 12px 14px;
        color: #333;
      }
      .chapter-section h3 {
        margin: 0 0 12px;
      }
      .chapter-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .chapter-list li {
        display: grid;
        grid-template-columns: 42px 1fr;
        gap: 10px;
        background: #f7f5f4;
        border: 1px solid #d7d2cf;
        border-radius: 10px;
        padding: 10px 12px;
      }
      .detail-actions {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }
      .primary-btn {
        background: #1d1d1d;
        color: white;
        padding: 12px 18px;
      }
      .secondary-btn {
        background: transparent;
        border: 1px solid #d5d1cd;
        color: #1d1d1d;
        padding: 12px 18px;
      }
      .loading-box {
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @media (max-width: 640px) {
        .detail-actions {
          flex-direction: column;
        }
      }
    `
  ]
})
export class EbookDetailPageComponent implements OnInit {
  ebook: Ebook | undefined;
  chapterList: Array<{ title: string }> = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ebookService: EbookService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService.getEbookById(id).subscribe((result) => {
      this.ebook = result;
      this.chapterList = result?.outline?.chapters?.length
        ? result.outline.chapters.map((chapter) => ({ title: chapter.title }))
        : result?.editorContent?.map((chapter) => ({ title: chapter.title })) ?? [];
    });
  }

  get isReadyToRead(): boolean {
    return this.ebook?.status === 'READY_TO_READ' || this.ebook?.currentStep === 'MY_LIBRARY';
  }

  primaryAction(): void {
    const id = this.ebook?.id;
    if (!id) {
      return;
    }

    if (this.isReadyToRead) {
      this.router.navigate(['/ebooks', id, 'reader']);
      return;
    }

    const route = this.ebookService.getResumeRoute({ id, currentStep: this.ebook?.currentStep ?? 'BASIC_INFORMATION' });
    this.router.navigateByUrl(route);
  }

  editEbook(): void {
    const id = this.ebook?.id;
    if (id) {
      this.router.navigate(['/ebooks', id, 'reader']);
    }
  }

  goBack(): void {
    this.router.navigate(['/library']);
  }
}
