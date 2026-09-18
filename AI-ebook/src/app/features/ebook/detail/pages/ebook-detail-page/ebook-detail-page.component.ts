import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Ebook } from '../../../../../core/models/ebook.model';
import { EbookService } from '../../../../../core/services/ebook.service';

@Component({
  selector: 'app-ebook-detail-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-shell" *ngIf="ebook; else loading">
      <div class="main-container">
        <!-- Breadcrumb -->
        <header class="detail-header">
          <button class="btn-back" (click)="goBack()">
            <span class="icon">←</span> Back to dashboard
          </button>
        </header>

        <div class="detail-layout">
          <!-- Left: Book Cover Sidebar -->
          <aside class="cover-sidebar">
            <div class="book-cover-card">
              <img [src]="ebook.coverImage" *ngIf="ebook.coverImage" class="cover-img-bg">
              <div class="cover-overlay">
                <div class="badge">THINKERLAB EBOOK</div>
                <h2 class="cover-title">{{ ebook.title }}</h2>
              </div>
            </div>
          </aside>

          <!-- Right: Book Info -->
          <main class="info-content">
            <div class="status-badge">{{ ebook.status === 'READY_TO_READ' ? 'Ready to read' : 'Draft' }}</div>
            <h1 class="book-title">{{ ebook.title }}</h1>
            <p class="book-subtitle">{{ ebook.description || 'A practical guide to designing with AI as part of the product system.' }}</p>

            <div class="action-buttons">
              <button class="btn-read" (click)="startReading()">Read Ebook</button>
              <button class="btn-outline">
                <span class="icon">▶</span> Listen
              </button>
              <button class="btn-outline" *ngIf="ebook.status !== 'READY_TO_READ'" (click)="editEbook()">Edit Ebook</button>
              <button class="btn-outline" *ngIf="ebook.status !== 'READY_TO_READ'" (click)="coverMenu = true">Cover</button>
              <input #coverInput type="file" accept="image/*" hidden (change)="changeCover($event)" />
              <button class="btn-publish" *ngIf="ebook.status !== 'READY_TO_READ'" (click)="publishEbook()">Publish</button>
              <button type="button" class="btn-more" aria-label="Delete ebook" aria-haspopup="dialog" (click)="deleteError = ''; deleteDialog.showModal()">•••</button>
            </div>
            <dialog #deleteDialog class="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description">
              <h3 id="delete-title">Delete ebook?</h3>
              <p id="delete-description">“{{ ebook.title }}” will be removed from your collection. This cannot be undone.</p>
              <p *ngIf="deleteError" role="alert">{{ deleteError }}</p>
              <div class="delete-actions">
                <button type="button" class="btn-outline" autofocus (click)="deleteDialog.close()">Cancel</button>
                <button type="button" class="btn-delete" (click)="deleteEbook()">Delete Ebook</button>
              </div>
            </dialog>
            <div class="cover-modal" *ngIf="coverMenu" (click)="coverMenu = false">
              <div class="cover-dialog" (click)="$event.stopPropagation()">
                <h3>Choose a cover</h3><p>Select how you want to add your book cover.</p>
                <button type="button" (click)="coverInput.click(); coverMenu = false">Upload from computer</button>
                <button type="button" (click)="generateCover(); coverMenu = false">Generate with AI</button>
                <button type="button" class="cancel" (click)="coverMenu = false">Cancel</button>
              </div>
            </div>

            <div class="stats-row">
              <div class="stat-box">
                <span class="stat-label">Chapters</span>
                <span class="stat-value">{{ ebook.chapterCount }} chapters</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Reading time</span>
                <span class="stat-value">~ {{ ebook.readingTime || '35 min' }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Audio</span>
                <span class="stat-value">TTS available</span>
              </div>
            </div>
          </main>
        </div>

        <!-- Chapters Section -->
        <section class="chapters-section">
          <div class="section-card">
            <div class="section-header">
              <h3>Chapters</h3>
              <p>Review the structure or open a chapter to edit its content.</p>
            </div>

            <div class="chapter-list">
              <div class="chapter-row" *ngFor="let chapter of chapterList; let i = index">
                <div class="chap-index">{{ (i + 1).toString().padStart(2, '0') }}</div>
                <div class="chap-info">
                  <h4>{{ chapter.title }}</h4>
                  <p>This chapter introduces the topic and establishes the context for the rest of the ebook. A practical guide to designing with AI as part of the product system.</p>
                </div>
                <div class="chap-action">
                  <button class="btn-open-link" (click)="startReading()">Open →</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>

    <ng-template #loading>
      <div class="loading-state">Loading book details...</div>
    </ng-template>
  `,
  styles: [
    `
      .page-shell {
        min-height: 100vh;
        background-color: #f9f8f6;
        padding: 40px 20px;
        color: #1a1a1a;
      }

      .main-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .detail-header {
        margin-bottom: 40px;
      }

      .btn-back {
        background: transparent;
        border: none;
        color: #666;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
      }

      .detail-layout {
        display: flex;
        gap: 60px;
        margin-bottom: 60px;
        align-items: flex-start;
      }

      .cover-sidebar {
        flex: 0 0 320px;
      }

      .book-cover-card {
        position: relative;
        width: 100%;
        aspect-ratio: 3/4.2;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 30px 60px rgba(0,0,0,0.12);
        background: linear-gradient(135deg, #1a2b2c 0%, #0d1516 100%);
      }

      .cover-img-bg {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.6;
      }

      .cover-overlay {
        position: absolute;
        inset: 0;
        padding: 32px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        color: white;
        background: linear-gradient(transparent 40%, rgba(0,0,0,0.8));
      }

      .badge {
        font-size: 0.7rem;
        font-weight: 900;
        letter-spacing: 1.5px;
        margin-bottom: 16px;
        color: #d4ff00;
      }

      .cover-title {
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
        letter-spacing: -0.5px;
      }

      .info-content {
        flex: 1;
      }

      .status-badge {
        font-size: 0.8rem;
        color: #888;
        margin-bottom: 16px;
        font-weight: 500;
      }

      .book-title {
        font-size: 3.5rem;
        font-weight: 800;
        margin: 0 0 20px;
        letter-spacing: -2px;
        line-height: 1.1;
      }

      .book-subtitle {
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 40px;
        line-height: 1.5;
        max-width: 650px;
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        margin-bottom: 60px;
        align-items: center;
      }

      .btn-read {
        background: #1a1a1a;
        color: white;
        border: none;
        padding: 14px 32px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        font-size: 1rem;
      }

      .btn-outline {
        background: white;
        color: #1a1a1a;
        border: 1px solid #e0ddd9;
        padding: 14px 32px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1rem;
      }
      .btn-publish { border:0; border-radius:10px; padding:0 18px; height:40px; background:#2f8f5b; color:#fff; font-weight:700; cursor:pointer; }
      .cover-modal { position:fixed; inset:0; z-index:20; display:grid; place-items:center; background:rgba(0,0,0,.35); }
      .cover-dialog { width:min(90vw,360px); padding:24px; border-radius:16px; background:#fff; box-shadow:0 18px 50px rgba(0,0,0,.2); }
      .cover-dialog h3 { margin:0 0 6px; }.cover-dialog p { color:#666; font-size:13px; margin:0 0 18px; }
      .cover-dialog button { width:100%; height:42px; margin-top:9px; border:1px solid #ddd; border-radius:9px; background:#fff; font-weight:700; cursor:pointer; }
      .cover-dialog button:first-of-type { background:#1d1d1d; color:#fff; }.cover-dialog .cancel { border:0; color:#777; }

      .delete-dialog { width:min(400px,calc(100vw - 48px)); box-sizing:border-box; border:1px solid #dedad7; border-radius:16px; padding:24px; color:#222; background:#fff; }
      .delete-dialog::backdrop { background:rgba(0,0,0,.4); }
      .delete-dialog h3 { margin:0 0 12px; }
      .delete-dialog p { line-height:1.5; overflow-wrap:anywhere; }
      .delete-actions { display:flex; justify-content:flex-end; flex-wrap:wrap; gap:10px; margin-top:24px; }
      .btn-delete { border:0; border-radius:10px; padding:12px 18px; background:#b42318; color:#fff; font-weight:700; cursor:pointer; }
      .btn-more {
        background: transparent;
        border: 1px solid #e0ddd9;
        color: #1a1a1a;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stats-row {
        display: flex;
        gap: 24px;
      }

      .stat-box {
        background: white;
        border: 1px solid #e0ddd9;
        padding: 24px;
        border-radius: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stat-label {
        font-size: 0.8rem;
        color: #999;
        font-weight: 600;
      }

      .stat-value {
        font-weight: 700;
        font-size: 1.1rem;
      }

      .chapters-section {
        margin-top: 20px;
      }

      .section-card {
        background: white;
        border: 1px solid #e0ddd9;
        border-radius: 24px;
        padding: 40px;
      }

      .section-header {
        margin-bottom: 40px;
      }

      .section-header h3 {
        font-size: 1.5rem;
        font-weight: 800;
        margin: 0 0 10px;
      }

      .section-header p {
        font-size: 1rem;
        color: #777;
        margin: 0;
      }

      .chapter-row {
        display: flex;
        align-items: center;
        padding: 32px 0;
        border-top: 1px solid #f0f0f0;
        gap: 30px;
      }

      .chap-index {
        width: 48px;
        height: 48px;
        background: #f5f5f5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        font-weight: 800;
        color: #bbb;
      }

      .chap-info {
        flex: 1;
      }

      .chap-info h4 {
        margin: 0 0 6px;
        font-size: 1.2rem;
        font-weight: 700;
      }

      .chap-info p {
        margin: 0;
        font-size: 0.95rem;
        color: #888;
        line-height: 1.6;
        max-width: 900px;
      }

      .btn-open-link {
        background: transparent;
        border: none;
        color: #1a1a1a;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        padding: 10px;
      }

      .loading-state {
        padding: 100px;
        text-align: center;
        font-weight: 500;
      }

      @media (max-width: 1024px) {
        .detail-layout { flex-direction: column; gap: 40px; }
        .cover-sidebar { margin: 0 auto; width: 300px; }
        .stats-row { flex-direction: column; }
        .book-title { font-size: 2.5rem; }
      }
    `
  ]
})
export class EbookDetailPageComponent implements OnInit {
  coverMenu = false;
  deleteError = '';

  deleteEbook(): void {
    if (!this.ebook) return;
    try {
      this.ebookService.deleteEbook(this.ebook.id);
      this.router.navigate(['/dashboard']);
    } catch {
      this.deleteError = 'Unable to delete this ebook. Please try again.';
    }
  }
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  ebook: Ebook | undefined;
  chapterList: Array<{ title: string }> = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService.getEbookById(id).subscribe((result) => {
      this.ebook = result;
      this.chapterList = result?.editorContent?.map((chapter) => ({ title: chapter.title })) ?? [];

      if (this.chapterList.length === 0) {
        this.chapterList = [
          { title: 'Introduction' },
          { title: 'Understanding the Context' },
          { title: 'Designing for Interactions' },
          { title: 'The Future of AI Products' }
        ];
      }
    });
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
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.ebook) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result);
      this.ebookService.updateCover(this.ebook!.id, image).subscribe((updated) => {
        if (updated) this.ebook = updated;
      });
    };
    reader.readAsDataURL(file);
  }

  generateCover(): void {
    if (!this.ebook) return;
    const seed = encodeURIComponent(`${this.ebook.id}-${Date.now()}`);
    const image = `https://picsum.photos/seed/${seed}/600/900`;
    this.ebookService.updateCover(this.ebook.id, image).subscribe((updated) => { if (updated) this.ebook = updated; });
  }

  publishEbook(): void {
    if (!this.ebook) return;
    this.ebookService.finalizeEbook(this.ebook.id).subscribe((updated) => {
      if (updated) this.ebook = updated;
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
