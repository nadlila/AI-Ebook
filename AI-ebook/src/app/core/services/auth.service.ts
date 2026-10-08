<<<<<<< HEAD
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
=======
import { Injectable } from '@angular/core';
import { createClient, Session } from '@supabase/supabase-js';
import { defer, Observable } from 'rxjs';
>>>>>>> 9a89d1d (menghubungkan backend dan frontend, login dan register menggunakan akun database, page akun)
import { environment } from '../../../environments/environment';
import {
  AuthSession,
  LoginRequest,
<<<<<<< HEAD
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
=======
  RegisterRequest
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey
  );

  private currentSession: AuthSession | null = null;

  constructor() {
    // Hapus session mock lama.
    localStorage.removeItem('ai-ebook-session');

    // Perbarui tampilan saat session dipulihkan, login,
    // logout, atau token diperbarui.
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession = this.mapSession(session);
    });
  }

  login(payload: LoginRequest): Observable<AuthSession> {
    return defer(async () => {
      const { data, error } =
        await this.supabase.auth.signInWithPassword(payload);

      if (error) throw error;

      const session = this.mapSession(data.session);
      if (!session) throw new Error('Session login tidak tersedia.');

      this.currentSession = session;
      return session;
    });
  }

  register(payload: RegisterRequest): Observable<AuthSession | null> {
    return defer(async () => {
      const { data, error } = await this.supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: { name: payload.name }
        }
      });

      if (error) throw error;

      this.currentSession = this.mapSession(data.session);
      return this.currentSession;
    });
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;

    this.currentSession = null;
  }

  async getAccessToken(): Promise<string | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;

    return data.session?.access_token ?? null;
  }

  getSession(): AuthSession | null {
    return this.currentSession;
  }

  async getAccountIdentity() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    const user = data.user;
    const name = user.user_metadata['name'];
    return {
      id: user.id,
      name: typeof name === 'string' ? name : '',
      email: user.email ?? '',
      emailConfirmed: Boolean(user.email_confirmed_at),
      createdAt: user.created_at
    };
  }

  isAuthenticated(): boolean {
    return this.currentSession !== null;
>>>>>>> 9a89d1d (menghubungkan backend dan frontend, login dan register menggunakan akun database, page akun)
  }
  getApiBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  private mapSession(session: Session | null): AuthSession | null {
    if (!session) return null;

    return {
      token: session.access_token,
      user: {
        id: session.user.id,
        name: session.user.user_metadata['name'] ?? '',
        email: session.user.email ?? ''
      }
    };
  }
}
