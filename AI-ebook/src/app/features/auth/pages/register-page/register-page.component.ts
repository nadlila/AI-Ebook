import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <h1>Buat Akun</h1>
        <p class="subtitle">Daftar untuk mulai membuat dan membaca ebook</p>

<<<<<<< HEAD
          <label>Email</label>
          <input
            type="email"
            formControlName="email"
            placeholder="you@example.com"
          />

          <label>Password</label>
          <input
            type="password"
            formControlName="password"
            placeholder="••••••••"
          />

          <button
            type="submit"
            class="primary-btn"
            [disabled]="form.invalid || isSubmitting"
          >
            {{ isSubmitting ? 'Creating account...' : 'Create account' }}
=======
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <span class="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" />
                <path d="M4 19C5.8 15.9 8.5 14.5 12 14.5C15.5 14.5 18.2 15.9 20 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <input type="text" aria-label="Nama lengkap" formControlName="name" placeholder="Nama lengkap" autocomplete="name" />
          </div>

          <div class="field">
            <span class="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" />
                <path d="M4 19C5.8 15.9 8.5 14.5 12 14.5C15.5 14.5 18.2 15.9 20 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <input type="email" aria-label="Email" formControlName="email" placeholder="Email" autocomplete="email" />
          </div>

          <div class="field">
            <span class="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8" />
                <path d="M8 10V7.5C8 5.567 9.567 4 11.5 4H12.5C14.433 4 16 5.567 16 7.5V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <input [type]="showPassword ? 'text' : 'password'" aria-label="Password" formControlName="password" placeholder="Password (minimal 6 karakter)" autocomplete="new-password" />
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

          @if (successMessage) {
            <p class="form-message success-message" role="status">{{ successMessage }}</p>
          }

          <button type="submit" class="primary-btn" [disabled]="form.invalid || isSubmitting">
            {{ isSubmitting ? 'Mendaftarkan...' : 'Daftar' }}
>>>>>>> 9a89d1d (menghubungkan backend dan frontend, login dan register menggunakan akun database, page akun)
          </button>
        </form>

        <p class="switch-text">
          Sudah punya akun? <a routerLink="/login">Login di sini</a>
        </p>
        <div class="footer">&copy;2026 ThinkLab</div>
      </div>
    </section>
  `,
<<<<<<< HEAD
  styles: [
    `
      .auth-shell {
        min-height: calc(100vh - 86px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .auth-card {
        width: min(100%, 440px);
        background: #f3f1ef;
        border: 1px solid #d6d4d1;
        border-radius: 18px;
        padding: 28px 24px 22px;
      }
      h2 {
        margin: 0 0 18px;
        text-align: center;
        font-size: 2rem;
        font-weight: 700;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      label {
        font-size: 0.95rem;
        font-weight: 600;
      }
      input {
        width: 100%;
        border: 1px solid #d4d0cc;
        border-radius: 10px;
        padding: 12px 14px;
        font-size: 1rem;
        background: #f8f7f6;
        box-sizing: border-box;
      }
      .primary-btn {
        margin-top: 14px;
        background: #1e1e1e;
        color: #fff;
        border: 0;
        border-radius: 12px;
        height: 46px;
        font-weight: 700;
        cursor: pointer;
      }
      .switch-text {
        margin-top: 16px;
        text-align: center;
        color: #565656;
      }
      .switch-text a {
        color: #1d1d1d;
        font-weight: 700;
        text-decoration: none;
      }
    `,
  ],
=======
  styleUrl: '../auth-page.css'
>>>>>>> 9a89d1d (menghubungkan backend dan frontend, login dan register menggunakan akun database, page akun)
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  showPassword = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.authService.register(this.form.getRawValue()).subscribe({
<<<<<<< HEAD
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (error) => {
        window.alert(
          error.error?.msg ||
            error.error?.error_description ||
            error.error?.detail ||
            error.message ||
            'Login gagal.',
        );
        this.isSubmitting = false;
      },
=======
      next: session => {
        this.isSubmitting = false;
        if (session) {
          void this.router.navigateByUrl('/dashboard');
        } else {
          this.successMessage = 'Periksa email untuk konfirmasi akun, lalu login.';
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Pendaftaran belum berhasil. Periksa data dan koneksi, lalu coba lagi.';
      }
>>>>>>> 9a89d1d (menghubungkan backend dan frontend, login dan register menggunakan akun database, page akun)
    });
  }
}
