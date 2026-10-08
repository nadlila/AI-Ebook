import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {
  finalize,
  map,
  shareReplay,
  switchMap,
  tap,
  catchError,
} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AuthSession,
  LoginRequest,
  RegisterRequest,
} from '../models/auth.model';
interface Session extends AuthSession {
  refreshToken: string;
  expiresAt: number;
  role: 'AUTHOR' | 'READER';
}
interface Config {
  supabaseUrl: string;
  supabasePublishableKey: string;
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly SESSION_KEY = 'thinkerlab-auth-v2';
  private http: HttpClient;
  private config$?: Observable<Config>;
  private refresh$?: Observable<string>;
  constructor(backend: HttpBackend) {
    this.http = new HttpClient(backend);
  }
  private config(): Observable<Config> {
    return (this.config$ ??= this.http
      .get<Config>(`${environment.apiBaseUrl}/config`)
      .pipe(
        map((c) => {
          if (!c.supabasePublishableKey)
            throw new Error(
              'Tambahkan SUPABASE_PUBLISHABLE_KEY di backend/.env, lalu restart backend.',
            );
          return c;
        }),
        shareReplay(1),
      ));
  }
  private save(response: any): Observable<Session> {
    if (!response.access_token)
      return throwError(
        () => new Error('Periksa email untuk konfirmasi akun, lalu login.'),
      );
    return this.http
      .get<{ role: 'AUTHOR' | 'READER' }>(`${environment.apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${response.access_token}` },
      })
      .pipe(
        map((me) => {
          const s: Session = {
            token: response.access_token,
            refreshToken: response.refresh_token,
            expiresAt:
              response.expires_at ??
              Math.floor(Date.now() / 1000) + response.expires_in,
            role: me.role,
            user: {
              id: response.user.id,
              name:
                response.user.user_metadata?.name ||
                response.user.email.split('@')[0],
              email: response.user.email,
            },
          };
          localStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(s));
          return s;
        }),
      );
  }
  login(payload: LoginRequest): Observable<AuthSession> {
    return this.config().pipe(
      switchMap((c) =>
        this.http.post<any>(
          `${c.supabaseUrl}/auth/v1/token?grant_type=password`,
          payload,
          { headers: { apikey: c.supabasePublishableKey } },
        ),
      ),
      switchMap((r) => this.save(r)),
    );
  }
  register(payload: RegisterRequest): Observable<AuthSession> {
    return this.config().pipe(
      switchMap((c) =>
        this.http.post<any>(
          `${c.supabaseUrl}/auth/v1/signup`,
          {
            email: payload.email,
            password: payload.password,
            data: { name: payload.name },
          },
          { headers: { apikey: c.supabasePublishableKey } },
        ),
      ),
      switchMap((r) => this.save(r)),
    );
  }
  token(): Observable<string> {
    const session = this.getSession();
    if (!session) return of('');
    if (session.expiresAt > Date.now() / 1000 + 60) return of(session.token);
    return (this.refresh$ ??= this.config().pipe(
      switchMap((c) =>
        this.http.post<any>(
          `${c.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
          { refresh_token: session.refreshToken },
          { headers: { apikey: c.supabasePublishableKey } },
        ),
      ),
      switchMap((r) => this.save(r)),
      map((s) => s.token),
      catchError((e) => {
        this.logout();
        return throwError(() => e);
      }),
      finalize(() => (this.refresh$ = undefined)),
      shareReplay(1),
    ));
  }
  logout(): void {
    localStorage.removeItem(AuthService.SESSION_KEY);
  }
  isAuthenticated(): boolean {
    return !!this.getSession();
  }
  getSession(): Session | null {
    try {
      const s = JSON.parse(
        localStorage.getItem(AuthService.SESSION_KEY) || 'null',
      );
      return s?.token && s?.refreshToken ? s : null;
    } catch {
      return null;
    }
  }
  getApiBaseUrl(): string {
    return environment.apiBaseUrl;
  }
}
