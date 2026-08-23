import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EbookService } from '../../../../../core/services/ebook.service';

@Component({
  selector: 'app-create-ebook-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-shell">
      <div class="card">
        <h2>Create New Ebook</h2>

        <form [formGroup]="form" (ngSubmit)="continueToPreferences()">
          <label>What do you want to learn?</label>
          <input type="text" formControlName="title" placeholder="Type your topic" />

          <label>Tell us what do you want to understand about this topic?</label>
          <textarea formControlName="description" rows="4" placeholder="Optional description"></textarea>

          <button type="button" class="back-btn" (click)="goBack()">Back</button>
          <button type="submit" class="primary-btn" [disabled]="form.invalid || isSaving">
            {{ isSaving ? 'Saving...' : 'Continue' }}
          </button>
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
        width: min(100%, 720px);
        background: rgba(242, 239, 236, 0.92);
        border: 1px solid #d7d2cf;
        border-radius: 18px;
        padding: 24px 28px 28px;
      }
      h2 {
        margin: 0 0 22px;
        text-align: center;
        font-size: clamp(1.8rem, 2vw, 2.4rem);
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      label {
        display: block;
        margin-top: 6px;
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
      .primary-btn,
      .back-btn {
        margin-top: 16px;
        border: 0;
        border-radius: 12px;
        height: 46px;
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
        .card {
          padding: 22px 18px;
        }
      }
    `
  ]
})
export class CreateEbookPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ebookService = inject(EbookService);
  private readonly router = inject(Router);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['']
  });

  isSaving = false;

  continueToPreferences(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.form.getRawValue();

    this.ebookService
      .createEbookDraft({
        title: payload.title,
        description: payload.description,
        status: 'DRAFT',
        currentStep: 'LEARNING_PREFERENCES',
        creationProgress: 15,
        chapterCount: 0
      })
      .subscribe({
        next: (ebook) => {
          this.isSaving = false;
          this.router.navigate(['/ebooks/create/preferences'], { queryParams: { id: ebook.id } });
        },
        error: () => {
          this.isSaving = false;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
