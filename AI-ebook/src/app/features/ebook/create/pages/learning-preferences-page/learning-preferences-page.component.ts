import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Ebook } from '../../../../../core/models/ebook.model';
import { EbookService } from '../../../../../core/services/ebook.service';

@Component({
  selector: 'app-learning-preferences-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-shell">
      <div class="card">
        <h2>Create New Ebook</h2>

        <form [formGroup]="form" (ngSubmit)="startResearch()">
          <label>Learning Goal</label>
          <input type="text" formControlName="learningGoal" placeholder="Type your learning goal" />

          <label>Language</label>
          <select formControlName="language">
            <option value="">Select language</option>
            <option value="English">English</option>
            <option value="Indonesian">Indonesian</option>
          </select>

          <label>Writing Style / Tone</label>
          <select formControlName="writingStyle">
            <option value="">Select tone</option>
            <option value="Friendly">Friendly</option>
            <option value="Professional">Professional</option>
            <option value="Academic">Academic</option>
          </select>

          <label>Target Level</label>
          <div class="radio-group">
            <label><input type="radio" value="Beginner" formControlName="targetLevel" /> Beginner</label>
            <label><input type="radio" value="Intermediate" formControlName="targetLevel" /> Intermediate</label>
            <label><input type="radio" value="Advanced" formControlName="targetLevel" /> Advanced</label>
          </div>

          <label>Content Length</label>
          <div class="radio-group compact">
            <label><input type="radio" value="Short" formControlName="contentLength" /> Short</label>
            <label><input type="radio" value="Medium" formControlName="contentLength" /> Medium</label>
            <label><input type="radio" value="Long" formControlName="contentLength" /> Long</label>
          </div>

          <div class="actions">
            <button type="button" class="back-btn" (click)="goBack()">Back</button>
            <button type="submit" class="primary-btn" [disabled]="form.invalid || isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Start Research' }}
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
        margin-top: 4px;
        font-weight: 600;
      }
      input,
      select {
        width: 100%;
        border: 1px solid #d3d0cd;
        border-radius: 10px;
        background: #f8f7f6;
        padding: 12px 14px;
        font-size: 1rem;
        box-sizing: border-box;
      }
      .radio-group {
        display: grid;
        gap: 8px;
        margin-top: 2px;
      }
      .radio-group label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
      }
      input[type='radio'] {
        width: auto;
      }
      .actions {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-top: 14px;
      }
      .primary-btn,
      .back-btn {
        border: 0;
        border-radius: 12px;
        height: 46px;
        font-weight: 700;
        cursor: pointer;
        min-width: 150px;
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
        .actions {
          flex-direction: column;
        }
      }
    `
  ]
})
export class LearningPreferencesPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ebookService = inject(EbookService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form = this.fb.nonNullable.group({
    learningGoal: ['', [Validators.required]],
    targetLevel: ['', [Validators.required]],
    language: ['', [Validators.required]],
    writingStyle: ['', [Validators.required]],
    contentLength: ['', [Validators.required]]
  });

  isSubmitting = false;

  startResearch(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const current = this.route.snapshot.queryParamMap.get('id');

    const payload = this.form.getRawValue();
    const updates: Partial<Ebook> = {
      learningGoal: payload.learningGoal,
      targetLevel: payload.targetLevel as 'Beginner' | 'Intermediate' | 'Advanced',
      language: payload.language,
      writingStyle: payload.writingStyle,
      contentLength: payload.contentLength as 'Short' | 'Medium' | 'Long',
      status: 'RESEARCHING',
      currentStep: 'RESEARCH',
      creationProgress: 35
    };

    const persistAndNavigate = (id: string) => {
      this.ebookService.updateEbook(id, updates).subscribe({
        next: (ebook) => {
          this.isSubmitting = false;
          this.router.navigate(['/ebooks', ebook.id, 'research']);
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    };

    if (current) {
      persistAndNavigate(current);
      return;
    }

    this.ebookService.getCurrentDraft().subscribe({
      next: (ebook) => {
        if (ebook) {
          persistAndNavigate(ebook.id);
          return;
        }

        this.ebookService
          .createEbookDraft({
            ...updates,
            title: 'Untitled Ebook',
            description: '',
            chapterCount: 0
          })
          .subscribe({
            next: (newEbook) => {
              this.isSubmitting = false;
              this.router.navigate(['/ebooks', newEbook.id, 'research']);
            },
            error: () => {
              this.isSubmitting = false;
            }
          });
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/ebooks/create']);
  }
}
