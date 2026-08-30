import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-group" routerLink="/dashboard">
          <div class="brand-logo"></div>
          <div class="brand-text">
            <span class="brand-name">ThinkerLab</span>
            <span class="brand-sub">Ebook Library</span>
          </div>
        </div>

        <div class="topbar-actions">
          <button class="profile-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="page-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
      .app-shell {
        min-height: 100vh;
        background: #ffffff;
        color: #1a1a1a;
        font-family: 'Inter', -apple-system, sans-serif;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 40px;
        background: #f7f7f5;
        border-bottom: 1px solid #eee;
      }
      .brand-group {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
      }
      .brand-logo {
        width: 32px;
        height: 32px;
        background: #ccc;
        border-radius: 50%;
      }
      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
      }
      .brand-name {
        font-weight: 700;
        font-size: 0.9rem;
      }
      .brand-sub {
        font-size: 0.7rem;
        color: #888;
      }
      .profile-btn {
        width: 36px;
        height: 36px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1a1a1a;
      }
      .page-content {
        padding: 0;
      }
    `
  ]
})
export class AppShellComponent {}
