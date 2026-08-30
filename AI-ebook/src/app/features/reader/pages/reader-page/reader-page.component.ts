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
          <button type="button" class="back-btn" (click)="goBack()">
            <span class="icon">←</span> Back to Dashboard
          </button>
          <h2>{{ ebook.title }}</h2>
          <div class="header-placeholder"></div>
        </header>

        <div class="reader-layout">
          <aside class="content-panel">
            <h3>Content</h3>
            <div class="chapter-list-scroll">
              <button
                type="button"
                class="chapter-item"
                *ngFor="let chapter of chapters; let i = index"
                [class.active]="selectedIndex === i"
                (click)="selectedIndex = i"
              >
                <span class="chap-num">{{ (i + 1).toString().padStart(2, '0') }}</span>
                <strong class="chap-title">{{ chapter.title }}</strong>
              </button>
            </div>
          </aside>

          <main class="book-panel">
            <div class="scroll-container">
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
            </div>

            <div class="pager">
              <button type="button" class="pager-btn" (click)="prevChapter()" [disabled]="selectedIndex === 0">Previous</button>
              <div class="progress-info">Chapter {{ selectedIndex + 1 }} of {{ chapters.length }}</div>
              <button type="button" class="pager-btn" (click)="nextChapter()" [disabled]="selectedIndex === chapters.length - 1">Next</button>
            </div>
          </main>
        </div>
      </div>
    </section>

    <ng-template #loadingState>
      <section class="reader-shell">
        <div class="reader-card empty-state">Loading book content...</div>
      </section>
    </ng-template>
  `,
  styles: [
    `
      .reader-shell {
        min-height: 100vh;
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .reader-card {
        width: 100%;
        max-width: 1100px;
        background: #f9f8f6;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
        height: 90vh;
      }
      .reader-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        padding: 0 10px;
      }
      .back-btn {
        background: transparent;
        border: none;
        color: #1a1a1a;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
      }
      .header-placeholder { width: 100px; }
      h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        text-align: center;
        flex: 1;
      }
      .reader-layout {
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 24px;
        flex: 1;
        overflow: hidden;
      }
      .content-panel {
        background: transparent;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #e0ddd9;
        padding-right: 20px;
      }
      .content-panel h3 {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #666;
        margin-bottom: 20px;
      }
      .chapter-list-scroll {
        flex: 1;
        overflow-y: auto;
      }
      .chapter-item {
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: transparent;
        border: none;
        text-align: left;
        padding: 12px;
        margin-bottom: 4px;
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .chapter-item:hover { background: #eeebe7; }
      .chapter-item.active { background: #e8e6e3; }
      .chap-num { font-weight: 700; font-size: 0.85rem; color: #1a1a1a; min-width: 20px; }
      .chap-title { font-size: 0.95rem; color: #1a1a1a; font-weight: 600; }

      .book-panel {
        background: white;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #e0e0e0;
      }
      .scroll-container {
        flex: 1;
        overflow-y: auto;
        padding: 40px 60px;
      }
      .chapter-title {
        font-size: 1.6rem;
        font-weight: 700;
        margin-bottom: 30px;
        text-align: center;
        color: #1a1a1a;
      }
      .chapter-content {
        line-height: 1.8;
        font-size: 1.05rem;
        color: #333;
        text-align: justify;
      }
      .block { margin-bottom: 20px; }
      .callout {
        background: #f9f8f6;
        border-left: 4px solid #1a1a1a;
        padding: 16px 20px;
        border-radius: 0 8px 8px 0;
        font-style: italic;
      }
      .pager {
        padding: 20px 40px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fff;
      }
      .pager-btn {
        background: #1a1a1a;
        color: #fff;
        border: none;
        padding: 10px 24px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
      }
      .pager-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      .progress-info { font-size: 0.9rem; font-weight: 500; color: #666; }
      .empty-state {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
      }
      @media (max-width: 900px) {
        .reader-layout { grid-template-columns: 1fr; }
        .content-panel { display: none; }
        .scroll-container { padding: 30px 20px; }
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
    });
  }

  get currentChapter(): any {
    return this.chapters[this.selectedIndex];
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
    if (!id || !this.chapters.length) return;

    const progress = Math.round(((this.selectedIndex + 1) / this.chapters.length) * 100);
    this.ebookService.updateReadingProgress(id, this.selectedIndex, progress).subscribe();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
