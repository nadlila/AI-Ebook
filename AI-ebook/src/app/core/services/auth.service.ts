import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthSession, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly SESSION_KEY = 'ai-ebook-session';

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<AuthSession> {
    const mockSession: AuthSession = {
      token: 'mock-token-for-local-dev',
      user: {
        id: 'user-001',
        name: 'Nadila',
        email: payload.email
      }
    };

    localStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(mockSession));

    return of(mockSession).pipe(delay(300));
  }

  register(payload: RegisterRequest): Observable<AuthSession> {
    const mockSession: AuthSession = {
      token: 'mock-token-for-local-dev',
      user: {
        id: 'user-002',
        name: payload.name,
        email: payload.email
      }
    };

    localStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(mockSession));

    return of(mockSession).pipe(delay(300));
  }

  logout(): void {
    localStorage.removeItem(AuthService.SESSION_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getSession();
  }

  getSession(): AuthSession | null {
    const rawSession = localStorage.getItem(AuthService.SESSION_KEY);
    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      return null;
    }
  }

  getApiBaseUrl(): string {
    return environment.apiBaseUrl;
  }
}
