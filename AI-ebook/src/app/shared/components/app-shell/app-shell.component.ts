import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell', standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell" [class.with-sidebar]="showNavigation">
      <aside class="sidebar" *ngIf="showNavigation">
        <a class="brand" routerLink="/home"><span class="brand-logo"></span><span><strong>ThinkerLab</strong><small>Ebook Library</small></span></a>
        <nav aria-label="Menu utama">
          <a routerLink="/home" routerLinkActive="active" ariaCurrentWhenActive="page"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1Z"/></svg>Home</a>
          <a routerLink="/library" routerLinkActive="active" ariaCurrentWhenActive="page"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h5v16H4zM10 4h5v16h-5zM17 4l4 1-3 15-4-1"/></svg>My Library</a>
          <a routerLink="/drafts" routerLinkActive="active" ariaCurrentWhenActive="page"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4H5a2 2 0 0 0-2 2v14a1 1 0 0 0 1 1h14a2 2 0 0 0 2-2v-9M9 15l1-4L19 2l3 3-9 9-4 1Z"/></svg>My Draft</a>
          <a routerLink="/settings" routerLinkActive="active" ariaCurrentWhenActive="page"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3Z"/><circle cx="10.5" cy="11.5" r="3"/></svg>Setting</a>
        </nav>
        <footer class="sidebar-copyright">&copy; 2026 Penggiat Design</footer>
      </aside>
      <div class="workspace">
        <header class="topbar" *ngIf="showNavigation">
          <form class="search" (submit)="searchBooks(searchInput.value); $event.preventDefault()" role="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
            <input #searchInput type="search" aria-label="Cari ebook" placeholder="Search your ebooks..." [value]="searchQuery" (input)="searchBooks(searchInput.value)" />
          </form>
          <a class="profile-btn" routerLink="/account" aria-label="Buka akun saya" title="Akun saya">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="30" height="30" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="9" r="3"/><path d="M4.5 18.5c2-6 13-6 15 0"/></svg>
          </a>
        </header>
        <main class="page-content"><router-outlet></router-outlet></main>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100dvh;font-family:Inter,-apple-system,sans-serif;color:#1a1a1a}
    .app-shell{min-height:100dvh;background:#f9f8f6}.with-sidebar{display:grid;grid-template-columns:220px minmax(0,1fr);background:#fff}
    .sidebar{position:sticky;top:0;height:100dvh;box-sizing:border-box;border-right:1px solid #e7e4df;padding:30px 20px;background:#f4f3ef;display:flex;flex-direction:column}
    .sidebar-copyright{margin-top:auto;padding-top:24px;text-align:center;font-size:11px;line-height:1.5;color:#888}
    .brand{display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit;padding:0 8px}.brand-logo{width:36px;height:36px;border-radius:50%;background:#cfcec8;flex-shrink:0}.brand strong{font-size:16px}.brand small{display:block;font-size:12px;color:#888;margin-top:4px}
    nav{display:grid;gap:10px;margin-top:48px}nav a{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;text-decoration:none;color:#777;font-size:15px;font-weight:500}nav a svg{flex-shrink:0}nav a:hover{background:#eae8e2}nav a.active{color:#1a1a1a;background:#e5e3dc;font-weight:700}
    .workspace{min-width:0}.topbar{display:flex;align-items:center;gap:24px;padding:20px 36px;background:transparent}.search{display:flex;align-items:center;gap:12px;max-width:720px;flex:1;background:#fff;border:1px solid #d9d5cf;border-radius:12px;padding:0 16px;height:44px}.search:focus-within{outline:2px solid #aaa59a;outline-offset:2px}.search input{width:100%;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:inherit}.profile-btn{margin-left:auto;color:inherit;display:grid;place-items:center;width:42px;height:42px;flex-shrink:0}.with-sidebar .page-content{padding:16px 36px 40px}
    @media(max-width:800px){.with-sidebar{grid-template-columns:170px minmax(0,1fr)}.sidebar{padding:24px 12px}.brand{gap:8px;padding:0}.brand strong{font-size:14px}.topbar{padding:16px 20px}.with-sidebar .page-content{padding:12px 20px 28px}nav a{padding:12px 8px;gap:8px}}
    @media(max-width:540px){.with-sidebar{grid-template-columns:1fr}.sidebar{position:static;height:auto;padding:16px;border-right:0;border-bottom:1px solid #e7e4df}.brand{justify-content:center}nav{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-top:16px}nav a{flex-direction:column;gap:4px;font-size:11px;padding:8px 2px}.topbar{gap:12px;padding:16px}.with-sidebar .page-content{padding:8px 16px 24px}}
  `]
})
export class AppShellComponent {
  private readonly router = inject(Router);
  get showNavigation(): boolean { return ['/home', '/library', '/drafts', '/settings'].includes(this.router.url.split('?')[0].split('#')[0]); }
  get searchQuery(): string { return this.router.parseUrl(this.router.url).queryParams['q'] || ''; }
  searchBooks(query: string): void {
    const path = this.router.url.split('?')[0];
    void this.router.navigate([path === '/drafts' ? '/drafts' : '/library'], { queryParams: { q: query.trim() || null }, replaceUrl: true });
  }
}
