import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorChapterContent } from '../../../../core/models/ebook.model';
import { EbookService } from '../../../../core/services/ebook.service';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="editor-shell">
      <aside class="sidebar left">
        <h3>Chapters</h3>
        <button type="button" class="chapter-tab" *ngFor="let chapter of chapters; let i = index" [class.active]="selectedIndex === i" (click)="selectedIndex = i">
          <span>{{ i + 1 }}</span>
          <strong>{{ chapter.title }}</strong>
        </button>
        <button type="button" class="mini-btn" (click)="addChapter()">+ Add Chapter</button>
      </aside>

      <main class="editor-panel">
        <div class="toolbar">
          <span class="toolbar-title">{{ selectedChapter?.title }}</span>
          <div class="toolbar-actions">
            <button type="button" class="tool-btn" (click)="applyTool('Improve')">Improve</button>
            <button type="button" class="tool-btn" (click)="applyTool('Simplify')">Simplify</button>
            <button type="button" class="tool-btn" (click)="applyTool('Expand')">Expand</button>
            <button type="button" class="tool-btn" (click)="applyTool('Rewrite')">Rewrite</button>
            <button type="button" class="tool-btn" (click)="applyTool('Regenerate')">Regenerate</button>
          </div>
        </div>

        <div class="blocks" *ngIf="selectedChapter">
          <div class="block" *ngFor="let block of selectedChapter.blocks; trackBy: trackByBlockId">
            <ng-container [ngSwitch]="block.type">
              <h4 *ngSwitchCase="'heading'">{{ block.content }}</h4>
              <p *ngSwitchCase="'paragraph'">{{ block.content }}</p>
              <ul *ngSwitchCase="'list'">
                <li *ngFor="let item of block.items || []">{{ item }}</li>
              </ul>
              <div *ngSwitchCase="'callout'" class="callout">{{ block.content }}</div>
              <div *ngSwitchCase="'citation'" class="citation-box">
                <span class="citation-label">{{ block.citationLabel || '[1]' }}</span>
                <button type="button" class="citation-btn" (click)="openCitation(block.sourceId || 'source-1')">View Citation</button>
              </div>
            </ng-container>
          </div>
        </div>
      </main>

      <aside class="sidebar right">
        <h3>AI Tools</h3>
        <div class="tool-list">
          <button type="button" class="tool-btn full" (click)="applyTool('Improve')">Improve</button>
          <button type="button" class="tool-btn full" (click)="applyTool('Simplify')">Simplify</button>
          <button type="button" class="tool-btn full" (click)="applyTool('Expand')">Expand</button>
          <button type="button" class="tool-btn full" (click)="applyTool('Rewrite')">Rewrite</button>
          <button type="button" class="tool-btn full" (click)="applyTool('Regenerate')">Regenerate</button>
        </div>
        <div class="footer-actions">
          <button type="button" class="save-btn" (click)="saveAndContinue()">Save</button>
          <button type="button" class="secondary-btn" (click)="goToQualityCheck()">Quality Check</button>
        </div>
      </aside>
    </section>
  `,
  styles: [
    `
      .editor-shell { display:grid; grid-template-columns: 260px minmax(0,1fr) 260px; min-height: calc(100vh - 90px); gap:20px; padding:20px; }
      .sidebar { background: rgba(242,239,236,.92); border:1px solid #d7d2cf; border-radius:18px; padding:18px 14px; }
      .left { display:flex; flex-direction:column; gap:12px; }
      .editor-panel { background: rgba(242,239,236,.92); border:1px solid #d7d2cf; border-radius:18px; padding:18px; display:flex; flex-direction:column; }
      .toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:14px; border-bottom:1px solid #ddd6d2; }
      .toolbar-title { font-weight:700; }
      .toolbar-actions, .tool-list { display:flex; flex-wrap:wrap; gap:8px; }
      .chapter-tab { display:flex; align-items:center; gap:10px; background:#f6f4f3; border:1px solid #d8d3d0; border-radius:10px; padding:10px 12px; text-align:left; cursor:pointer; }
      .chapter-tab.active { background:#e7e2df; }
      .mini-btn, .tool-btn, .save-btn, .secondary-btn, .citation-btn { border:0; border-radius:10px; font-weight:700; cursor:pointer; }
      .mini-btn { background:#1d1d1d; color:#fff; height:40px; }
      .tool-btn { background:#1d1d1d; color:#fff; padding:8px 12px; }
      .tool-btn.full { width:100%; }
      .save-btn { background:#1d1d1d; color:#fff; height:42px; width:100%; }
      .secondary-btn { background:transparent; border:1px solid #d5d1cd; height:42px; width:100%; }
      .blocks { padding-top:18px; display:flex; flex-direction:column; gap:16px; }
      .block { border-left:3px solid #d7d2cf; padding-left:10px; }
      h4 { margin:0; font-size:1.3rem; }
      p { margin:0; line-height:1.7; }
      ul { margin:0; padding-left:18px; line-height:1.8; }
      .callout { background:#f4efe9; border:1px solid #d8d2ce; border-left:4px solid #9a7e3c; border-radius:10px; padding:12px 14px; }
      .citation-box { display:flex; align-items:center; justify-content:space-between; gap:14px; background:#f5f2ef; border:1px solid #ddd7d3; border-radius:10px; padding:10px 12px; }
      .citation-label { font-weight:700; }
      .citation-btn { background:#1d1d1d; color:#fff; padding:8px 12px; }
      .right { display:flex; flex-direction:column; gap:12px; }
      .footer-actions { margin-top:auto; }
      @media (max-width: 900px) { .editor-shell { grid-template-columns: 1fr; } }
    `
  ]
})
export class EditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  chapters: EditorChapterContent[] = [];
  selectedIndex = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ebookService.getEditorContent(id).subscribe((result) => {
      this.chapters = result;
      if (this.chapters.length) {
        this.selectedIndex = 0;
      }
    });
  }

  get selectedChapter(): EditorChapterContent | undefined {
    return this.chapters[this.selectedIndex];
  }

  trackByBlockId(index: number, block: { id: string }): string {
    return block.id;
  }

  addChapter(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.ebookService.addOutlineChapter(id).subscribe((ebook) => {
      this.ebookService.getEditorContent(id).subscribe((result) => {
        this.chapters = result;
        this.selectedIndex = this.chapters.length - 1;
      });
    });
  }

  applyTool(tool: string): void {
    const chapter = this.selectedChapter;
    if (!chapter) {
      return;
    }

    const block = chapter.blocks.find((item) => item.type === 'paragraph');
    if (block) {
      block.content = `${block.content} (${tool} applied)`;
    }
  }

  openCitation(sourceId: string): void {
    window.alert(`Citation detail for ${sourceId}`);
  }

  saveAndContinue(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.ebookService.saveEditorContent(id, this.chapters).subscribe(() => {
      this.router.navigate(['/ebooks', id, 'quality-check']);
    });
  }

  goToQualityCheck(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/ebooks', id, 'quality-check']);
    }
  }
}
