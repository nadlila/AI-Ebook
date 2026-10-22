import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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

        <p role="status">{{ draftMessage }}</p>
        <button type="button" (click)="saveDraft()" [disabled]="draftSaving || isSubmitting">Simpan draft preferensi</button>
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

          <label>Cakupan tingkat pembelajaran</label>
          <div class="radio-group">
            <label><input type="checkbox" [checked]="hasLevel('Beginner')" (change)="toggleLevel('Beginner')" /> Beginner</label>
            <label><input type="checkbox" [checked]="hasLevel('Intermediate')" (change)="toggleLevel('Intermediate')" /> Intermediate</label>
            <label><input type="checkbox" [checked]="hasLevel('Advanced')" (change)="toggleLevel('Advanced')" /> Advanced</label>
            <p>Pilih satu atau beberapa level. Bab akan disusun bertahap dari dasar hingga lanjutan, dengan satu level per bab. Target jumlah kata tetap mengikuti content length.</p>
            <p *ngIf="form.controls.targetLevels.touched && form.controls.targetLevels.invalid" role="alert">Pilih minimal satu level.</p>
          </div>

          <label>Content Length</label>
          <div class="radio-group compact">
            <label><input type="radio" value="Short" formControlName="contentLength" /> Short - sekitar 2.000 kata (1.800-2.200)</label>
            <label><input type="radio" value="Medium" formControlName="contentLength" /> Medium - sekitar 4.000 kata (3.600-4.400)</label>
            <label><input type="radio" value="Long" formControlName="contentLength" /> Long - maksimal 6.000 kata (5.400-6.000)</label>
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
export class LearningPreferencesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ebookService = inject(EbookService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form = this.fb.nonNullable.group({
    learningGoal: ['', [Validators.required]],
    targetLevels: this.fb.nonNullable.control<Array<'Beginner' | 'Intermediate' | 'Advanced'>>([], Validators.required),
    language: ['', [Validators.required]],
    writingStyle: ['', [Validators.required]],
    contentLength: ['', [Validators.required]]
  });

  hasLevel(level: 'Beginner' | 'Intermediate' | 'Advanced'): boolean { return this.form.controls.targetLevels.value.includes(level); }
  toggleLevel(level: 'Beginner' | 'Intermediate' | 'Advanced'): void {
    if (this.isSubmitting || this.draftSaving) return;
    const control = this.form.controls.targetLevels;
    const next = this.hasLevel(level) ? control.value.filter(v => v !== level) : [...control.value, level];
    control.setValue((['Beginner', 'Intermediate', 'Advanced'] as const).filter(v => next.includes(v)));
    control.markAsTouched();
  }
  draftMessage = '';
  draftSaving = false;
  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!id) return;
    this.ebookService.getEbookById(id).subscribe({ next: book => {
      const draft = book.workflowDrafts?.['LEARNING_PREFERENCES'];
      this.form.patchValue(draft || { learningGoal: book.learningGoal, targetLevels: book.targetLevels?.length ? book.targetLevels : [book.targetLevel || 'Beginner'],
        language: book.language, writingStyle: book.writingStyle, contentLength: book.contentLength });
      if (draft && !Array.isArray(draft.targetLevels)) this.form.controls.targetLevels.setValue([draft.targetLevel || book.targetLevel || 'Beginner']);
    }, error: () => { this.draftMessage = 'Gagal memuat preferensi tersimpan.'; } });
  }
  saveDraft(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!id || this.draftSaving || this.isSubmitting) return;
    this.draftSaving = true;
    this.ebookService.saveWorkflow(id, 'LEARNING_PREFERENCES', this.form.getRawValue()).subscribe({
      next: () => { this.draftSaving = false; this.draftMessage = 'Draft preferensi tersimpan.'; },
      error: () => { this.draftSaving = false; this.draftMessage = 'Draft gagal disimpan. Coba lagi.'; }
    });
  }
  isSubmitting = false;

  startResearch(): void {
    if (this.draftSaving || this.isSubmitting) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const current = this.route.snapshot.queryParamMap.get('id');

    const payload = this.form.getRawValue();
    const updates: Partial<Ebook> = {
      learningGoal: payload.learningGoal,
      targetLevel: payload.targetLevels[0],
      targetLevels: payload.targetLevels,
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
