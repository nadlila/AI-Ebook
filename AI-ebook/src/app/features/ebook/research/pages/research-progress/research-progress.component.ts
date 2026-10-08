import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-research-progress',
  standalone: true,
  template: `<p>Membuka sumber referensi…</p>`,
})
export class ResearchProgressPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  ngOnInit(): void {
    this.router.navigate(
      ['/ebooks', this.route.snapshot.paramMap.get('id'), 'sources'],
      { replaceUrl: true },
    );
  }
}
