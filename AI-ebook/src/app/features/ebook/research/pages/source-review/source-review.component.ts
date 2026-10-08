import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ResearchService, ResearchView } from '../../../../../core/services/research.service';
import { Source } from '../../../../../core/models/source.model';

@Component({
  selector: 'app-source-review', standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './source-review.component.html',
  styleUrl: './source-review.component.css'
})
export class SourceReviewPageComponent implements OnInit {
  private readonly service = inject(ResearchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private get id(): string { return this.route.snapshot.paramMap.get('id')!; }
  sources: Source[] = [];
  draft = { title: '', publisher: '', url: '', excerpt: '' };
  loading = true;
  adding = false;
  saving = false;
  frozen = false;
  loadFailed = false;
  errorMessage = '';
  get busy(): boolean { return this.loading || this.adding || this.saving; }
  get selectedCount(): number { return this.sources.filter(s => s.selected).length; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.loadFailed = false;
    this.service.getResearch(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.apply(result);
        this.loading = false;
      },
      error: error => { this.loading = false; this.loadFailed = true; this.showError(error); }
    });
  }

  addSource(): void {
    if (this.busy || this.frozen || this.loadFailed) return;
    const input = {
      title: this.draft.title.trim(), publisher: this.draft.publisher.trim(),
      url: this.draft.url.trim(), excerpt: this.draft.excerpt.trim()
    };
    if (Object.values(input).some(value => !value)) {
      this.errorMessage = 'Lengkapi judul, penerbit, URL, dan kutipan isi sumber.';
      return;
    }
    try {
      const url = new URL(input.url);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
    } catch {
      this.errorMessage = 'URL sumber harus berupa alamat http:// atau https:// yang valid.';
      return;
    }
    this.adding = true;
    this.errorMessage = '';
    this.service.addSource(this.id, input).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: source => {
        this.sources = [...this.sources, { ...source, selected: true }];
        this.draft = { title: '', publisher: '', url: '', excerpt: '' };
        this.adding = false;
      },
      error: error => { this.adding = false; this.showError(error); }
    });
  }

  private apply(result: ResearchView): void {
    const selections = new Map(this.sources.map(s => [s.id, s.selected]));
    this.sources = result.sources.map(s => ({ ...s, selected: selections.get(s.id) ?? s.selected }));
    this.frozen = result.frozen;
  }

  toggle(source: Source): void {
    if (this.busy || this.frozen || source.locked) return;
    source.selected = !source.selected;
  }

  continue(): void {
    if (this.busy || this.frozen || !this.selectedCount) return;
    this.saving = true;
    this.errorMessage = '';
    this.service.updateSelectedSources(this.id, this.sources.filter(s => s.selected).map(s => s.id))
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { this.saving = false; void this.router.navigate(['/ebooks', this.id, 'learning-plan']); },
        error: error => { this.saving = false; this.showError(error); }
      });
  }

  private showError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.errorMessage = error.status === 0 ? 'Backend tidak dapat dihubungi. Periksa koneksi lalu coba lagi.'
        : error.status === 401 ? 'Sesi login berakhir. Silakan login kembali.'
        : typeof error.error?.detail === 'string' ? error.error.detail
        : `Referensi belum dapat diproses (HTTP ${error.status}). Coba lagi.`;
    } else this.errorMessage = 'Referensi belum dapat diproses. Coba lagi.';
  }
}
