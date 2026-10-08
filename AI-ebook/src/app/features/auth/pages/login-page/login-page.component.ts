import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <h1>Selamat Datang</h1>
        <p class="subtitle">Silakan masuk untuk melanjutkan</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <span class="field-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M4 19C5.8 15.9 8.5 14.5 12 14.5C15.5 14.5 18.2 15.9 20 19"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <input type="email" aria-label="Email" formControlName="email" placeholder="Email" autocomplete="username" />
          </div>

          <div class="field">
            <span class="field-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M8 10V7.5C8 5.567 9.567 4 11.5 4H12.5C14.433 4 16 5.567 16 7.5V10"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <input [type]="showPassword ? 'text' : 'password'" aria-label="Password" formControlName="password" placeholder="Password" autocomplete="current-password" />
            <button
              type="button"
              class="password-toggle"
              (click)="showPassword = !showPassword"
              [attr.aria-label]="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              [attr.title]="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                @if (showPassword) {
                  <path d="m3 3 18 18" />
                }
              </svg>
            </button>
          </div>

          @if (errorMessage) {
            <p class="form-message error-message" role="alert">{{ errorMessage }}</p>
          }

          <button type="submit" class="primary-btn" [disabled]="form.invalid || isSubmitting">
            {{ isSubmitting ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <p class="switch-text">
          Belum punya akun? <a routerLink="/register">Daftar di sini</a>
        </p>
        <div class="footer">&copy;2026 ThinkLab</div>
      </div>
    </section>
  `,
  styleUrl: '../auth-page.css'
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  errorMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  showPassword = false;
  isSubmitting = false;

  submit(): void {
  if (this.form.invalid || this.isSubmitting) {
    this.form.markAllAsTouched();
    return;
  }

  this.isSubmitting = true;
  this.errorMessage = '';

  this.authService.login(this.form.getRawValue()).pipe(
    switchMap(() =>
      this.http.get<{ id: string; role: 'AUTHOR' | 'READER' }>(
        `${environment.apiBaseUrl}/auth/me`
      )
    )
  ).subscribe({
    next: () => {
      this.isSubmitting = false;
      void this.router.navigateByUrl('/dashboard');
    },
    error: (error: unknown) => {
      this.isSubmitting = false;
      if (error instanceof HttpErrorResponse) {
        this.errorMessage = error.status === 0
          ? 'Login Supabase berhasil, tetapi backend tidak dapat dihubungi. Pastikan backend berjalan di localhost:8080 dan mengizinkan origin frontend.'
          : error.status === 401
          ? 'Login Supabase berhasil, tetapi sesi ditolak backend. Periksa konfigurasi Supabase dan JWT backend.'
          : `Login Supabase berhasil, tetapi pengecekan akun di backend gagal (HTTP ${error.status}).`;
      } else {
        const code = (error as { code?: string } | null)?.code;
        this.errorMessage = code === 'invalid_credentials'
          ? 'Email atau password tidak sesuai.'
          : code === 'email_not_confirmed'
          ? 'Email belum dikonfirmasi. Buka tautan konfirmasi yang dikirim ke emailmu.'
          : 'Supabase belum dapat menyelesaikan login. Periksa koneksi dan coba lagi.';
      }
    }
  });
}
}
