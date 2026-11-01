import { StockCoverComponent } from './stock-cover.component';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Ebook } from '../../../../../core/models/ebook.model';
import { EbookService } from '../../../../../core/services/ebook.service';

@Component({
  selector: 'app-ebook-detail-page',
  standalone: true,
  imports: [CommonModule, StockCoverComponent],
  template: `
    <section class="page-shell" *ngIf="ebook; else loading">
      <div class="main-container">
        <!-- Breadcrumb -->
        <header class="detail-header">
          <button class="btn-back" (click)="goBack()">
            <span class="icon">←</span> Back to Home
          </button>
          <div class="ebook-menu" (click)="$event.stopPropagation()"
            (keydown.escape)="moreMenuOpen = false; moreButton.focus()">
            <button #moreButton type="button" class="btn-more" aria-label="Opsi ebook"
              aria-controls="ebook-actions" [attr.aria-expanded]="moreMenuOpen"
              (click)="moreMenuOpen = !moreMenuOpen"
              [disabled]="deleting || saving || uploadingCover">
              <span aria-hidden="true">&#8942;</span>
            </button>
            <div id="ebook-actions" class="ebook-dropdown" *ngIf="moreMenuOpen">
              <button type="button" class="delete-option" (click)="deleteEbook(); moreButton.focus()"
                [disabled]="deleting || saving || uploadingCover">Hapus</button>
            </div>
          </div>
        </header>

        <div class="detail-layout">
          <!-- Left: Book Cover Sidebar -->
          <aside class="cover-sidebar">
            <div class="book-cover-card">
              <img
                [src]="ebook.coverImage"
                *ngIf="ebook.coverImage"
                class="cover-img-bg" [alt]="ebook.title"
              />
              <div class="cover-overlay" *ngIf="!ebook.coverImage">
                <div class="badge">THINKERLAB EBOOK</div>
                <h2 class="cover-title">{{ ebook.title }}</h2>
              </div>
            </div>
          </aside>

          <!-- Right: Book Info -->
          <main class="info-content">
            <div class="status-badge">
              {{ ebook.status === 'READY_TO_READ' ? 'Ebook' : 'Preview' }}
            </div>
            <h1 class="book-title">{{ ebook.title }}</h1>
            <p class="book-subtitle">
              {{
                ebook.description ||
                  'Belum ada deskripsi.'
              }}
            </p>

            <p *ngIf="actionError" role="alert">{{ actionError }}</p>
            <div class="action-buttons" [attr.inert]="deleting ? '' : null">
              <button class="btn-read" (click)="startReading()" [disabled]="!ebook.editorContent?.length">
                Read Ebook
              </button>
              <button class="btn-outline" disabled title="Audio belum tersedia">
                <span class="icon">▶</span> Listen
              </button>
              <button
                class="btn-outline"
                *ngIf="ebook.status !== 'READY_TO_READ'"
                (click)="editEbook()"
              >
                Edit Ebook
              </button>
              <button
                class="btn-outline"
                *ngIf="ebook.status !== 'READY_TO_READ'"
                (click)="coverMenu = true"
                [disabled]="uploadingCover || saving"
              >
                {{ uploadingCover ? 'Mengunggah cover...' : 'Upload / Ganti cover' }}
              </button>
              <input
                #coverInput
                type="file"
                accept="image/jpeg,image/png"
                hidden
                (change)="changeCover($event)"
              />
              <button
                class="btn-publish"
                *ngIf="ebook.status !== 'READY_TO_READ'"
                (click)="publishEbook()"
                [disabled]="saving || uploadingCover || !ebook.editorContent?.length"
              >
                Publish
              </button>
            </div>
            <div
              class="cover-modal"
              *ngIf="coverMenu"
              (click)="coverMenu = false"
            >
              <div class="cover-dialog" (click)="$event.stopPropagation()">
                <h3>Choose a cover</h3>
                <p>Pilih JPG atau PNG maksimal 2 MB dan 16 megapiksel. Gambar akan diperkecil untuk cover.</p>
                <button
                  type="button"
                  (click)="coverInput.click(); coverMenu = false"
                >
                  Upload from computer
                </button>
                <button
                  type="button"
                  (click)="stockCoverOpen = true; coverMenu = false"
                >
                  Cari gambar sesuai topik
                </button>
                <button
                  type="button"
                  class="cancel"
                  (click)="coverMenu = false"
                >
                  Cancel
                </button>
              </div>
            </div>

            <app-stock-cover *ngIf="stockCoverOpen" [ebookId]="ebook.id" [ebookTitle]="ebook.title" [saving]="uploadingCover" [saveError]="actionError"
              (closed)="stockCoverOpen = false" (coverChosen)="persistCover($event)"></app-stock-cover>
          </main>
        </div>

        <div class="book-details">
        <!-- Chapters Section -->
        <section class="chapters-section">
          <div class="section-card">
            <div class="section-header">
              <h3>Chapters</h3>
              <p>Jelajahi isi dan topik yang dibahas dalam ebook ini.</p>
            </div>

            <p *ngIf="!chapterList.length">Chapter belum tersedia.</p>
            <div class="chapter-list">
              <div
                class="chapter-row"
                *ngFor="let chapter of chapterList; let i = index"
              >
                <div class="chap-index">
                  {{ (i + 1).toString().padStart(2, '0') }}
                </div>
                <div class="chap-info">
                  <h4>{{ chapter.title }}</h4>

                </div>
                <div class="chap-action">
                  <button class="btn-open-link" (click)="startReading()">
                    Open →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <aside class="ebook-facts" aria-label="Informasi ebook">
            <div class="stats-row">
              <div class="stat-box">
                <span class="stat-label">Total chapters</span>
                <span class="stat-value"
                  >{{ chapterList.length || ebook.chapterCount }} chapters</span
                >
              </div>
              <div class="stat-box">
                <span class="stat-label">Reading time</span>
                <span class="stat-value"
                  >~ {{ estimatedReadingTime }}</span
                >
              </div>
              <div class="stat-box">
                <span class="stat-label">Language</span>
                <span class="stat-value">{{ ebook.language || 'Belum ditentukan' }}</span>
              </div>
            </div>
        </aside>
        </div>
      </div>
    </section>

    <ng-template #loading>
      <div class="loading-state">{{ loadError || 'Memuat detail ebook...' }}</div>
    </ng-template>
  `,
  styles: [`
.page-shell{box-sizing:border-box;min-height:calc(100dvh);background:#f9f8f6;padding:16px 24px 24px;color:#1a1a1a}
.main-container{max-width:880px;margin:auto}
.detail-header,.action-buttons,.chapter-row{display:flex;align-items:center;gap:12px}
.detail-header{justify-content:space-between;margin-bottom:16px}
button{font:inherit;cursor:pointer}button:disabled{opacity:.5;cursor:not-allowed}
.btn-back,.btn-open-link{border:0;background:transparent;color:#666;padding:8px 0}
.ebook-menu{position:relative}.btn-more{width:36px;height:36px;font-size:23px;border:1px solid #e0ddd9;border-radius:12px;background:white}
.ebook-dropdown{position:absolute;right:0;top:44px;z-index:10;min-width:150px;padding:6px;border:1px solid #e0ddd9;border-radius:12px;background:white;box-shadow:0 8px 24px #0002}
.delete-option{width:100%;padding:12px;border:0;border-radius:8px;background:white;color:#b42318;text-align:left}.delete-option:hover,.delete-option:focus-visible{background:#fff1f0}
.detail-layout{display:grid;grid-template-columns:150px minmax(0,1fr);gap:36px;max-width:680px;margin:auto;padding:0 24px}
.book-cover-card{position:relative;aspect-ratio:3/4.2;border-radius:10px;overflow:hidden;background:linear-gradient(135deg,#1a2b2c,#0d1516);box-shadow:0 12px 24px #0002}
.cover-img-bg{width:100%;height:100%;object-fit:cover}.cover-overlay{position:absolute;inset:0;padding:24px;display:flex;flex-direction:column;justify-content:flex-end;color:white}.badge{font-size:10px;letter-spacing:1.5px;color:#d4ff00}.cover-title{font-size:26px;overflow-wrap:anywhere}
.info-content{display:flex;flex-direction:column;min-width:0;padding-top:6px}.status-badge{font-weight:700;color:#555;font-size:13px;margin-bottom:8px}.book-title{font-size:clamp(24px,2.5vw,32px);line-height:1.15;letter-spacing:-.7px;margin:0 0 12px;overflow-wrap:anywhere}.book-subtitle{color:#666;font-size:13px;line-height:1.6;margin:0 0 16px;white-space:pre-line}
.action-buttons{flex-wrap:wrap;margin-top:auto;padding-top:12px}.btn-read,.btn-outline,.btn-publish{border:1px solid #e0ddd9;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:600;background:white}.btn-read{background:#1a1a1a;color:white;border-color:#1a1a1a}.btn-publish{background:#2f8f5b;color:white}
.book-details{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:36px;margin-top:24px;padding:20px 24px;border-top:1px solid #e0ddd9;background:white;border-radius:0 0 20px 20px}h3{margin:0 0 8px;font-size:15px}.section-header p{font-size:13px;color:#777;line-height:1.5;margin:0 0 10px}.chapter-list{max-height:clamp(88px,calc(100dvh - 450px),280px);overflow-y:auto;scrollbar-width:thin;padding-right:8px}.chapter-row{padding:10px 0;border-top:1px solid #eeece8}.chap-index{color:#999;font-size:13px;width:28px;flex-shrink:0}.chap-info{flex:1;min-width:0}.chap-info h4{margin:0;font-size:13px;line-height:1.5;overflow-wrap:anywhere}.btn-open-link{font-size:12px}
.stats-row{display:grid;gap:16px;margin-top:16px}.stat-box{display:grid;gap:5px}.stat-label{color:#777;font-size:12px}.stat-value{font-size:14px;font-weight:600}
.cover-modal{position:fixed;inset:0;z-index:20;display:grid;place-items:center;background:#0006}.cover-dialog{width:min(80vw,360px);padding:24px;border-radius:16px;background:white}.cover-dialog p{color:#666;font-size:13px}.cover-dialog button{width:100%;padding:12px;margin-top:8px;border:1px solid #ddd;border-radius:9px;background:white}.loading-state{padding:80px 24px;text-align:center}
@media(max-width:760px){.detail-layout{grid-template-columns:150px minmax(0,1fr);gap:24px;padding:0}.book-details{grid-template-columns:minmax(0,1fr) 180px;gap:28px;padding:24px}.info-content{padding-top:0}}
@media(max-width:540px){.page-shell{padding:20px 16px 40px}.detail-header{margin-bottom:24px}.detail-layout,.book-details{grid-template-columns:1fr;gap:28px}.cover-sidebar{width:min(48vw,180px);margin:auto}.chapter-list{max-height:none;overflow:visible}.book-details{padding:24px 20px;margin-top:28px}.ebook-facts{border-top:1px solid #eeece8;padding-top:24px}.stats-row{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}}
`],
})
export class EbookDetailPageComponent implements OnInit {
  moreMenuOpen = false;

  @HostListener('document:click')
  closeMoreMenu(): void {
    this.moreMenuOpen = false;
  }

  coverMenu = false;
  uploadingCover = false;
  deleting = false;
  actionError = '';
  saving = false;
  loadError = '';

  deleteEbook(): void {
    this.moreMenuOpen = false;
    if (!this.ebook || this.deleting || this.saving || this.uploadingCover) return;
    if (!window.confirm(`Hapus ebook "${this.ebook.title}"? Semua isi dan progres baca akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`)) return;
    this.deleting = true;
    this.actionError = '';
    this.ebookService.deleteEbook(this.ebook.id).subscribe({
      next: () => { void this.router.navigate(['/dashboard']); },
      error: error => {
        this.deleting = false;
        this.actionError = error.error?.detail || 'Ebook gagal dihapus. Silakan coba lagi.';
      }
    });
  }
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  ebook: Ebook | undefined;
  chapterList: Array<{ title: string }> = [];

  get estimatedReadingTime(): string {
    if (this.ebook?.readingTime) return this.ebook.readingTime;
    const targetWords = this.ebook?.contentLength === 'Long' ? 6000
      : this.ebook?.contentLength === 'Medium' ? 4000 : 2000;
    return `${Math.ceil(targetWords / 200)} menit`;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService.getEbookById(id).subscribe({ next: (result) => {
      this.ebook = result;
      this.chapterList =
        result?.editorContent?.map((chapter) => ({ title: chapter.title })) ??
        [];
    }, error: () => { this.loadError = 'Ebook tidak tersedia atau gagal dimuat. Kembali ke Home.'; } });
  }

  startReading(): void {
    if (this.ebook?.id) {
      this.router.navigate(['/ebooks', this.ebook.id, 'reader']);
    }
  }

  editEbook(): void {
    if (this.ebook?.id) {
      this.router.navigate(['/ebooks', this.ebook.id, 'editor']);
    }
  }

  changeCover(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.ebook || this.uploadingCover || this.saving) return;
    this.actionError = '';
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      this.actionError = 'Pilih gambar JPG/PNG maksimal 2 MB.';
      return;
    }
    this.persistCover(file);
  }
  persistCover(file: File): void {
    if (!this.ebook || this.uploadingCover || this.saving) return;
    this.actionError = '';
    this.uploadingCover = true;
    this.ebookService.uploadCover(this.ebook.id, file).subscribe({
      next: updated => { this.ebook = updated; this.uploadingCover = false; this.stockCoverOpen = false; },
      error: error => {
        this.uploadingCover = false;
        this.actionError = error.status === 413 ? 'Ukuran file terlalu besar. Maksimal 2 MB.'
          : error.error?.detail || 'Cover belum berhasil diunggah. Periksa koneksi lalu coba lagi.';
      }
    });
  }
  stockCoverOpen = false;

  publishEbook(): void {
    if (!this.ebook) return;
    if (
      !window.confirm(
        'Saya sudah membaca isi ebook, memeriksa fakta dan sumbernya, serta menyetujui versi ini untuk disimpan di library pribadi saya.',
      )
    )
      return;
    if (this.saving || this.uploadingCover) return;
    this.saving = true;
    this.actionError = '';
    this.ebookService.finalizeEbook(this.ebook.id).subscribe({
      next: updated => { this.ebook = updated; this.saving = false; },
      error: error => { this.saving = false; this.actionError = error.error?.detail || 'Belum tersimpan. Jalankan pemeriksaan struktur di editor lalu coba lagi.'; }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
