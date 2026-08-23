import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EbookService } from '../../../../core/services/ebook.service';
import { Ebook } from '../../../../core/models/ebook.model';

@Component({
  selector: 'app-reader-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="reader-shell" *ngIf="ebook; else loadingState">
      <div class="reader-card">
        <header class="reader-header">
          <button type="button" class="back-btn" (click)="goBack()">Back</button>
          <h2>{{ ebook.title }}</h2>
        </header>

        <div class="reader-layout">
          <aside class="content-panel">
            <h3>Content</h3>
            <button
              type="button"
              class="chapter-item"
              *ngFor="let chapter of chapters; let i = index"
              [class.active]="selectedIndex === i"
              (click)="selectedIndex = i"
            >
              <span>{{ i + 1 }}</span>
              <strong>{{ chapter.title }}</strong>
            </button>
          </aside>

          <main class="book-panel">
            <div class="chapter-title">{{ currentChapter?.title }}</div>
            <div class="chapter-content" *ngIf="currentChapter">
              <div class="block" *ngFor="let block of currentChapter.blocks">
                <ng-container [ngSwitch]="block.type">
                  <h4 *ngSwitchCase="'heading'">{{ block.content }}</h4>
                  <p *ngSwitchCase="'paragraph'">{{ block.content }}</p>
                  <ul *ngSwitchCase="'list'">
                    <li *ngFor="let item of block.items || []">{{ item }}</li>
                  </ul>
                  <div *ngSwitchCase="'callout'" class="callout">{{ block.content }}</div>
                  <div *ngSwitchCase="'citation'" class="citation-inline">[{{ block.citationLabel || '1' }}]</div>
                </ng-container>
              </div>
            </div>

            <div class="pager">
              <button type="button" class="pager-btn" (click)="prevChapter()" [disabled]="selectedIndex === 0">Previous</button>
              <button type="button" class="pager-btn" (click)="nextChapter()" [disabled]="selectedIndex === chapters.length - 1">Next</button>
            </div>
          </main>
        </div>
      </div>
    </section>

    <ng-template #loadingState>
      <section class="reader-shell">
        <div class="reader-card empty-state">Loading ebook preview…</div>
      </section>
    </ng-template>
  `,
  styles: [
    `
      .reader-shell {
        min-height: calc(100vh - 90px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .reader-card {
        width: min(100%, 980px);
        background: rgba(242,239,236,.92);
        border: 1px solid #d7d2cf;
        border-radius: 18px;
        padding: 18px 20px 20px;
      }
      .reader-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }
      .back-btn, .pager-btn, .chapter-item {
        border: 0;
        border-radius: 10px;
        cursor: pointer;
      }
      .back-btn {
        background: #1d1d1d;
        color: #fff;
        padding: 8px 14px;
        font-weight: 700;
      }
      h2 {
        margin: 0;
        flex: 1;
        text-align: center;
      }
      .reader-layout {
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        gap: 18px;
      }
      .content-panel {
        background: #f5f3f2;
        border: 1px solid #d7d2cf;
        border-radius: 12px;
        padding: 14px 10px;
      }
      .content-panel h3 {
        margin: 0 0 12px;
      }
      .chapter-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        text-align: left;
        padding: 8px 10px;
        margin-bottom: 8px;
      }
      .chapter-item.active {
        background: #e7e0dc;
      }
      .book-panel {
        background: #f5f3f2;
        border: 1px solid #d7d2cf;
        border-radius: 12px;
        padding: 18px;
      }
      .chapter-title {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 18px;
        text-align: center;
      }
      .block {
        margin-bottom: 18px;
      }
      h4 {
        margin: 0 0 10px;
        font-size: 1.4rem;
      }
      p {
        margin: 0;
        line-height: 1.8;
      }
      ul {
        margin: 0;
        padding-left: 18px;
        line-height: 1.8;
      }
      .callout {
        background: #efe8dc;
        border-left: 4px solid #b68f4b;
        padding: 12px 14px;
        border-radius: 8px;
      }
      .citation-inline {
        display: inline-block;
        margin-top: 8px;
        background: transparent;
        color: #1d1d1d;
        font-weight: 700;
      }
      .pager {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 16px;
      }
      .pager-btn {
        background: #1d1d1d;
        color: #fff;
        padding: 10px 16px;
        font-weight: 700;
      }
      .pager-btn:disabled {
        opacity: 0.5;
        cursor: default;
      }
      .empty-state {
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @media (max-width: 760px) {
        .reader-layout { grid-template-columns: 1fr; }
      }
    `
  ]
})
export class ReaderPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  ebook: Ebook | undefined;
  chapters: any[] = [];
  selectedIndex = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService.getEbookById(id).subscribe((result) => {
      this.ebook = result;
      this.chapters = result?.editorContent ?? [];
      const savedIndex = result?.lastReadChapterIndex ?? 0;
      this.selectedIndex = Math.min(savedIndex, Math.max(0, this.chapters.length - 1));
      if (!this.chapters.length) {
        this.selectedIndex = 0;
      }
    });
  }

  get currentChapter(): any {
    return this.chapters[this.selectedIndex];
  }

  get progressValue(): number {
    if (!this.chapters.length) {
      return 0;
    }

    return Math.round(((this.selectedIndex + 1) / this.chapters.length) * 100);
  }

  prevChapter(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex -= 1;
      this.persistProgress();
    }
  }

  nextChapter(): void {
    if (this.selectedIndex < this.chapters.length - 1) {
      this.selectedIndex += 1;
      this.persistProgress();
    }
  }

  persistProgress(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.chapters.length) {
      return;
    }

    const progress = this.chapters.length > 0 ? Math.round(((this.selectedIndex + 1) / this.chapters.length) * 100) : 0;
    this.ebookService.updateReadingProgress(id, this.selectedIndex, progress).subscribe();
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/library']);
    }
  }
}
