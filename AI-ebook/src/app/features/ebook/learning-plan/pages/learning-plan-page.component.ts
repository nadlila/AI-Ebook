import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Ebook, LearningPlan } from '../../../../core/models/ebook.model';
import { EbookService } from '../../../../core/services/ebook.service';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout, TimeoutError } from 'rxjs';

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
          <input type="text" formControlName="estimatedReadingTime" maxlength="100" />

          @if (isLoading) {
            <p class="status-message" role="status">Memuat rencana belajar...</p>
          }
          @if (isSubmitting) {
            <p class="status-message" role="status" aria-live="polite">
              Menyimpan rencana belajar dan menyusun outline dengan AI. Proses ini dapat
              memerlukan beberapa menit. Tunggu sampai halaman outline terbuka.
            </p>
          }
          @if (errorMessage) {
            <p class="error-message" role="alert">{{ errorMessage }}</p>
          }

          <div class="actions">
            <button type="button" class="back-btn" (click)="goBack()" [disabled]="isSubmitting">Back</button>
            <button type="submit" class="primary-btn" [disabled]="form.invalid || isSubmitting || isLoading">
              {{ isSubmitting ? 'Menyusun outline...' : 'Continue' }}
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
      .status-message, .error-message {
        margin: 4px 0;
        padding: 12px;
        border-radius: 8px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .status-message { background: #e9e9e5; color: #404040; }
      .error-message { background: #fff0ed; color: #912c22; }
      button:disabled { opacity: 0.55; cursor: not-allowed; }
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
    estimatedReadingTime: ['', [Validators.required, Validators.maxLength(100)]]
  });

  isSubmitting = false;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.isLoading = true;
    this.ebookService.getEbookById(id).subscribe({ next: (ebook: Ebook | undefined) => {
      this.isLoading = false;
      if (!ebook) {
        return;
      }

      this.form.patchValue({
        goal: ebook.learningPlan?.goal ?? ebook.learningGoal ?? '',
        outcomes: ebook.learningPlan?.outcomes.join('\n') ?? '',
        estimatedReadingTime: ebook.learningPlan?.estimatedReadingTime ?? '45 min'
      });
    }, error: (error: unknown) => {
      this.isLoading = false;
      this.errorMessage = this.describeError(error);
    } });
  }

  continueToOutline(): void {
    if (this.isSubmitting || this.isLoading) return;
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const raw = this.form.getRawValue();
    const plan: LearningPlan = {
      goal: raw.goal.trim(),
      outcomes: raw.outcomes.split('\n').map((line) => line.trim()).filter(Boolean),
      estimatedReadingTime: raw.estimatedReadingTime.trim()
    };
    if (!plan.goal || !plan.outcomes.length || !plan.estimatedReadingTime) {
      this.errorMessage = 'Isi tujuan belajar, minimal satu hasil belajar, dan estimasi waktu baca.';
      return;
    }
    this.isSubmitting = true;

    this.ebookService.createLearningPlan(id, plan).pipe(timeout(210_000)).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/ebooks', id, 'outline']);
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.errorMessage = this.describeError(error);
      }
    });
  }

  private describeError(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'Waktu tunggu habis. Backend mungkin masih menyelesaikan outline. Muat ulang halaman dan periksa hasilnya sebelum mencoba kembali.';
    }
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Backend tidak dapat dihubungi. Pastikan backend berjalan dan koneksi tersedia, lalu coba lagi.';
      if (error.status === 401) return 'Sesi login tidak valid atau berakhir. Login kembali sebelum melanjutkan.';
      const detail = error.error?.detail;
      if (typeof detail === 'string' && detail.trim()) return detail;
      if (error.status === 409) return 'Data ebook berubah atau proses lain masih berjalan. Muat ulang halaman sebelum mencoba lagi.';
      if (error.status === 403) return 'Akun ini belum memiliki akses untuk menyusun ebook.';
      if (error.status === 502 || error.status === 503) return 'Layanan AI belum dapat menyusun outline. Periksa konfigurasi dan kuota Gemini di backend.';
      return `Permintaan gagal (HTTP ${error.status}). Periksa respons backend sebelum mencoba lagi.`;
    }
    return 'Rencana belajar belum selesai diproses. Muat ulang halaman dan coba lagi.';
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
