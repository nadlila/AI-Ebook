import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QualityCheckResult } from '../../../../core/models/ebook.model';
import { EbookService } from '../../../../core/services/ebook.service';

@Component({
  selector: 'app-quality-check-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <div class="card">
        <h2>Quality Check</h2>

        <div class="score-box">
          <span>Overall Score</span>
          <strong>{{ result.overallScore }}/100</strong>
          <small>{{ result.status }}</small>
        </div>

        <div class="metric-grid">
          <div class="metric" *ngFor="let entry of metrics">
            <div class="metric-head">
              <span>{{ entry.label }}</span>
              <strong>{{ entry.value.score }}/100</strong>
            </div>
            <div class="pill" [ngClass]="entry.value.status.toLowerCase()">{{ entry.value.status }}</div>
          </div>
        </div>

        <div class="issues" *ngIf="result.issues.length">
          <h3>Issues</h3>
          <div class="issue-item" *ngFor="let issue of result.issues">
            <div>
              <strong>{{ issue.title }}</strong>
              <p>{{ issue.description }}</p>
            </div>
            <button type="button" class="review-btn" (click)="reviewIssue()">Review Issue</button>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="secondary-btn" (click)="goBack()">Back to Editor</button>
          <button *ngIf="result.issues.length === 0" type="button" class="done-btn" (click)="done()">Done</button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .page-shell { min-height: calc(100vh - 90px); display:flex; align-items:center; justify-content:center; }
      .card { width:min(100%, 820px); background: rgba(242,239,236,.92); border:1px solid #d7d2cf; border-radius:18px; padding:24px 28px; }
      h2 { margin:0 0 20px; text-align:center; }
      .score-box { display:flex; flex-direction:column; gap:6px; border:1px solid #d8d3d0; background:#f8f6f4; border-radius:12px; padding:16px 18px; margin-bottom:18px; }
      .score-box strong { font-size:2rem; }
      .metric-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; }
      .metric { background:#f6f4f3; border:1px solid #d7d2cf; border-radius:12px; padding:12px 14px; }
      .metric-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:8px; }
      .pill { display:inline-flex; border-radius:999px; padding:4px 10px; font-size:.75rem; font-weight:700; }
      .pill.passed { background:#daf4e7; color:#1d6b48; }
      .pill.warning { background:#f8e8cf; color:#8a5b00; }
      .pill.failed { background:#efd0d0; color:#8a2c2c; }
      .issues { margin-top:20px; }
      .issue-item { display:flex; justify-content:space-between; align-items:center; gap:14px; background:#f7f5f4; border:1px solid #d7d2cf; border-radius:12px; padding:12px 14px; margin-top:10px; }
      .issue-item p { margin:6px 0 0; color:#555; }
      .review-btn, .secondary-btn, .done-btn { border:0; border-radius:10px; font-weight:700; cursor:pointer; }
      .review-btn { background:#1d1d1d; color:#fff; padding:10px 12px; }
      .secondary-btn { background:transparent; border:1px solid #d5d1cd; color:#1d1d1d; height:40px; min-width:160px; }
      .done-btn { background:#1d1d1d; color:#fff; height:40px; min-width:140px; }
      .actions { margin-top:22px; display:flex; justify-content:flex-end; gap:12px; }
      @media (max-width: 640px) { .issue-item { flex-direction:column; align-items:flex-start; } }
    `
  ]
})
export class QualityCheckPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  result: QualityCheckResult = {
    overallScore: 0,
    structure: { score: 0, status: 'Passed' },
    readability: { score: 0, status: 'Passed' },
    citation: { score: 0, status: 'Passed' },
    unsupportedClaims: { score: 0, status: 'Passed' },
    duplication: { score: 0, status: 'Passed' },
    completeness: { score: 0, status: 'Passed' },
    status: 'Passed',
    issues: []
  };

  metrics = [
    { label: 'Structure', value: this.result.structure },
    { label: 'Readability', value: this.result.readability },
    { label: 'Citation', value: this.result.citation },
    { label: 'Unsupported Claims', value: this.result.unsupportedClaims },
    { label: 'Duplication', value: this.result.duplication },
    { label: 'Completeness', value: this.result.completeness }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService.runQualityCheck(id).subscribe((quality) => {
      this.result = quality;
      this.metrics = [
        { label: 'Structure', value: quality.structure },
        { label: 'Readability', value: quality.readability },
        { label: 'Citation', value: quality.citation },
        { label: 'Unsupported Claims', value: quality.unsupportedClaims },
        { label: 'Duplication', value: quality.duplication },
        { label: 'Completeness', value: quality.completeness }
      ];
    });
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/ebooks', id, 'editor']);
      return;
    }
    this.router.navigate(['/dashboard']);
  }

  reviewIssue(): void {
    this.goBack();
  }

  done(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.router.navigate(['/ebooks', id, 'reader']);
  }
}
