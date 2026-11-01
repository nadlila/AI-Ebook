import { AuthService } from '../../../../core/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EbookService } from '../../../../core/services/ebook.service';
import {
  DashboardSnapshot,
  EbookSummary,
} from '../../../../core/models/ebook.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="settings-placeholder" *ngIf="view === 'settings'"><h1>Setting</h1><p>Pengaturan akan tersedia di sini.</p></section>
    <ng-container *ngIf="view !== 'settings'">
    <section class="dashboard" [class.home]="view === 'home'" *ngIf="snapshot as data; else loadingTemplate">
      <div class="welcome-block" *ngIf="view === 'home'">
        <h1>Hello,<br />{{ data.userName }}</h1>
        <p class="welcome-caption">Create something new</p>
        <div class="creation-box">
          <span class="creation-label">YOUR AI WRITING COMPANION</span>
          <h2>Turn a topic into an ebook.</h2>
          <p class="home-description">Turn your ideas into ebooks with AI. Explore a topic, shape your chapters, and create a book that makes learning your own.</p>
          <button class="primary-btn create-btn" routerLink="/ebooks/create">Start Creating</button>
        </div>
      </div>
      <section class="recent" *ngIf="view === 'home'" aria-labelledby="recent-title">
        <h3 id="recent-title">Your recent ebook</h3>
        <p class="muted" *ngIf="!newestBooks(data.recentEbooks).length">Your published ebooks will appear here. Create and publish your first ebook to get started.</p>
        <article class="recent-book" *ngFor="let item of newestBooks(data.recentEbooks)">
          <button class="recent-cover" (click)="openEbook(item)" [attr.aria-label]="'View ' + item.title">
            <img *ngIf="item.coverImage; else coverPlaceholder" [src]="item.coverImage" [alt]="item.title" />
            <ng-template #coverPlaceholder><span aria-hidden="true">TL</span></ng-template>
          </button>
          <div class="recent-meta">
            <button class="recent-title" (click)="openEbook(item)">{{ item.title }}</button>
            <p>{{ item.chapterCount }} Chapters <span aria-hidden="true">&middot;</span> {{ isInProgress(item) ? 'Draft' : 'Published' }}</p>
            <button class="recent-action" (click)="isInProgress(item) ? resume(item) : continueReading(item)">{{ isInProgress(item) ? 'Continue Creating' : 'Read Ebook' }} <span aria-hidden="true">&rarr;</span></button>
          </div>
        </article>
      </section>

      <div class="section-card library" *ngIf="view === 'library'">
        <h1 class="page-title">My Library</h1>
        <p *ngIf="!readyBooks(data.recentEbooks).length">{{ searchQuery ? 'Tidak ada ebook yang cocok dengan pencarian.' : 'Belum ada ebook siap dibaca. Selesaikan draft untuk menyimpannya di sini.' }}</p>
        <div class="ebook-grid">
          <article
            class="ebook-item"
            *ngFor="let item of readyBooks(data.recentEbooks)"
            (click)="openEbook(item)"
            tabindex="0"
            (keydown.enter)="openEbook(item)"
          >
            <div class="cover">
              <img *ngIf="item.coverImage; else libraryCoverPlaceholder" [src]="item.coverImage" [alt]="item.title" />
              <ng-template #libraryCoverPlaceholder><div class="no-cover">{{ item.title }}</div></ng-template>
            </div>
            <div class="book-title">{{ item.title }}</div>
            <div class="book-meta">{{ item.chapterCount }} Chapters</div>
            <div class="book-meta" *ngIf="isInProgress(item)">
              {{ item.creationProgress }}% completed
            </div>
            <div class="book-meta" *ngIf="!isInProgress(item)">
              {{ item.readingProgress }}% reading progress
            </div>
            <button
              class="resume-btn"
              *ngIf="isInProgress(item)"
              type="button"
              (click)="$event.stopPropagation(); resume(item)"
            >
              Continue Creating
            </button>
            <button
              class="resume-btn"
              *ngIf="!isInProgress(item)"
              type="button"
              (click)="$event.stopPropagation(); continueReading(item)"
            >
              Continue Reading
            </button>
          </article>
        </div>
      </div>

      <div class="section-card library" *ngIf="view === 'drafts'">
        <h1 class="page-title">My Draft</h1>
        <p *ngIf="!draftBooks(data.recentEbooks).length">{{ searchQuery ? 'Tidak ada draft yang cocok dengan pencarian.' : 'Belum ada draft. Mulai buat ebook pertamamu.' }}</p>
        <div class="ebook-grid">
          <article
            class="ebook-item"
            *ngFor="let item of draftBooks(data.recentEbooks)"
            (click)="openEbook(item)" tabindex="0" (keydown.enter)="openEbook(item)"
          >
            <div class="cover">
              <img *ngIf="item.coverImage; else draftCoverPlaceholder" [src]="item.coverImage" [alt]="item.title" />
              <ng-template #draftCoverPlaceholder><div class="no-cover">{{ item.title }}</div></ng-template>
            </div>
            <div class="book-title">{{ item.title }}</div>
            <div class="book-meta">{{ item.chapterCount }} Chapters</div>
            <progress [value]="item.creationProgress" max="100" aria-label="Progres pembuatan ebook"></progress>
            <details (click)="$event.stopPropagation()"><summary>Tahapan pembuatan</summary><ol>
              <li *ngFor="let stage of creationStages" [style.font-weight]="stage.step === item.currentStep ? '700' : '400'">
                {{ stage.step === item.currentStep ? 'Aktif' : stage.percent < item.creationProgress ? 'Selesai' : 'Belum' }}: {{ stage.label }} ({{ stage.percent }}%)
              </li>
            </ol></details>
            <div class="book-meta">
              {{
                item.status === 'READY_TO_READ' ? 'Reading' : draftStage(item)
              }}
            </div>
            <div class="book-meta">
              {{
                item.status === 'READY_TO_READ'
                  ? item.readingProgress
                  : item.creationProgress
              }}%
            </div>
            <button
              class="resume-btn"
              *ngIf="item.status !== 'READY_TO_READ'"
              type="button"
              (click)="$event.stopPropagation(); resume(item)"
            >
              Continue Creating
            </button>
            <button
              class="resume-btn"
              *ngIf="item.status === 'READY_TO_READ'"
              type="button"
              (click)="$event.stopPropagation(); continueReading(item)"
            >
              Continue Reading
            </button>
          </article>
        </div>
      </div>
    </section>

    <ng-template #loadingTemplate>
      <div class="loading-box">{{ loadError || 'Memuat ebook pribadimu...' }}</div>
    </ng-template>
    </ng-container>
  `,
  styles: [
    `
      .dashboard {
        max-width: 980px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 28px;
      }
      .dashboard.home { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); align-items: start; gap: 48px; padding: 24px 0 32px; }
      .home .welcome-block { padding-top: 24px; }
      .home h1 { font-size: clamp(28px, 3.5vw, 42px); line-height: 1.25; overflow-wrap: anywhere; }
      .welcome-caption { margin: 8px 0 0; color: #777; font-size: 14px; }
      .creation-box { margin-top: 22px; padding: 24px; border: 1px solid #dedbd4; border-radius: 18px; background: linear-gradient(135deg, #f7f6f2, #efede7); }
      .creation-label { font-size: 10px; font-weight: 700; color: #858074; }
      .creation-box h2 { margin: 12px 0 0; font-size: 21px; line-height: 1.35; letter-spacing: -.4px; }
      .home .home-description { margin: 12px 0 0; color: #777; font-size: 14px; line-height: 1.7; }
      .create-btn { margin-top: 20px; padding: 0 20px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px; }
      .recent { border: 1px solid #e5e2dc; border-radius: 18px; padding: 22px; background: #f9f8f6; }
      .recent h3 { font-size: 18px; margin: 0 0 18px; }
      .recent-book { display: flex; gap: 16px; padding: 14px 0; border-top: 1px solid #e5e2dc; }
      .recent-cover { flex: 0 0 62px; height: 84px; border: 0; padding: 0; border-radius: 8px; overflow: hidden; cursor: pointer; background: #1a2b2c; color: #d4ff00; }
      .recent-cover img { width: 100%; height: 100%; object-fit: cover; }
      .recent-meta { min-width: 0; }
      .recent-title { padding: 0; border: 0; background: transparent; text-align: left; color: #1a1a1a; font-weight: 700; font-size: 15px; cursor: pointer; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .recent-meta p { margin: 6px 0 10px; font-size: 12px; color: #777; }
      .recent-action { background: #1d1d1d; color: white; border: 0; border-radius: 8px; padding: 7px 12px; font-size: 12px; cursor: pointer; }
      @media (max-width: 760px) { .dashboard.home { grid-template-columns: 1fr; gap: 28px; padding-top: 0; } .home .welcome-block { padding-top: 0; } .home h1 br { display: none; } }
      .page-title { font-size: 26px; margin: 0 0 24px; }
      .settings-placeholder p { color: #777; }
h1 {
        margin: 0;
        font-size: clamp(2rem, 3vw, 3rem);
      }
.primary-btn,
.primary-btn {
        background: #1d1d1d;
        color: white;
        height: 42px;
      }
.resume-btn {
        margin-top: 12px;
        background: #1d1d1d;
        color: white;
        height: 36px;
        width: 100%;
      }
      .section-card {
        background: #f0f0ee;
        border: 1px solid #e5e5e5;
        border-radius: 18px;
        padding: 18px 18px 24px;
      }
      h3 {
        margin: 0 0 18px;
        font-size: 1.05rem;
      }
.reading-card img {
        width: 128px;
        height: 94px;
        object-fit: cover;
        border-top-left-radius: 0;
        border-top-right-radius: 18px;
        border-bottom-left-radius: 18px;
        border-bottom-right-radius: 0;
      }
.title {
        font-weight: 700;
      }
.ebook-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 18px;
      }
      .ebook-item {
        box-sizing: border-box;
        width: 100%;
        background: #f7f7f5;
        border: 1px solid #d7d2cf;
        border-radius: 0 18px 0 18px;
        overflow: hidden;
        padding: 6px;
        padding-bottom: 12px;
        cursor: pointer;
      }
      .ebook-item img {
        width: 100%;
        height: 180px;
        object-fit: cover;
        border-radius: 0 14px 0 14px;
      }
      .book-title {
        margin: 8px 0 0;
        font-weight: 700;
        font-size: 1.05rem;
        line-height: 1.35;
      }
      .book-meta {
        margin: 5px 0 0;
        color: #666;
        font-size: 0.9rem;
      }
      .resume-btn {
        margin: 12px 0 0;
        background: #1d1d1d;
        color: white;
        height: 38px;
        width: 100%;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }
      .muted {
        color: #666;
      }
      .library .ebook-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 20px;
      }
      .library .ebook-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 12px 14px;
        text-align: center;
      }
      .cover {
        width: min(100%, 130px);
        height: 182px;
        flex-shrink: 0;
        position: relative;
        overflow: hidden;
        background: #eeece7;
        margin-bottom: 12px;
      }
      .cover img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        border-radius: 0;
      }
      .no-cover {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        padding: 14px;
        background: #1a2b2c;
        color: #fff;
        font-size: 14px;
        overflow-wrap: anywhere;
      }
      .library .book-title {
        margin: 0 0 4px;
        font-size: 14px;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
.library .resume-btn {
        margin-top: auto;
        padding: 8px 10px;
        height: auto;
        min-height: 34px;
        font-size: 12px;
      }
      .library .book-meta:last-of-type {
        margin-bottom: 14px;
      }
      @media (max-width: 900px) {
        .library .ebook-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      }
      .loading-box {
        display: flex;
        min-height: 220px;
        align-items: center;
        justify-content: center;
        color: #666;
      }
      @media (max-width: 760px) {
        .ebook-grid {
          grid-template-columns: repeat(2, minmax(140px, 1fr));
        }
      }
    `,
  ],
})
export class DashboardPageComponent implements OnInit {
  snapshot: DashboardSnapshot | null = null;
  loadError = '';

  constructor(
    private readonly ebookService: EbookService,
    readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  get view(): string { return this.route.snapshot.data['view'] || 'home'; }
  get searchQuery(): string { return this.route.snapshot.queryParamMap.get('q') || ''; }
  private matchesSearch(item: EbookSummary): boolean {
    const query = (this.route.snapshot.queryParamMap.get('q') || '').toLocaleLowerCase();
    return item.title.toLocaleLowerCase().includes(query);
  }
  ngOnInit(): void {
    if (this.view === 'settings') return;
    this.ebookService.getDashboardSnapshot().subscribe({
      next: snapshot => { this.snapshot = snapshot; },
      error: () => { this.loadError = 'Daftar ebook belum dapat dimuat. Periksa koneksi backend lalu muat ulang halaman.'; }
    });
  }

  newestBooks(items: EbookSummary[]): EbookSummary[] {
    return items.filter(item => item.status === 'READY_TO_READ')
      .sort((a, b) => (b.createdAt || b.updatedAt).localeCompare(a.createdAt || a.updatedAt)).slice(0, 3);
  }

  isInProgress(item: EbookSummary): boolean {
    return item.status !== 'READY_TO_READ';
  }

  readyBooks(items: EbookSummary[]): EbookSummary[] {
    return items.filter((item) => item.status === 'READY_TO_READ' && this.matchesSearch(item));
  }

  draftBooks(items: EbookSummary[]): EbookSummary[] {
    return items.filter((item) => item.status !== 'READY_TO_READ' && this.matchesSearch(item));
  }

  readonly creationStages = [
    {step: 'LEARNING_PREFERENCES', label: 'Preferensi belajar', percent: 10},
    {step: 'RESEARCH', label: 'Riset', percent: 20},
    {step: 'SOURCE_REVIEW', label: 'Pilih sumber', percent: 30},
    {step: 'LEARNING_PLAN', label: 'Rencana belajar', percent: 40},
    {step: 'OUTLINE', label: 'Calon bab', percent: 50},
    {step: 'OUTLINE_APPROVAL', label: 'Outline final', percent: 60},
    {step: 'GENERATION', label: 'Penulisan bab', percent: 65},
    {step: 'EDITOR', label: 'Editor', percent: 80},
    {step: 'QUALITY_CHECK', label: 'Pemeriksaan kualitas', percent: 90},
    {step: 'DETAIL', label: 'Review akhir', percent: 95},
    {step: 'READER', label: 'Dipublikasikan', percent: 100},
  ];
  draftStage(item: EbookSummary): string {
    const stages: Record<string, string> = {
      BASIC_INFORMATION: 'Creation',
      CREATE_EBOOK: 'Creation',
      LEARNING_PREFERENCES: 'Preferensi belajar tersimpan',
      RESEARCH: 'Siap riset / tambah sumber',
      SOURCE_REVIEW: 'Tinjau dan pilih sumber',
      LEARNING_PLAN: 'Susun rencana belajar',
      OUTLINE: 'Pilih dan urutkan calon bab',
      OUTLINE_APPROVAL: 'Tinjau outline final',
      GENERATION: 'Lanjutkan penulisan bab',
      EDITOR: 'Edit konten',
      QUALITY_CHECK: 'Pemeriksaan kualitas',
      DETAIL: 'Review akhir dan publikasi',
    };
    return stages[item.currentStep] || 'Creation';
  }

  resume(item: EbookSummary): void {
    const route = this.ebookService.getResumeRoute({
      id: item.id,
      currentStep: item.currentStep,
    });
    this.router.navigateByUrl(route);
  }

  continueReading(item: EbookSummary): void {
    this.router.navigate(['/ebooks', item.id, 'reader']);
  }

  openEbook(item: EbookSummary): void {
    this.router.navigate(['/ebooks', item.id, 'detail']);
  }
}
