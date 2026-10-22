import { InlineTextDirective } from '../../../../shared/directives/inline-text.directive';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorChapterContent } from '../../../../core/models/ebook.model';
import { EbookService } from '../../../../core/services/ebook.service';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [CommonModule, InlineTextDirective],
  template: `
    <div class="editor-container">
      <header class="editor-header">
        <button class="header-btn" (click)="goBack()">Project</button>
        <button class="header-btn" (click)="saveDraft()" [disabled]="saving || !chapters.length">Simpan draft</button>
        <h1 class="book-title">{{ bookTitle }}</h1>
        <button class="header-btn save-btn" (click)="saveAndContinue()" [disabled]="saving || !chapters.length">
          {{ saving ? 'Menyimpan...' : 'Simpan dan lanjutkan' }}
        </button>
      </header>

      <p role="status">Jumlah kata aktual: {{ actualWords | number }} / target {{ targetWords | number }} kata
        (rentang {{ minWords | number }}-{{ maxWords | number }}).
        {{ actualWords < minWords ? 'Masih di bawah target.' : actualWords > maxWords ? 'Melebihi target.' : 'Sesuai rentang target.' }}
      </p>
      <p role="status">{{ draftMessage }}</p>
      <p role="alert" *ngIf="errorMessage">{{ errorMessage }}</p>
      <div class="editor-layout">
        <!-- Content Sidebar -->
        <aside class="sidebar left-sidebar">
          <h2>Content</h2>
          <div class="chapter-list">
            <div
              *ngFor="let chapter of chapters; let i = index"
              class="chapter-item"
              [class.active]="selectedIndex === i"
              (click)="selectedIndex = i"
            >
              <span class="chapter-number">{{
                (i + 1).toString().padStart(2, '0')
              }}</span>
              <span class="chapter-name">{{ chapter.title }}</span>
            </div>
          </div>
        </aside>

        <!-- Editor Main -->
        <main class="editor-main">
          <div class="page-content" *ngIf="selectedChapter">
            <h2 class="chapter-title inline-editable" [(appInlineText)]="selectedChapter.title"
              [inlineDisabled]="saving" aria-label="Judul bab" data-placeholder="Judul bab"></h2>
            <p class="edit-hint">Klik teks untuk mengedit langsung. Perubahan disimpan saat memilih Simpan dan lanjutkan.</p>
            <div class="content-blocks">
              <div
                class="block"
                *ngFor="
                  let block of selectedChapter.blocks;
                  trackBy: trackByBlockId
                "
              >
                <ng-container [ngSwitch]="block.type">
                  <h3 *ngSwitchCase="'heading'" class="inline-editable" [(appInlineText)]="block.content"
                    [inlineDisabled]="saving" aria-label="Subjudul" data-placeholder="Subjudul"></h3>
                  <blockquote *ngSwitchCase="'callout'" class="inline-editable callout" [(appInlineText)]="block.content"
                    [inlineDisabled]="saving" aria-label="Catatan" data-placeholder="Tulis catatan"></blockquote>
                  <div *ngSwitchCase="'list'">
                    <div class="inline-editable" [(appInlineText)]="block.content" [inlineDisabled]="saving"
                      aria-label="Pengantar daftar" data-placeholder="Pengantar daftar (opsional)"></div>
                    <ul><li *ngFor="let item of block.items; let i = index; trackBy: trackByIndex"
                      class="inline-editable" [(appInlineText)]="block.items![i]" [inlineDisabled]="saving"
                      [attr.aria-label]="'Item daftar ' + (i + 1)" data-placeholder="Tulis item daftar"></li></ul>
                  </div>
                  <div *ngSwitchCase="'citation'" class="citation">
                    <span class="citation-label">{{ block.citationLabel || 'Referensi' }}</span>
                    <div class="inline-editable" [(appInlineText)]="block.content" [inlineDisabled]="saving"
                      aria-label="Teks referensi" data-placeholder="Teks referensi"></div>
                  </div>
                  <div *ngSwitchDefault class="inline-editable" [(appInlineText)]="block.content"
                    [inlineDisabled]="saving" aria-label="Paragraf" data-placeholder="Tulis paragraf"></div>
                </ng-container>
              </div>
            </div>
            <div class="page-number">[{{ selectedIndex + 1 }}]</div>
          </div>
        </main>

        <aside class="sidebar right-sidebar">
          <h2>Review penulis</h2>
          <p>
            Periksa fakta dan referensi. Kamu bisa mengedit teks sebelum
            menyimpan versi baru.
          </p>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 40px;
        background-color: #f5f5f5;
        min-height: 100vh;
      }

      .editor-container {
        background-color: #f9f8f6;
        border-radius: 24px;
        padding: 30px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        max-width: 1200px;
        margin: 0 auto;
      }

      .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
      }

      .book-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin: 0;
      }

      .header-btn {
        background-color: #1a1a1a;
        color: white;
        border: none;
        padding: 8px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }

      .editor-layout {
        display: grid;
        grid-template-columns: 220px 1fr 180px;
        gap: 30px;
        align-items: start;
      }

      .sidebar h2 {
        font-size: 1rem;
        margin-bottom: 20px;
        font-weight: 700;
      }

      .chapter-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .chapter-item {
        display: flex;
        gap: 12px;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .chapter-item.active {
        background-color: #e8e6e3;
      }

      .chapter-number {
        font-weight: 600;
        min-width: 20px;
      }

      .chapter-name {
        font-size: 0.9rem;
      }

      .editor-main {
        background-color: white;
        border-radius: 16px;
        border: 1px solid #e0e0e0;
        min-height: 650px;
        padding: 60px 40px;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .chapter-title {
        text-align: center;
        font-size: 1.2rem;
        margin-bottom: 40px;
        font-weight: 700;
      }

      .content-blocks {
        flex: 1;
        line-height: 1.8;
        color: #1a1a1a;
        font-size: 1rem;
        text-align: justify;
      }

      .block {
        margin-bottom: 1.5rem;
      }

      .inline-editable { white-space: pre-wrap; overflow-wrap: anywhere; min-height: 1.8em; border-radius: 4px; text-align: left; }
      .inline-editable:hover { background: #faf9f6; }
      .inline-editable:focus { outline: 2px solid #9e9b91; outline-offset: 5px; background: #fffef9; }
      .inline-editable:empty::before { content: attr(data-placeholder); color: #999; pointer-events: none; }
      .edit-hint { color: #777; font-size: .8rem; text-align: center; margin-bottom: 24px; }
      .callout { border-left: 3px solid #b9aa89; background: #faf7ef; padding: 12px 16px; margin: 0; }
      .citation { font-size: .85rem; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
      .citation-label { font-weight: 600; }
      .header-btn:disabled { opacity: .5; cursor: default; }
      @media (max-width: 640px) { :host { padding: 12px; } .editor-container { padding: 16px; } .editor-main { padding: 24px 20px; min-width: 0; } .editor-header { gap: 12px; flex-wrap: wrap; } }
      .page-number {
        text-align: center;
        margin-top: 40px;
        font-size: 0.9rem;
        color: #333;
        font-weight: 500;
      }

      .ai-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .ai-buttons button {
        background-color: #333;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
      }

      .ai-buttons button:hover {
        background-color: #444;
      }

      @media (max-width: 1024px) {
        .editor-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class EditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  bookTitle = 'Memuat ebook…';
  targetWords = 2000; minWords = 1800; maxWords = 2200;
  get actualWords(): number {
    const count = (text: string) => (text.match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu) || []).length;
    return this.chapters.reduce((sum, chapter) => sum + chapter.blocks
      .filter(b => b.type !== 'citation')
      .reduce((n, b) => n + count(b.content || '') + (b.items || []).reduce((v, item) => v + count(item), 0), 0), 0);
  }
  draftMessage = '';
  saveDraft(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || this.saving || !this.chapters.length) return;
    this.saving = true;
    this.ebookService.saveWorkflow(id, 'EDITOR', { chapters: this.chapters }).subscribe({
      next: () => { this.saving = false; this.draftMessage = 'Draft editor tersimpan.'; },
      error: () => { this.saving = false; this.errorMessage = 'Draft gagal disimpan. Coba lagi.'; }
    });
  }
  saving = false;
  errorMessage = '';
  selectedIndex = 0;

  chapters: EditorChapterContent[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService
      .getEbookById(id)
      .subscribe(e => {
        this.bookTitle = e.title;
        this.chapters = e.workflowDrafts?.['EDITOR']?.chapters || e.editorContent || [];
        this.targetWords = e.contentLength === 'Long' ? 6000 : e.contentLength === 'Medium' ? 4000 : 2000;
        this.minWords = this.targetWords * .9;
        this.maxWords = this.targetWords === 6000 ? 6000 : this.targetWords * 1.1;
      });

  }

  get selectedChapter(): EditorChapterContent | undefined {
    return this.chapters[this.selectedIndex];
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByBlockId(index: number, block: { id: string }): string {
    return block.id;
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.router.navigate(['/ebooks', id, 'detail']);
  }

  saveAndContinue(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.chapters.length || this.saving) return;
    if (this.chapters.some(chapter => !chapter.title.trim() || chapter.title.length > 200)) {
      this.errorMessage = 'Judul setiap bab wajib diisi dan maksimal 200 karakter.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';

    this.ebookService.saveEditorContent(id, this.chapters).subscribe({
      next: () => { this.saving = false; void this.router.navigate(['/ebooks', id, 'quality-check']); },
      error: error => { this.saving = false; this.errorMessage = error.error?.detail || 'Gagal menyimpan. Perubahan masih tersedia di editor, coba simpan lagi.'; }
    });
  }
}
