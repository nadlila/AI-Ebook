import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Ebook, EbookOutline } from '../../../../core/models/ebook.model';
import { EbookService } from '../../../../core/services/ebook.service';

@Component({
  selector: 'app-outline-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell">
      <div class="card">
        <h2>Ebook Outline</h2>
        <p class="subtitle">Organize your ebook before AI start writing.</p>

        <div class="outline-list" *ngIf="outline?.chapters?.length">
          <div class="chapter-item" *ngFor="let chapter of outline.chapters; let i = index">
            <span class="index">#0{{ i + 1 }}</span>
            <span class="title">{{ chapter.title }}</span>
            <span class="lessons">{{ chapter.lessons }} lessons</span>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="secondary-btn" (click)="goBack()">Back</button>
          <button type="button" class="primary-btn" (click)="approve()">Approve Outline</button>
        </div>
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
        width: min(100%, 640px);
        background: rgba(242, 239, 236, 0.92);
        border: 1px solid #d7d2cf;
        border-radius: 18px;
        padding: 24px 28px 28px;
      }
      h2 {
        margin: 0 0 8px;
        text-align: center;
      }
      .subtitle {
        margin: 0 0 18px;
        text-align: center;
        color: #555;
      }
      .outline-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .chapter-item {
        display: grid;
        grid-template-columns: 52px 1fr auto;
        gap: 12px;
        align-items: center;
        background: #f5f3f2;
        border: 1px solid #dad5d1;
        border-radius: 10px;
        padding: 10px 12px;
      }
      .index {
        font-weight: 700;
      }
      .title {
        font-weight: 600;
      }
      .lessons {
        color: #666;
        font-size: 0.9rem;
      }
      .actions {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-top: 22px;
      }
      .primary-btn,
      .secondary-btn {
        border: 0;
        border-radius: 12px;
        height: 46px;
        min-width: 150px;
        font-weight: 700;
        cursor: pointer;
      }
      .primary-btn {
        background: #1d1d1d;
        color: white;
      }
      .secondary-btn {
        background: transparent;
        border: 1px solid #d5d1cd;
        color: #1d1d1d;
      }
      @media (max-width: 640px) {
        .actions {
          flex-direction: column;
        }
      }
    `
  ]
})
export class OutlinePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  outline: EbookOutline = {
    title: 'Ebook Outline',
    chapters: [
      { id: '1', title: 'Introduction to UI/UX', lessons: 3 },
      { id: '2', title: 'Understanding Users', lessons: 4 },
      { id: '3', title: 'User Research', lessons: 4 },
      { id: '4', title: 'Wireframing', lessons: 3 },
      { id: '5', title: 'Prototyping', lessons: 3 }
    ]
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.ebookService.getEbookById(id).subscribe((ebook: Ebook | undefined) => {
      if (ebook?.outline) {
        this.outline = ebook.outline;
      }
    });
  }

  approve(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService.approveOutline(id).subscribe(() => {
      this.router.navigate(['/ebooks', id, 'generation']);
    });
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/ebooks', id, 'learning-plan']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
