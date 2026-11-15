import { InlineTextDirective } from '../../../../shared/directives/inline-text.directive';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
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
              (click)="selectChapter(i)"
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
          <p class="edit-hint">Klik teks untuk mengedit. Teks mengalir otomatis ke halaman berikutnya saat penuh.</p>
          <div class="paper" *ngIf="selectedChapter">
          <div class="paper-window" #paperWindow (input)="schedulePagination()" (paste)="schedulePagination()" (keyup)="followCaret()">
          <div class="paper-flow" #paperFlow [style.transform]="pageTransform">
            <h2 class="chapter-title inline-editable" [(appInlineText)]="selectedChapter.title"
              [inlineDisabled]="saving" aria-label="Judul bab" data-placeholder="Judul bab"></h2>
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
          </div>
          </div>
            <div class="page-number">{{ pageIndex + 1 }}</div>
          </div>
          <nav class="page-controls" aria-label="Navigasi halaman editor" *ngIf="selectedChapter">
            <button type="button" (click)="turnPage(-1)" [disabled]="pageIndex === 0 && selectedIndex === 0">← Sebelumnya</button>
            <span aria-live="polite">Bab {{ selectedIndex + 1 }} · Halaman {{ pageIndex + 1 }} / {{ pageCount }}</span>
            <button type="button" (click)="turnPage(1)" [disabled]="pageIndex === pageCount - 1 && selectedIndex === chapters.length - 1">Berikutnya →</button>
          </nav>
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

      :host { padding: 0; background: white; min-height: 0; }
      .editor-container { max-width: 1280px; padding: 20px; border-radius: 14px; box-shadow: none; }
      .editor-header { gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
      .editor-layout { grid-template-columns: 190px minmax(0, 1fr) 150px; gap: 20px; }
      .editor-layout .sidebar { position: sticky; top: 20px; }
      .editor-main { min-width: 0; padding: 0; background: transparent; border: 0; min-height: 0; }
      .edit-hint { margin: 0 0 12px; }
      .paper { background: white; border: 1px solid #dedbd5; box-shadow: 0 2px 8px #00000008; padding: 44px 40px 20px; }
      .paper-window { height: 820px; min-width: 0; overflow: hidden; }
      .paper-flow { width: 100%; height: 100%; column-count: 1; column-gap: 40px; column-fill: auto; position: relative; }
      .paper-flow .chapter-title { text-align: left; font-size: 24px; line-height: 1.35; margin: 0 0 24px; break-after: avoid; }
      .content-blocks { font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.7; }
      .content-blocks .inline-editable { text-align: justify; min-height: 1.7em; border-radius: 0; orphans: 2; widows: 2; }
      .block { margin-bottom: 14px; }
      .block h3 { margin: 16px 0 8px; font-size: 18px; break-after: avoid; }
      .block ul { padding-left: 24px; margin: 8px 0; }
      .inline-editable:focus { outline-offset: 1px; }
      .page-number { margin-top: 20px; font-size: 12px; color: #777; }
      .page-controls { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; font-size: 12px; }
      .page-controls button { border: 1px solid #d4d0c9; border-radius: 8px; background: white; padding: 8px 12px; cursor: pointer; }
      .page-controls button:disabled { opacity: .45; cursor: default; }
      @media (max-width: 1100px) {
        .editor-layout { grid-template-columns: 170px minmax(0, 1fr); }
        .right-sidebar { grid-column: 1 / -1; }
      }
      @media (max-width: 700px) {
        .editor-container { padding: 12px; }
        .editor-layout { grid-template-columns: minmax(0, 1fr); }
        .editor-layout .sidebar { position: static; }
        .left-sidebar .chapter-list { flex-direction: row; flex-wrap: wrap; gap: 6px; }
        .chapter-item { max-width: 100%; font-size: 12px; }
        .paper { padding: 24px 20px 16px; }
        .paper-window { height: 680px; }
        .page-controls { flex-wrap: wrap; }
      }
    `,
  ],
})
export class EditorPageComponent implements OnInit, OnDestroy {
  @ViewChild('paperFlow') paperFlow?: ElementRef<HTMLDivElement>;
  @ViewChild('paperWindow') set paperWindow(ref: ElementRef<HTMLDivElement> | undefined) {
    this.resizeObserver?.disconnect();
    this.viewport = ref?.nativeElement;
    if (this.viewport) {
      this.resizeObserver = new ResizeObserver(() => this.schedulePagination());
      this.resizeObserver.observe(this.viewport);
      this.schedulePagination();
    }
  }
  private viewport?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private frame = 0;
  private pageWidth = 0;
  pageIndex = 0;
  pageCount = 1;
  get pageTransform(): string { return `translateX(-${this.pageIndex * (this.pageWidth + 40)}px)`; }
  schedulePagination(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const flow = this.paperFlow?.nativeElement;
      if (!flow || !this.viewport) return;
      this.pageWidth = this.viewport.clientWidth;
      if (!this.pageWidth) return;
      this.pageCount = Math.max(1, Math.ceil((flow.scrollWidth + 40) / (this.pageWidth + 40)));
      this.pageIndex = Math.min(this.pageIndex, this.pageCount - 1);
      this.followCaret();
    });
  }
  followCaret(): void {
    const selection = window.getSelection();
    const flow = this.paperFlow?.nativeElement;
    if (!selection?.rangeCount || !flow || !flow.contains(selection.anchorNode) || !this.pageWidth) return;
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(false);
    const rect = range.getBoundingClientRect();
    if (!rect.height) return;
    const position = rect.left - flow.getBoundingClientRect().left;
    this.pageIndex = Math.max(0, Math.min(this.pageCount - 1, Math.floor(position / (this.pageWidth + 40))));
    // Browsers may scroll the clipped window when focusing a textbox on another page.
    if (this.viewport) this.viewport.scrollLeft = 0;
  }
  selectChapter(index: number): void {
    window.getSelection()?.removeAllRanges();
    this.selectedIndex = index;
    this.pageIndex = 0;
    this.schedulePagination();
  }
  turnPage(direction: number): void {
    (document.activeElement as HTMLElement | null)?.blur();
    window.getSelection()?.removeAllRanges();
    const next = this.pageIndex + direction;
    if (next >= 0 && next < this.pageCount) this.pageIndex = next;
    else if (direction > 0 && this.selectedIndex < this.chapters.length - 1) this.selectChapter(this.selectedIndex + 1);
    else if (direction < 0 && this.selectedIndex > 0) {
      this.selectChapter(this.selectedIndex - 1);
      this.schedulePagination();
      requestAnimationFrame(() => { this.pageIndex = this.pageCount - 1; });
    }
  }
  ngOnDestroy(): void { this.resizeObserver?.disconnect(); cancelAnimationFrame(this.frame); }
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
        this.schedulePagination();
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
