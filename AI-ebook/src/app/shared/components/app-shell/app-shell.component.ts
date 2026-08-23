import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-wrap">
          <span class="brand-mark">Thinkerlab</span>
          <span class="brand-sub">Ebook Library</span>
        </div>
        <button class="profile-button" type="button" aria-label="User profile">◉</button>
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
        color: #1d1d1d;
        font-family: Inter, 'Segoe UI', sans-serif;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 22px 10px 22px;
        background: #F7F7F5;
      }
      .brand-wrap {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }
      .brand-mark {
        font-size: 1.2rem;
        font-weight: 600;
      }
      .brand-sub {
        font-size: 0.72rem;
        color: #6b6b6b;
      }
      .profile-button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 0;
        background: #1f1f1f;
        color: #fff;
        font-size: 1rem;
        cursor: pointer;
      }
      .page-content {
        padding: 16px 24px 32px;
      }
    `
  ]
})
export class AppShellComponent {}
