import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Ebook, EbookOutline, OutlineChapter } from '../../../../core/models/ebook.model';
import { EbookService } from '../../../../core/services/ebook.service';

@Component({
  selector: 'app-outline-page', standalone: true, imports: [CommonModule],
  template: `
    <section class="page-shell"><div class="card">
      <h2>{{ outline.candidates ? 'Pilih calon bab' : 'Tinjau outline final' }}</h2>
      <p>Target ebook: {{ target | number }} kata ({{ min | number }}-{{ max | number }} kata).</p>
      <p *ngIf="outline.candidates">Pilih minimal satu bab untuk setiap level yang dipilih dan urutkan dari dasar ke lanjutan.</p>
      <p *ngIf="outline.candidates">Pilih bab dan atur urutannya. Target kata akan dibagi ulang ke bab yang dipilih.</p>
      <p role="status" *ngIf="busy">{{ status }}</p>
      <p role="alert" *ngIf="error">{{ error }}</p>
      <p *ngIf="outline.candidates && selected.size && target / selected.size > 2000">
        Pilihan ini membutuhkan lebih dari 2.000 kata per bab. Pertimbangkan menambah bab atau menurunkan target agar pembahasan tidak berulang.
      </p>
      <div class="outline-list">
        <article *ngFor="let chapter of outline.chapters; let i = index">
          <label *ngIf="outline.candidates; else finalTitle">
            <input type="checkbox" [checked]="selected.has(chapter.id)" (change)="toggle(chapter.id)" [disabled]="busy || locked" />
            {{ chapter.title }}
          </label>
          <ng-template #finalTitle><strong>{{ i + 1 }}. {{ chapter.title }}</strong></ng-template>
          <p><strong>Level: {{ chapter.level || defaultLevel }}</strong></p>
          <p>{{ chapter.description }}</p>
          <p *ngIf="!outline.candidates">Estimasi {{ chapter.estimatedWords | number }} kata</p>
          <div *ngIf="outline.candidates" class="order">
            <button type="button" (click)="move(i, -1)" [disabled]="busy || locked || i === 0" [attr.aria-label]="'Naikkan ' + chapter.title">Naik</button>
            <button type="button" (click)="move(i, 1)" [disabled]="busy || locked || i === outline.chapters.length - 1" [attr.aria-label]="'Turunkan ' + chapter.title">Turun</button>
          </div>
        </article>
      </div>
      <p *ngIf="outline.candidates">{{ selected.size }} bab dipilih</p>
      <p *ngIf="!outline.candidates && outline.chapters.length">Total alokasi: {{ totalWords | number }} kata ? {{ outline.estimatedReadingTime }}</p>
      <div *ngIf="!outline.candidates && outline.learningOutcomes?.length"><h3>Hasil belajar</h3><ul><li *ngFor="let outcome of outline.learningOutcomes">{{ outcome }}</li></ul></div>
      <p role="status">{{ draftMessage }}</p>
      <button *ngIf="outline.candidates" type="button" (click)="saveDraft()" [disabled]="busy || locked">Simpan pilihan bab</button>
      <div class="actions">
        <button type="button" (click)="goBack()" [disabled]="busy">Kembali</button>
        <button *ngIf="outline.candidates" type="button" (click)="finalize()" [disabled]="busy || locked || !selected.size">Susun outline final</button>
        <button *ngIf="!outline.candidates && outline.chapters.length && !locked" type="button" (click)="editSelection()" [disabled]="busy">Ubah pilihan / urutan bab</button>
        <button *ngIf="!outline.candidates" type="button" (click)="approve()" [disabled]="busy || !outline.chapters.length">{{ locked ? 'Lanjut ke konten' : 'Approve outline' }}</button>
      </div>
    </div></section>
  `,
  styles: [`
    .page-shell { max-width: 900px; margin: 32px auto; padding: 20px; }
    .card { background: #f8f6f4; border: 1px solid #d7d2cf; border-radius: 16px; padding: 24px; }
    .outline-list { display: grid; gap: 12px; }
    article { padding: 16px; border: 1px solid #dad5d1; border-radius: 10px; background: white; }
    label { font-weight: 600; cursor: pointer; } p { line-height: 1.6; }
    .actions, .order { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    button { padding: 10px 16px; border-radius: 8px; border: 1px solid #bbb; cursor: pointer; }
    button:disabled { opacity: .5; cursor: default; } [role=alert] { color: #a22; }
  `],
})
export class OutlinePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ebookService = inject(EbookService);
  private get id(): string { return this.route.snapshot.paramMap.get('id')!; }
  outline: EbookOutline = { title: '', chapters: [] };
  defaultLevel = 'Beginner';
  draftMessage = '';
  saveDraft(): void {
    if (this.busy || this.locked) return;
    this.busy = true; this.status = 'Menyimpan pilihan bab...';
    this.ebookService.saveWorkflow(this.id, 'OUTLINE', {
      selected: [...this.selected], order: this.outline.chapters.map(c => c.id)
    }).subscribe({ next: () => { this.busy = false; this.draftMessage = 'Pilihan dan urutan bab tersimpan.'; }, error: e => this.fail(e) });
  }
  candidateChapters: OutlineChapter[] = [];
  selected = new Set<string>();
  target = 2000; min = 1800; max = 2200;
  busy = true; locked = false; error = ''; status = 'Memuat outline...';
  get totalWords(): number { return this.outline.chapters.reduce((sum, c) => sum + (c.estimatedWords || 0), 0); }
  ngOnInit(): void {
    this.status = 'Memuat outline...';
    this.ebookService.getEbookById(this.id).subscribe({ next: book => this.apply(book), error: e => this.fail(e) });
  }
  private apply(book: Ebook): void {
    this.defaultLevel = book.targetLevel || 'Beginner';
    this.outline = book.outline || { title: '', chapters: [] };
    this.candidateChapters = book.candidateChapters || this.outline.chapters;
    this.selected = new Set(this.outline.chapters.map(c => c.id));
    const draft = book.workflowDrafts?.['OUTLINE'];
    if (draft) {
      this.outline = { ...this.outline, candidates: true, chapters: [...this.candidateChapters] };
      this.selected = new Set((draft.selected || []).filter((id: string) => this.outline.chapters.some(c => c.id === id)));
      this.outline.chapters.sort((a, b) => (draft.order || []).indexOf(a.id) - (draft.order || []).indexOf(b.id));
    }
    this.target = book.contentLength === 'Long' ? 6000 : book.contentLength === 'Medium' ? 4000 : 2000;
    this.min = this.target * .9;
    this.max = this.target === 6000 ? 6000 : this.target * 1.1;
    this.locked = !!book.editorContent?.length;
    this.busy = false;
  }
  toggle(id: string): void { if (this.busy || this.locked) return; this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id); }
  move(index: number, delta: number): void {
    if (this.busy || this.locked) return;
    const chapters = [...this.outline.chapters];
    [chapters[index], chapters[index + delta]] = [chapters[index + delta], chapters[index]];
    this.outline = { ...this.outline, chapters };
  }
  editSelection(): void {
    const chosen = new Set(this.outline.chapters.map(c => c.id));
    this.outline = { ...this.outline, candidates: true, chapters: [
      ...this.outline.chapters, ...this.candidateChapters.filter(c => !chosen.has(c.id))
    ] };
  }
  finalize(): void {
    if (this.busy || this.locked || !this.selected.size) return;
    this.busy = true; this.error = ''; this.status = 'AI menyusun outline final dan pembagian kata...';
    this.ebookService.finalizeOutline(this.id, this.outline.chapters.filter(c => this.selected.has(c.id)).map(c => c.id))
      .subscribe({ next: book => this.apply(book), error: e => this.fail(e) });
  }
  approve(): void {
    if (this.busy || this.outline.candidates || !this.outline.chapters.length) return;
    if (this.locked) { void this.router.navigate(['/ebooks', this.id, 'generation']); return; }
    this.busy = true; this.error = ''; this.status = 'Menyetujui outline...';
    this.ebookService.approveOutline(this.id).subscribe({
      next: () => { void this.router.navigate(['/ebooks', this.id, 'generation']); }, error: e => this.fail(e)
    });
  }
  private fail(error: any): void { this.busy = false; this.error = error.error?.detail || 'Outline belum dapat diproses. Coba lagi.'; }
  goBack(): void { void this.router.navigate(['/ebooks', this.id, 'learning-plan']); }
}
