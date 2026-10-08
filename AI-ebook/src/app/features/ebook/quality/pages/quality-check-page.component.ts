import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EbookService } from '../../../../core/services/ebook.service';
@Component({
  selector: 'app-quality-check-page',
  standalone: true,
  imports: [CommonModule],
  template: ` <section
    style="max-width:850px;margin:32px auto;background:white;padding:32px;border-radius:16px"
  >
    <h1>Pemeriksaan struktur konten</h1>
    <p>
      Pemeriksaan ini mencari blok kosong, referensi yang belum terhubung, dan
      paragraf identik. Akurasi fakta dan kualitas tulisan tetap perlu kamu
      tinjau.
    </p>
    <p *ngIf="loading">Memeriksa konten yang tersimpan…</p>
    <p *ngIf="failed">Pemeriksaan gagal. Kembali ke editor lalu coba lagi.</p>
    <div *ngIf="result">
      <h2>
        {{
          result.passed
            ? 'Tidak ada penghalang struktural'
            : 'Perbaikan diperlukan'
        }}
      </h2>
      <p *ngIf="!result.issues.length">Tidak ditemukan masalah struktural.</p>
      <ul>
        <li *ngFor="let issue of result.issues">
          {{ issue.severity }} — {{ issue.description }}
        </li>
      </ul>
    </div>
    <button (click)="goBack()">Kembali ke editor</button>
    <button [disabled]="!result?.passed" (click)="done()">
      Lanjut ke detail
    </button>
  </section>`,
})
export class QualityCheckPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ebooks = inject(EbookService);
  result: any;
  loading = true;
  failed = false;
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ebooks.runQualityCheck(id).subscribe({
      next: (r) => {
        this.result = r;
        this.loading = false;
      },
      error: () => {
        this.failed = true;
        this.loading = false;
      },
    });
  }
  goBack(): void {
    this.router.navigate([
      '/ebooks',
      this.route.snapshot.paramMap.get('id'),
      'editor',
    ]);
  }
  done(): void {
    if (this.result?.passed)
      this.router.navigate([
        '/ebooks',
        this.route.snapshot.paramMap.get('id'),
        'detail',
      ]);
  }
}
