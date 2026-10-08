import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorChapterContent } from '../../../../core/models/ebook.model';
import { EbookService } from '../../../../core/services/ebook.service';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="editor-container">
      <header class="editor-header">
        <button class="header-btn" (click)="goBack()">Project</button>
        <h1 class="book-title">{{ bookTitle }}</h1>
        <button class="header-btn save-btn" (click)="saveAndContinue()">
          Save
        </button>
      </header>

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
            <h2 class="chapter-title">{{ selectedChapter.title }}</h2>
            <div class="content-blocks">
              <div
                class="block"
                *ngFor="
                  let block of selectedChapter.blocks;
                  trackBy: trackByBlockId
                "
              >
                <label
                  >{{ block.type
                  }}<textarea
                    [(ngModel)]="block.content"
                    rows="4"
                    style="width:100%;padding:10px"
                  ></textarea>
                </label>
                <div *ngIf="block.items">
                  <input
                    *ngFor="
                      let item of block.items;
                      let i = index;
                      trackBy: trackByIndex
                    "
                    [(ngModel)]="block.items[i]"
                    style="width:100%;margin:4px 0"
                  />
                </div>
                <small *ngIf="block.type === 'citation'"
                  >{{ block.citationLabel }} · {{ block.sourceId }}</small
                >
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
      .subscribe((e) => (this.bookTitle = e.title));
    this.ebookService.getEditorContent(id).subscribe((result) => {
      if (result && result.length > 0) {
        this.chapters = result;
      }
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
    this.router.navigate(['/dashboard']);
  }

  saveAndContinue(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.chapters.length) return;

    this.ebookService.saveEditorContent(id, this.chapters).subscribe(() => {
      this.router.navigate(['/ebooks', id, 'quality-check']);
    });
  }
}
