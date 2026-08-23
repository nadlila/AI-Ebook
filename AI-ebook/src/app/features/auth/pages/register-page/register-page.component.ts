import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-shell">
      <div class="auth-card compact">
        <h2>Register</h2>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Name</label>
          <input type="text" formControlName="name" placeholder="Your name" />

          <label>Email</label>
          <input type="email" formControlName="email" placeholder="you@example.com" />

          <label>Password</label>
          <input type="password" formControlName="password" placeholder="••••••••" />

          <button type="submit" class="primary-btn" [disabled]="form.invalid || isSubmitting">
            {{ isSubmitting ? 'Creating account...' : 'Create account' }}
          </button>
        </form>

        <p class="switch-text">
          Already have an account?
          <a routerLink="/login">Login</a>
        </p>
      </div>
    </section>
  `,
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
    `
  ]
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
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
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
