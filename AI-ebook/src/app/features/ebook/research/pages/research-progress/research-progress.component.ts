import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResearchResult, ResearchService, ResearchStatus } from '../../../../../core/services/research.service';

@Component({
  selector: 'app-research-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <div class="card">
        <ng-container *ngIf="status === 'starting'">
          <div class="state-box">
            <p class="title">Researching your topic...</p>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="25"></div>
            </div>
            <p class="sub">Finding relevant information...</p>
          </div>
        </ng-container>

        <ng-container *ngIf="status === 'researching'">
          <div class="state-box">
            <p class="title">Researching your topic</p>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="65"></div>
            </div>
            <p class="sub">Finding relevant information...</p>
          </div>
        </ng-container>

        <ng-container *ngIf="status === 'completed'">
          <div class="state-box success">
            <p class="title">Research complete ✔</p>
            <p class="sub">We found {{ sources.length }} relevant sources.</p>
            <button type="button" class="primary-btn" (click)="goToSources()">Review Sources</button>
          </div>
        </ng-container>

        <ng-container *ngIf="status === 'failed'">
          <div class="state-box error">
            <p class="title">Research failed</p>
            <p class="sub">{{ message || 'No valid content was returned.' }}</p>
            <button type="button" class="primary-btn" (click)="retry()">Retry</button>
          </div>
        </ng-container>
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
        width: min(100%, 620px);
        background: rgba(242, 239, 236, 0.92);
        border: 1px solid #d7d2cf;
        border-radius: 18px;
        padding: 24px 22px;
      }
      .state-box {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .title {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
      }
      .sub {
        margin: 0;
        color: #4e4d4d;
      }
      .progress-bar {
        width: 100%;
        height: 12px;
        background: #d8d4d1;
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: #1d1d1d;
        border-radius: inherit;
      }
      .primary-btn {
        width: fit-content;
        border: 0;
        border-radius: 10px;
        background: #1d1d1d;
        color: white;
        padding: 10px 18px;
        font-weight: 700;
        cursor: pointer;
      }
      .success {
        text-align: left;
      }
      .error {
        text-align: left;
      }
    `
  ]
})
export class ResearchProgressPageComponent implements OnInit {
  private readonly researchService = inject(ResearchService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  status: ResearchStatus = 'starting';
  sources: Array<{ id: string }> = [];
  message = '';

  ngOnInit(): void {
    this.status = 'researching';
    this.researchService.startResearch().subscribe({
      next: (result: ResearchResult) => {
        this.status = result.status;
        this.sources = result.sources ?? [];
        this.message = result.message ?? '';
      },
      error: () => {
        this.status = 'failed';
        this.message = 'Could not complete research.';
      }
    });
  }

  retry(): void {
    this.status = 'researching';
    this.researchService.startResearch().subscribe({
      next: (result: ResearchResult) => {
        this.status = result.status;
        this.sources = result.sources ?? [];
      },
      error: () => {
        this.status = 'failed';
      }
    });
  }

  goToSources(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/ebooks', id, 'sources']);
      return;
    }
    this.router.navigate(['/dashboard']);
  }
}
