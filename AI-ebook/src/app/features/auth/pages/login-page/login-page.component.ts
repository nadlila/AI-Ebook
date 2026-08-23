import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="login-page">
      <div class="login-card">
        <h1>Selamat Datang</h1>
        <p class="subtitle">Silahkan masuk untuk melanjutkan</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <span class="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" />
                <path d="M4 19C5.8 15.9 8.5 14.5 12 14.5C15.5 14.5 18.2 15.9 20 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <input type="text" formControlName="email" placeholder="Username" autocomplete="username" />
          </div>

          <div class="field">
            <span class="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8" />
                <path d="M8 10V7.5C8 5.567 9.567 4 11.5 4H12.5C14.433 4 16 5.567 16 7.5V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <input type="password" formControlName="password" placeholder="Password" autocomplete="current-password" />
          </div>

          <button type="submit" class="primary-btn" [disabled]="form.invalid || isSubmitting">
            {{ isSubmitting ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <div class="footer">©2026 ThinkLab</div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #efefef;
        padding: 24px;
      }

      .login-card {
        width: min(100%, 420px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      h1 {
        margin: 0;
        font-size: 2.2rem;
        font-weight: 700;
        color: #1d1d1d;
        letter-spacing: -0.04em;
        text-align: center;
      }

      .subtitle {
        margin: 18px 0 28px;
        font-size: 1rem;
        color: #313131;
        text-align: center;
      }

      form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .field {
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.7);
        padding: 0 0 10px;
      }

      .field-icon {
        width: 22px;
        height: 22px;
        color: #171717;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .field-icon svg {
        width: 20px;
        height: 20px;
      }

      input {
        flex: 1;
        border: 0;
        outline: none;
        background: transparent;
        color: #1b1b1b;
        font-size: 1rem;
        padding: 0;
        min-height: 24px;
      }

      input::placeholder {
        color: rgba(25, 25, 25, 0.7);
      }

      .primary-btn {
        margin-top: 12px;
        width: 100%;
        border: 0;
        border-radius: 12px;
        background: #141414;
        color: #ffffff;
        font-size: 1rem;
        font-weight: 700;
        min-height: 44px;
        cursor: pointer;
        transition: opacity 0.2s ease;
      }

      .primary-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .footer {
        margin-top: 36px;
        font-size: 0.8rem;
        color: #6f6f6f;
        text-align: center;
      }

      @media (max-width: 480px) {
        .login-card {
          width: min(100%, 320px);
        }

        h1 {
          font-size: 1.8rem;
        }
      }
    `
  ]
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isSubmitting = false;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
