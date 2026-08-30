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
    <div class="editor-container">
      <header class="editor-header">
        <button class="header-btn" (click)="goBack()">Project</button>
        <h1 class="book-title">{{ bookTitle }}</h1>
        <button class="header-btn save-btn" (click)="saveAndContinue()">Save</button>
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
              <span class="chapter-number">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <span class="chapter-name">{{ chapter.title }}</span>
            </div>
          </div>
        </aside>

        <!-- Editor Main -->
        <main class="editor-main">
          <div class="page-content" *ngIf="selectedChapter">
            <h2 class="chapter-title">{{ selectedChapter.title }}</h2>
            <div class="content-blocks">
              <div class="block" *ngFor="let block of selectedChapter.blocks; trackBy: trackByBlockId">
                <ng-container [ngSwitch]="block.type">
                  <h4 *ngSwitchCase="'heading'">{{ block.content }}</h4>
                  <p *ngSwitchCase="'paragraph'">{{ block.content }}</p>
                  <ul *ngSwitchCase="'list'">
                    <li *ngFor="let item of block.items || []">{{ item }}</li>
                  </ul>
                  <div *ngSwitchCase="'callout'" class="callout">{{ block.content }}</div>
                </ng-container>
              </div>
            </div>
            <div class="page-number">[{{ selectedIndex + 1 }}]</div>
          </div>
        </main>

        <!-- AI Tools Sidebar -->
        <aside class="sidebar right-sidebar">
          <h2>AI TOOLS</h2>
          <div class="ai-buttons">
            <button (click)="applyTool('Simplify')">Simplify</button>
            <button (click)="applyTool('Expand')">Expand</button>
            <button (click)="applyTool('Rewrite')">Rewrite</button>
            <button (click)="applyTool('Regenerate')">Regenerate</button>
          </div>
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
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
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
    `
  ]
})
export class EditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);

  bookTitle = 'UI/UX for Beginners';
  selectedIndex = 0;

  chapters: EditorChapterContent[] = [
    {
      chapterId: '1',
      title: 'Introduction to UI/UX',
      blocks: [
        {
          id: 'b1',
          type: 'paragraph',
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum egestas eget tellus quis dui convallis interdum quis leo. Vestibulum tincidunt nisi non enim pellentesque, sit amet mattis orci tristique. Duis accumsan, turpis vel congue pharetra, odio dolor viverra lacus, feugiat finibus ante elit a risus.'
        },
        {
          id: 'b2',
          type: 'paragraph',
          content: 'Morbi dapibus massa non dapibus elementum. Donec placerat semper nunc sit amet sagittis. Cras malesuada vitae est vel aliquam. Aliquam porta risus felis, quis sodales diam maximus vel. Phasellus vehicula velit a lacus scelerisque, egestas maximus diam auctor. Integer tellus tortor, faucibus at massa et, suscipit convallis urna. Sed tincidunt ipsum id sapien cursus vulputate. Phasellus at ante iaculis, vestibulum lorem eu, pellentesque lacus. Mauris efficitur luctus sapien, id vehicula mauris elementum nec. Donec ac ante hendrerit, elementum nulla vel, pulvinar metus.'
        },
        {
          id: 'b3',
          type: 'paragraph',
          content: 'Aenean venenatis elementum pellentesque. Curabitur aliquet libero eu odio tincidunt dictum. Aenean placerat sed sapien vel facilisis. In hac habitasse platea dictumst. Vivamus ac condimentum arcu. Fusce ac magna in quam egestas feugiat. Pellentesque quis sem facilisis, scelerisque risus sed, lobortis dui. Ut facilisis tristique velit sit amet malesuada. Nulla dictum, magna eu tincidunt placerat, sit magna malesuada urna, a accumsan purus ante at massa. Donec ac ante hendrerit, elementum nulla vel, pulvinar metus.'
        }
      ]
    },
    {
      chapterId: '2',
      title: 'Understanding Users',
      blocks: [
        { id: 'b4', type: 'paragraph', content: 'Content for Understanding Users chapter goes here...' }
      ]
    },
    {
      chapterId: '3',
      title: 'User Research',
      blocks: [
        { id: 'b5', type: 'paragraph', content: 'Content for User Research chapter goes here...' }
      ]
    },
    {
      chapterId: '4',
      title: 'Wireframing',
      blocks: [
        { id: 'b6', type: 'paragraph', content: 'Content for Wireframing chapter goes here...' }
      ]
    },
    {
      chapterId: '5',
      title: 'Prototyping',
      blocks: [
        { id: 'b7', type: 'paragraph', content: 'Content for Prototyping chapter goes here...' }
      ]
    }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Attempt to load real content, but fallback to our mock content if service is empty
    this.ebookService.getEditorContent(id).subscribe((result) => {
      if (result && result.length > 0) {
        this.chapters = result;
      }
    });
  }

  get selectedChapter(): EditorChapterContent | undefined {
    return this.chapters[this.selectedIndex];
  }

  trackByBlockId(index: number, block: { id: string }): string {
    return block.id;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  applyTool(tool: string): void {
    // Simulate AI tool application
    const chapter = this.selectedChapter;
    if (chapter && chapter.blocks.length > 0) {
      const firstBlock = chapter.blocks.find(b => b.type === 'paragraph');
      if (firstBlock) {
        firstBlock.content = `${firstBlock.content} (${tool} applied)`;
      }
    }
  }

  saveAndContinue(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.ebookService.saveEditorContent(id, this.chapters).subscribe(() => {
      this.router.navigate(['/ebooks', id, 'quality-check']);
    });
  }
}
