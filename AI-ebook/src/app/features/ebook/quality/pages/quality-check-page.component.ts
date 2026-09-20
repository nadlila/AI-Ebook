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
      <div class="quality-card">
        <h2 class="quality-title">Content Quality</h2>

        <div class="score-section">
          <span class="score-label">Score</span>
          <div class="score-value">{{ result.overallScore }}/100</div>
          <div class="divider"></div>
        </div>

        <div class="checklist">
          <div class="check-item">
            <span class="status-icon">✓</span>
            <span>Structure Complete</span>
          </div>
          <div class="check-item">
            <span class="status-icon">✓</span>
            <span>Readability Good</span>
          </div>
          <div class="check-item">
            <span class="status-icon">✓</span>
            <span>Citation 94% supported</span>
          </div>
          <div class="check-item warning">
            <span class="status-icon">⚠️</span>
            <span>Unsupported Claims 2 issues</span>
          </div>
          <div class="check-item">
            <span class="status-icon">✓</span>
            <span>Completeness Passed</span>
          </div>
        </div>

        <div class="issues-review" *ngIf="result.issues.length > 0">
          <h3>Issues to Review</h3>
          <div class="issue-item" *ngFor="let issue of result.issues">
            <div class="issue-header">
              <span class="status-icon">{{ issue.severity === 'Warning' ? '⚠️' : (issue.severity === 'Failed' ? '❌' : 'ℹ️') }}</span>
              <strong>{{ issue.title }}</strong>
            </div>
            <p class="issue-desc">{{ issue.description }}</p>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-outline" (click)="reviewIssue()">Review Issues</button>
          <button class="btn-outline" (click)="goBack()">Back to Editor</button>
          <button class="btn-done" (click)="done()">Done</button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .page-shell {
        min-height: 100vh;
        background-color: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .quality-card {
        background-color: #f9f8f6;
        width: 100%;
        max-width: 500px;
        border-radius: 24px;
        padding: 40px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      }

      .quality-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 30px;
      }

      .score-section {
        margin-bottom: 25px;
      }

      .score-label {
        font-size: 1rem;
        font-weight: 600;
        display: block;
        margin-bottom: 5px;
      }

      .score-value {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .divider {
        height: 1px;
        background-color: #e0ddd9;
        width: 100%;
      }

      .checklist {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 30px;
      }

      .check-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        font-weight: 500;
      }

      .check-item.warning {
        color: #000;
      }

      .status-icon {
        font-size: 1rem;
      }

      .issues-review {
        margin-bottom: 35px;
      }

      .issues-review h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 15px;
      }

      .issue-item {
        margin-left: 5px;
        margin-bottom: 12px;
      }

      .issue-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .issue-desc {
        margin: 0 0 0 24px;
        font-size: 0.9rem;
        color: #333;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .btn-outline {
        background-color: white;
        color: #000;
        border: 1px solid #e0e0e0;
        padding: 12px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        text-align: center;
      }

      .btn-done {
        background-color: #1a1a1a;
        color: white;
        border: none;
        padding: 14px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        text-align: center;
        margin-top: 5px;
      }

      .btn-done:hover {
        background-color: #333;
      }
    `
  ]
})
export class QualityCheckPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  result: QualityCheckResult = {
    overallScore: 91,
    structure: { score: 100, status: 'Passed' },
    readability: { score: 100, status: 'Passed' },
    citation: { score: 94, status: 'Passed' },
    unsupportedClaims: { score: 70, status: 'Warning' },
    duplication: { score: 100, status: 'Passed' },
    completeness: { score: 100, status: 'Passed' },
    status: 'Passed',
    issues: [
      {
        id: '1',
        title: 'Chapter 3',
        description: '2 claims need citation',
        severity: 'Warning'
      }
    ]
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService.runQualityCheck(id).subscribe((quality) => {
      this.result = { ...this.result, ...quality };
    });
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/ebooks', id, 'editor']);
    }
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

    this.router.navigate(['/ebooks', id, 'detail']);
  }

}
