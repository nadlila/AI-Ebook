import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { defer, forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface AccountAccess {
  id: string;
  role: 'AUTHOR' | 'READER';
}

type Account = Awaited<ReturnType<AuthService['getAccountIdentity']>> & AccountAccess;

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.css'
})
export class AccountPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  account: Account | null = null;
  loading = false;
  sessionExpired = false;
  errorMessage = '';
  logoutError = '';
  signingOut = false;

  ngOnInit(): void {
    this.loadAccount();
  }

  loadAccount(): void {
    if (this.loading) return;
    this.loading = true;
    this.account = null;
    this.errorMessage = '';
    this.sessionExpired = false;

    forkJoin({
      access: this.http.get<AccountAccess>(`${environment.apiBaseUrl}/auth/me`),
      identity: defer(() => this.auth.getAccountIdentity())
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ access, identity }) => {
        this.loading = false;
        if (access.id !== identity.id) {
          this.sessionExpired = true;
          this.errorMessage = 'Sesi akun berubah. Silakan login kembali.';
          return;
        }
        this.account = { ...identity, ...access };
      },
      error: (error: unknown) => {
        this.loading = false;
        const status = error instanceof HttpErrorResponse ? error.status
          : (error as { status?: number } | null)?.status;
        const name = (error as { name?: string } | null)?.name;
        this.sessionExpired = status === 401 || status === 403 || name === 'AuthSessionMissingError';
        this.errorMessage = this.sessionExpired
          ? 'Sesi login tidak tersedia atau sudah berakhir. Silakan login kembali.'
          : 'Informasi akun belum dapat dimuat. Periksa koneksi lalu coba lagi.';
      }
    });
  }

  async logout(): Promise<void> {
    if (this.signingOut) return;
    this.signingOut = true;
    this.logoutError = '';
    try {
      await this.auth.logout();
      this.account = null;
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch {
      this.logoutError = 'Belum berhasil keluar. Periksa koneksi dan coba lagi.';
    } finally {
      this.signingOut = false;
    }
  }
}
