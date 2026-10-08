import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResearchService } from '../../../../../core/services/research.service';
import { Source } from '../../../../../core/models/source.model';
@Component({
  selector: 'app-source-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: ` <section class="sources">
    <h1>Sumber referensi ebook</h1>
    <p>
      Tambahkan sumber yang kamu gunakan dan tempel bagian isinya. Gemini akan
      menyusun materi berdasarkan kutipan ini. Pencarian web otomatis belum
      tersedia.
    </p>
    <form [formGroup]="form" (ngSubmit)="add()">
      <label
        >Judul sumber<input formControlName="title" maxlength="200"
      /></label>
      <label
        >Penerbit<input formControlName="publisher" maxlength="200"
      /></label>
      <label
        >URL sumber<input
          formControlName="url"
          type="url"
          placeholder="https://..."
      /></label>
      <label
        >Kutipan / isi sumber<textarea
          formControlName="excerpt"
          rows="8"
          maxlength="50000"
          placeholder="Tempel bagian materi yang relevan, bukan hanya alamat website."
        ></textarea>
      </label>
      <button [disabled]="busy || form.invalid">
        {{ busy ? 'Menyimpan…' : 'Tambah sumber' }}
      </button>
    </form>
    <p *ngIf="loading">Memuat sumber…</p>
    <p *ngIf="!loading && !sources.length">Belum ada sumber untuk ebook ini.</p>
    <article *ngFor="let source of sources">
      <label
        ><input
          type="checkbox"
          [checked]="source.selected"
          (change)="toggle(source.id)"
        />{{ source.title }}</label
      ><a [href]="source.url" target="_blank" rel="noopener noreferrer">{{
        source.publisher
      }}</a>
    </article>
    <button (click)="continue()" [disabled]="busy || !selectedCount">
      Lanjut ke tujuan belajar
    </button>
  </section>`,
  styles: [
    `
      .sources {
        max-width: 850px;
        margin: 32px auto;
        padding: 32px;
        background: white;
        border-radius: 18px;
      }
      label {
        display: block;
        margin: 14px 0;
      }
      input:not([type='checkbox']),
      textarea {
        display: block;
        width: 100%;
        padding: 10px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
      }
      button {
        padding: 12px 20px;
        background: #4338ca;
        color: white;
        border: 0;
        border-radius: 8px;
        margin: 12px 0;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
      }
      article {
        padding: 12px;
        border-bottom: 1px solid #ddd;
      }
      input[type='checkbox'] {
        margin-right: 10px;
      }
    `,
  ],
})
export class SourceReviewPageComponent implements OnInit {
  private service = inject(ResearchService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private get id(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }
  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    publisher: ['', Validators.required],
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    excerpt: ['', Validators.required],
  });
  sources: Source[] = [];
  busy = false;
  loading = true;
  get selectedCount(): number {
    return this.sources.filter((s) => s.selected).length;
  }
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.service.getSources(this.id).subscribe({
      next: (s) => {
        this.sources = s;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
  add(): void {
    if (this.form.invalid || this.busy) return;
    this.busy = true;
    this.service.addSource(this.id, this.form.getRawValue()).subscribe({
      next: () => {
        this.busy = false;
        this.form.reset();
        this.load();
      },
      error: () => (this.busy = false),
    });
  }
  toggle(id: string): void {
    this.sources = this.sources.map((s) =>
      s.id === id ? { ...s, selected: !s.selected } : s,
    );
  }
  continue(): void {
    this.busy = true;
    this.service
      .updateSelectedSources(
        this.id,
        this.sources.filter((s) => s.selected).map((s) => s.id),
      )
      .subscribe({
        next: () => this.router.navigate(['/ebooks', this.id, 'learning-plan']),
        error: () => (this.busy = false),
      });
  }
}
