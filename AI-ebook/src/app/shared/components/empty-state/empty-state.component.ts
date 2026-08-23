import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-box">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .empty-box {
        border-radius: 18px;
        background: #f7f5f3;
        border: 1px solid #e2e1df;
        padding: 24px;
        text-align: center;
      }
    `
  ]
})
export class EmptyStateComponent {
  @Input() title = '';
}
