import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { environment } from '../../../../../../environments/environment';

interface StockPhoto { id: string; preview: string; image: string; photographerUrl: string; url: string; photographer: string; alt: string; }
@Component({
  selector: 'app-stock-cover', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <div class="backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="stock-title">
      <header><h2 id="stock-title">Cari gambar cover sesuai topik</h2><button type="button" (click)="closed.emit()" [disabled]="saving">Tutup</button></header>
      <p>Gambar disediakan oleh <a href="https://unsplash.com/?utm_source=thinkerlab_ebook&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a>. Pencarian ini tidak menggunakan Gemini.</p>
      <form (ngSubmit)="search(1)"><label for="cover-query">Kata kunci topik</label>
        <div class="search"><input id="cover-query" name="query" [(ngModel)]="query" maxlength="150" required />
        <button [disabled]="busy || saving || !query.trim()">Cari gambar</button></div>
      </form>
      <p>Ubah kata kunci jika hasil kurang sesuai. Coba istilah singkat, misalnya education, technology, atau nature.</p>
      <p role="status" *ngIf="busy">Memuat gambar...</p><p role="alert" *ngIf="error || saveError">{{ error || saveError }}</p>
      <p *ngIf="searched && !busy && !photos.length">Tidak ada hasil. Coba kata kunci lain.</p>
      <div class="layout"><div>
        <div class="results"><article *ngFor="let photo of photos">
          <button type="button" (click)="choose(photo)" [disabled]="busy || saving" [class.selected]="selected?.id === photo.id" [attr.aria-label]="'Pilih foto ' + photo.photographer">
            <img [src]="photo.preview" [alt]="photo.alt || 'Foto cover'" loading="lazy" />
          </button>
          <span>Foto oleh <a [href]="photo.photographerUrl" target="_blank" rel="noopener noreferrer">{{ photo.photographer }}</a> di <a [href]="photo.url" target="_blank" rel="noopener noreferrer">Unsplash</a></span>
        </article></div>
        <nav *ngIf="searched"><button type="button" (click)="search(page - 1)" [disabled]="busy || saving || page === 1">Sebelumnya</button>
          <span>Halaman {{ page }}</span><button type="button" (click)="search(page + 1)" [disabled]="busy || saving || photos.length < 12 || page >= 100">Berikutnya</button></nav>
      </div><div class="composer">
        <canvas #preview width="480" height="720" aria-label="Preview desain cover"></canvas>
        <div *ngIf="selected">
          <label for="cover-title-text">Judul pada cover</label><input id="cover-title-text" [(ngModel)]="title" (ngModelChange)="draw()" maxlength="200" [disabled]="saving" />
          <label for="cover-author">Nama penulis (opsional)</label><input id="cover-author" [(ngModel)]="author" (ngModelChange)="draw()" maxlength="80" [disabled]="saving" />
          <label for="cover-zoom">Zoom gambar</label><input id="cover-zoom" type="range" min="1" max="2" step="0.05" [(ngModel)]="zoom" (ngModelChange)="draw()" [disabled]="saving" />
          <label for="cover-x">Posisi horizontal</label><input id="cover-x" type="range" min="0" max="1" step="0.01" [(ngModel)]="x" (ngModelChange)="draw()" [disabled]="saving" />
          <label for="cover-y">Posisi vertikal</label><input id="cover-y" type="range" min="0" max="1" step="0.01" [(ngModel)]="y" (ngModelChange)="draw()" [disabled]="saving" />
          <button type="button" (click)="useCover()" [disabled]="busy || saving || !image || !title.trim()">{{ saving ? 'Menyimpan...' : 'Gunakan cover ini' }}</button>
        </div>
      </div></div>
    </section></div>
  `,
  styles: [`
    .backdrop { position: fixed; inset: 0; z-index: 1000; background: #0009; overflow-y: auto; padding: 24px; }
    .dialog { max-width: 1050px; margin: auto; background: white; padding: 24px; border-radius: 16px; }
    header,.search,nav { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    h2 { margin: 0; font-size: 1.3rem; } p { color: #555; line-height: 1.5; } [role=alert] { color: #a22; }
    .layout { display: grid; grid-template-columns: 1fr 290px; gap: 24px; margin-top: 20px; }
    .results { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; }
    article img { width: 100%; height: 150px; object-fit: cover; display: block; }
    article button { padding: 3px; width: 100%; } article a { font-size: .75rem; }
    button { cursor: pointer; padding: 10px 14px; border: 1px solid #bbb; border-radius: 7px; background: #f5f4f0; }
    button.selected { outline: 3px solid #333; } button:disabled { opacity: .5; cursor: default; }
    input { box-sizing: border-box; width: 100%; padding: 10px; border: 1px solid #bbb; border-radius: 6px; }
    label { display: block; margin: 12px 0 6px; font-size: .9rem; } .search input { flex: 1; min-width: 0; }
    canvas { width: 100%; height: auto; background: #eee; border-radius: 8px; } nav { margin-top: 16px; }
    @media(max-width: 700px) { .layout { grid-template-columns: 1fr; } .composer { max-width: 320px; } .results { grid-template-columns: repeat(2,minmax(0,1fr)); } .backdrop { padding: 8px; } }
  `]
})
export class StockCoverComponent implements OnInit {
  @Input({required: true}) ebookId = '';
  @Input() ebookTitle = '';
  @Input() saving = false;
  @Input() saveError = '';
  @Output() closed = new EventEmitter<void>();
  @Output() coverChosen = new EventEmitter<File>();
  @ViewChild('preview', {static: true}) preview!: ElementRef<HTMLCanvasElement>;
  private readonly http = inject(HttpClient);
  query = ''; title = ''; author = ''; page = 1; busy = false; searched = false; error = '';
  photos: StockPhoto[] = []; selected: StockPhoto | null = null; image: HTMLImageElement | null = null;
  zoom = 1; x = .5; y = .5;
  private get endpoint(): string { return environment.apiBaseUrl + '/ebooks/' + this.ebookId + '/cover/photos'; }
  ngOnInit(): void { this.query = this.ebookTitle.slice(0,150); this.title = this.ebookTitle; }
  search(page: number): void {
    if (this.busy || this.saving || !this.query.trim()) return;
    this.busy = true; this.error = ''; this.searched = true;
    this.http.get<StockPhoto[]>(this.endpoint, {params: {query: this.query.trim(), page}}).subscribe({
      next: photos => { this.photos = photos; this.page = page; this.busy = false; },
      error: e => { this.busy = false; this.error = e.error?.detail || 'Pencarian gambar gagal. Coba lagi.'; }
    });
  }
  choose(photo: StockPhoto): void {
    if (this.busy || this.saving) return;
    this.busy = true; this.error = ''; this.selected = photo; this.image = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { this.image = img; this.zoom = 1; this.x = this.y = .5; this.busy = false; this.draw(); };
    img.onerror = () => { this.busy = false; this.error = 'Gambar Unsplash tidak dapat dimuat. Pilih foto lain atau coba lagi.'; };
    // Hotlink the original CDN URL, preserving its tracking parameters.
    img.src = photo.image;
  }

  private wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
    const lines: string[] = []; let line = '';
    for (const char of Array.from(text.trim())) {
      if (char === '\n' || ctx.measureText(line + char).width > width) { lines.push(line.trim()); line = char === '\n' ? '' : char; }
      else line += char;
    }
    if (line.trim()) lines.push(line.trim()); return lines;
  }
  draw(): void {
    if (!this.image) return;
    const ctx = this.preview.nativeElement.getContext('2d'); if (!ctx) return;
    const img = this.image;
    const scale = Math.max(480 / img.width, 720 / img.height) * Number(this.zoom);
    const width = img.width * scale, height = img.height * scale;
    ctx.clearRect(0,0,480,720); ctx.drawImage(img, -(width - 480) * Number(this.x), -(height - 720) * Number(this.y), width, height);
    const gradient = ctx.createLinearGradient(0,180,0,720); gradient.addColorStop(0,'rgba(0,0,0,0)'); gradient.addColorStop(1,'rgba(0,0,0,.9)');
    ctx.fillStyle = gradient; ctx.fillRect(0,0,480,720); ctx.fillStyle = 'white'; ctx.textBaseline = 'top';
    let size = 42; let lines: string[] = [];
    do { ctx.font = 'bold ' + size + 'px sans-serif'; lines = this.wrap(ctx, this.title, 400); if (lines.length <= 6) break; size -= 2; } while (size > 20);
    const top = Math.max(200, 590 - lines.length * size * 1.2);
    lines.forEach((line,i) => ctx.fillText(line,40,top + i * size * 1.2));
    ctx.font = '22px sans-serif'; ctx.fillText(this.author.trim(),40,625,400);
    ctx.font = '12px sans-serif'; ctx.fillText('Foto: ' + (this.selected?.photographer || '') + ' / Unsplash',40,684,400);
  }
  useCover(): void {
    if (!this.image || this.busy || this.saving || !this.title.trim()) return;
    this.busy = true; this.error = '';
    this.draw();
    try {
      this.preview.nativeElement.toBlob(blob => {
        if (!blob) { this.busy = false; this.error = 'Cover gagal dibuat. Coba lagi.'; return; }
        this.http.post(this.endpoint + '/' + this.selected!.id + '/download', {}).subscribe({
          next: () => { this.busy = false; this.coverChosen.emit(new File([blob], 'cover-unsplash.jpg', {type:'image/jpeg'})); },
          error: e => { this.busy = false; this.error = e.error?.detail || 'Cover belum dapat dipilih. Coba lagi.'; }
        });
      }, 'image/jpeg', .9);
    } catch {
      this.busy = false; this.error = 'Gambar tidak dapat diproses menjadi cover. Pilih foto lain.';
    }
  }
}
