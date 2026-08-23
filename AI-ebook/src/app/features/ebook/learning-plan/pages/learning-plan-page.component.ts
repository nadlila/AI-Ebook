import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Ebook, LearningPlan } from '../../../../core/models/ebook.model';
import { EbookService } from '../../../../core/services/ebook.service';

@Component({
  selector: 'app-learning-plan-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-shell">
      <div class="card">
        <h2>Learning Plan</h2>

        <form [formGroup]="form" (ngSubmit)="continueToOutline()">
          <label>Learning Goal</label>
          <input type="text" formControlName="goal" />

          <label>Learning Outcomes</label>
          <textarea formControlName="outcomes" rows="4"></textarea>

          <label>Estimated Reading Time</label>
          <input type="text" formControlName="estimatedReadingTime" />

          <div class="actions">
            <button type="button" class="back-btn" (click)="goBack()">Back</button>
            <button type="submit" class="primary-btn" [disabled]="form.invalid || isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Continue' }}
            </button>
          </div>
        </form>
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
        width: min(100%, 700px);
        background: rgba(242, 239, 236, 0.92);
        border: 1px solid #d7d2cf;
        border-radius: 18px;
        padding: 24px 28px;
      }
      h2 {
        margin: 0 0 20px;
        text-align: center;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      label {
        font-weight: 600;
      }
      input,
      textarea {
        width: 100%;
        border: 1px solid #d3d0cd;
        border-radius: 10px;
        background: #f8f7f6;
        padding: 12px 14px;
        font-size: 1rem;
        box-sizing: border-box;
      }
      textarea {
        resize: vertical;
      }
      .actions {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-top: 18px;
      }
      .primary-btn,
      .back-btn {
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
      .back-btn {
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
export class LearningPlanPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  form = this.fb.nonNullable.group({
    goal: ['', [Validators.required]],
    outcomes: ['', [Validators.required]],
    estimatedReadingTime: ['', [Validators.required]]
  });

  isSubmitting = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.ebookService.getEbookById(id).subscribe((ebook: Ebook | undefined) => {
      if (!ebook) {
        return;
      }

      this.form.patchValue({
        goal: ebook.learningGoal ?? '',
        outcomes: ebook.learningPlan?.outcomes.join('\n') ?? '',
        estimatedReadingTime: ebook.learningPlan?.estimatedReadingTime ?? '45 min'
      });
    });
  }

  continueToOutline(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.isSubmitting = true;
    const raw = this.form.getRawValue();
    const plan: LearningPlan = {
      goal: raw.goal,
      outcomes: raw.outcomes.split('\n').map((line) => line.trim()).filter(Boolean),
      estimatedReadingTime: raw.estimatedReadingTime
    };

    this.ebookService.createLearningPlan(id, plan).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/ebooks', id, 'outline']);
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/ebooks', id, 'sources']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
