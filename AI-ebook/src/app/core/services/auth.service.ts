import { Injectable } from '@angular/core';
import { createClient, Session } from '@supabase/supabase-js';
import { defer, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthSession,
  LoginRequest,
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

  async restoreSession(): Promise<AuthSession | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    this.currentSession = this.mapSession(data.session);
    return this.currentSession;
  }

  token(): Observable<string | null> {
    return defer(() => this.getAccessToken());
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
