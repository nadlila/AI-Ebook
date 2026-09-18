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
      <div class="generation-card">
        <header class="generation-header">
          <p class="eyebrow">AI EBOOK CREATION</p>
          <h2>Generation</h2>
          <p class="generation-status" [ngClass]="generationState">{{ generationStatus }}</p>
        </header>

        <div class="stats-grid">
          <div class="stat"><span>Total Chapters</span><strong>{{ progress.totalChapters }}</strong></div>
          <div class="stat"><span>Completed</span><strong>{{ progress.completedChapters }}</strong></div>
          <div class="stat current"><span>Current</span><strong>{{ progress.currentChapter }}</strong></div>
          <div class="stat"><span>Progress</span><strong>{{ progress.progress }}%</strong></div>
          <div class="stat failed"><span>Failed</span><strong>{{ progress.failedChapters }}</strong></div>
        </div>

        <div class="progress-section" aria-label="Generation progress">
          <div class="progress-label"><span>Overall progress</span><strong>{{ progress.progress }}%</strong></div>
          <div class="progress-track"><span class="progress-value" [style.width.%]="progress.progress"></span></div>
        </div>

        <div class="ai-task" [ngClass]="generationState">
          <span class="task-indicator" aria-hidden="true"></span>
          <div>
            <span class="task-label">Current AI task</span>
            <strong>{{ currentAiTask }}</strong>
          </div>
          <span class="estimate">Est. {{ estimatedTime }}</span>
        </div>

        <div class="chapter-list" *ngIf="progress.chapters.length; else emptyState">
          <article class="chapter-card" *ngFor="let item of progress.chapters; let i = index" [ngClass]="item.status">
            <div class="chapter-number">{{ i + 1 }}</div>
            <div class="chapter-copy">
              <span>Chapter {{ i + 1 }}</span>
              <strong>{{ item.title }}</strong>
            </div>
            <span class="status" [ngClass]="item.status">
              {{ item.status === 'completed' ? '✓' : item.status === 'generating' ? 'Generating...' : item.status === 'failed' ? 'Failed' : 'Pending' }}
            </span>
            <button type="button" class="retry-btn" *ngIf="item.status === 'failed'" (click)="retry(item.chapterId)">Retry</button>
          </article>
        </div>

        <ng-template #emptyState><p class="empty-state">Preparing your chapter generation steps...</p></ng-template>

        <div class="actions">
          <button type="button" class="secondary-btn" (click)="goBack()">Back</button>
          <button type="button" class="primary-btn" (click)="goToEditor()">Open Editor</button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host { display:block; color:#111; }
      .page-shell { min-height:calc(100vh - 90px); padding:25px 20px; display:flex; align-items:flex-start; justify-content:center; background:#fff; }
      .generation-card { width:min(100%,688px); background:#f3f0ee; border:1px solid #d8d3d0; border-radius:14px; padding:18px 22px 20px; box-shadow:none; }
      .generation-header { display:flex; justify-content:center; align-items:center; gap:20px; padding-bottom:10px; }
      .eyebrow { display:none; }
      h2 { margin:0 0 10px; text-align:center; font-size:20px; }
      .title-block { display:block; }
      .title-block h1 { font-size:20px; }
      .sparkle, .generation-status { display:none; }
      .stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:16px; }
      .stat { background:#f5f3f2; border:1px solid #dad5d1; border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
      .stat span { color:#222; font-size:11px; }
      .stat strong { font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .chapter-list { display:flex; flex-direction:column; gap:10px; margin-top:20px; }
      .chapter-card { display:grid; grid-template-columns:85px 1fr auto auto; gap:12px; align-items:center; background:#f8f7f6; border:1px solid #d8d3d0; border-radius:9px; padding:8px 10px; }
      .chapter-card.generating { border-color:#d9c8f4; background:#fcfaff; }
      .chapter-number { width:auto; height:auto; display:block; background:none; font-weight:700; font-size:14px; }
      .chapter-copy span { display:none; }
      .chapter-copy strong { font-size:14px; font-weight:400; }
      .chapter-row { display:grid; grid-template-columns: 110px 1fr 110px auto; gap:12px; align-items:center; background:#f7f5f4; border:1px solid #ddd7d3; border-radius:10px; padding:10px 12px; }
      .chapter-label { font-weight:700; }
      .status { font-weight:700; text-align:center; }
      .status.completed { color:#1a7f5a; }
      .status.generating { color:#b06d00; }
      .status.failed { color:#a12d2d; }
      .status.pending { color:#999; }
      .progress-section, .ai-task, .section-heading { display:none; }
      .progress-track { height:10px; margin-top:10px; border-radius:10px; background:#eee9e6; overflow:hidden; }
      .progress-value { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#b18be8,#7a4dd0); transition:width .3s ease; }
      .progress-label { display:flex; justify-content:space-between; font-size:14px; font-weight:700; }
      .progress-label strong { color:#8150d3; font-size:17px; }
      .ai-task { display:flex; align-items:center; gap:13px; border:1px solid #e6daf9; background:#faf7ff; border-radius:15px; padding:16px 18px; margin-top:22px; }
      .task-indicator { width:30px; height:30px; display:grid; place-items:center; border-radius:50%; background:#eadcff; }
      .task-indicator:after { content:''; width:9px; height:9px; border-radius:50%; background:#8a58d7; animation:pulse 1.4s infinite; }
      .task-label { display:block; color:#887f8f; font-size:11px; }
      .estimate { margin-left:auto; color:#7f6b9c; font-size:12px; }
      .retry-btn, .primary-btn, .secondary-btn { border:0; border-radius:10px; height:40px; font-weight:700; cursor:pointer; }
      .retry-btn { background:#f3e8e8; color:#9a2d2d; }
      .primary-btn { background:#1d1d1d; color:white; min-width:140px; }
      .secondary-btn { background:transparent; border:1px solid #d5d1cd; color:#1d1d1d; min-width:120px; }
      .actions { display:flex; justify-content:space-between; gap:14px; margin-top:22px; }
      @keyframes pulse { 50% { opacity:.35; transform:scale(.7); } }
      @media (max-width: 640px) { .generation-card { padding:18px 12px; } .stats-grid { grid-template-columns:repeat(2,1fr); } .chapter-card { grid-template-columns:75px 1fr auto; } .retry-btn { grid-column:2 / -1; } .actions { flex-direction:column; } }
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

  get generationState(): string {
    if (this.progress.failedChapters > 0) return 'failed';
    if (this.progress.totalChapters > 0 && this.progress.completedChapters >= this.progress.totalChapters) return 'complete';
    return 'generating';
  }

  get generationStatus(): string {
    if (this.generationState === 'failed') return 'Action needed';
    if (this.generationState === 'complete') return 'Generation complete';
    return 'Generating';
  }

  get currentAiTask(): string {
    if (this.generationState === 'complete') return 'Finalizing your ebook';
    if (this.generationState === 'failed') return 'Retrying failed chapter';
    return this.progress.currentChapter && this.progress.currentChapter !== 'N/A'
      ? `Writing ${this.progress.currentChapter}`
      : 'Preparing chapter content';
  }

  get estimatedTime(): string {
    const remaining = Math.max(this.progress.totalChapters - this.progress.completedChapters, 0);
    return remaining === 0 ? 'Almost ready' : `${Math.max(1, remaining * 2)} min remaining`;
  }

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
