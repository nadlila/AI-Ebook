import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GenerationProgress } from '../../../../core/models/ebook.model';
import { EbookService } from '../../../../core/services/ebook.service';

@Component({
  selector: 'app-generation-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <div class="card">
        <h2>Generation</h2>

        <div class="stats-grid">
          <div class="stat"><span>Total Chapters</span><strong>{{ progress.totalChapters }}</strong></div>
          <div class="stat"><span>Completed</span><strong>{{ progress.completedChapters }}</strong></div>
          <div class="stat"><span>Current</span><strong>{{ progress.currentChapter }}</strong></div>
          <div class="stat"><span>Progress</span><strong>{{ progress.progress }}%</strong></div>
          <div class="stat"><span>Failed</span><strong>{{ progress.failedChapters }}</strong></div>
        </div>

        <div class="chapter-list" *ngIf="progress.chapters.length">
          <div class="chapter-row" *ngFor="let item of progress.chapters; let i = index">
            <span class="chapter-label">Chapter {{ i + 1 }}</span>
            <span class="chapter-name">{{ item.title }}</span>
            <span class="status" [ngClass]="item.status">
              {{ item.status === 'completed' ? '✓' : item.status === 'generating' ? 'Generating...' : item.status === 'failed' ? 'Failed' : 'Pending' }}
            </span>
            <button type="button" class="retry-btn" *ngIf="item.status === 'failed'" (click)="retry(item.chapterId)">Retry</button>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="secondary-btn" (click)="goBack()">Back</button>
          <button type="button" class="primary-btn" (click)="goToEditor()">Open Editor</button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .page-shell { min-height: calc(100vh - 90px); display: flex; align-items: center; justify-content: center; }
      .card { width: min(100%, 860px); background: rgba(242,239,236,.92); border:1px solid #d7d2cf; border-radius:18px; padding:24px 28px; }
      h2 { margin:0 0 16px; text-align:center; }
      .stats-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:16px; }
      .stat { background:#f5f3f2; border:1px solid #dad5d1; border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
      .stat span { color:#666; font-size:.85rem; }
      .chapter-list { display:flex; flex-direction:column; gap:10px; margin-top:20px; }
      .chapter-row { display:grid; grid-template-columns: 110px 1fr 110px auto; gap:12px; align-items:center; background:#f7f5f4; border:1px solid #ddd7d3; border-radius:10px; padding:10px 12px; }
      .chapter-label { font-weight:700; }
      .status { font-weight:700; text-align:center; }
      .status.completed { color:#1a7f5a; }
      .status.generating { color:#b06d00; }
      .status.failed { color:#a12d2d; }
      .status.pending { color:#666; }
      .retry-btn, .primary-btn, .secondary-btn { border:0; border-radius:10px; height:40px; font-weight:700; cursor:pointer; }
      .retry-btn { background:#f3e8e8; color:#9a2d2d; }
      .primary-btn { background:#1d1d1d; color:white; min-width:140px; }
      .secondary-btn { background:transparent; border:1px solid #d5d1cd; color:#1d1d1d; min-width:120px; }
      .actions { display:flex; justify-content:space-between; gap:14px; margin-top:22px; }
      @media (max-width: 640px) { .chapter-row { grid-template-columns: 1fr; } .actions { flex-direction:column; } }
    `
  ]
})
export class GenerationPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  progress: GenerationProgress = {
    totalChapters: 0,
    completedChapters: 0,
    currentChapter: 'N/A',
    progress: 0,
    failedChapters: 0,
    chapters: []
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService.getGenerationStatus(id).subscribe((result) => {
      this.progress = result;
    });

    this.ebookService.startGeneration(id).subscribe((result) => {
      this.progress = result;
    });
  }

  retry(chapterId: string): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.ebookService.retryGenerationChapter(id, chapterId).subscribe((result) => {
      this.progress = result;
    });
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/ebooks', id, 'outline']);
      return;
    }
    this.router.navigate(['/dashboard']);
  }

  goToEditor(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/ebooks', id, 'editor']);
      return;
    }
    this.router.navigate(['/dashboard']);
  }
}
